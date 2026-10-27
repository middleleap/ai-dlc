using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    internal sealed partial class WorkerExecution
    {
        private const string Artifact = "shuttle_artifactversion";
        internal void RecordFile()
        {
            Load(true, true); RequireLease();
            var id = Parameter<string>("FileId"); var v = Parameter<string>("FileVersion"); var tag = Parameter<string>("FileETag");
            Bounded(id, 500); Bounded(v, 200); Bounded(tag, 500);
            if (HasFile() && (Required<string>(work, Fields.FileId) != id || Required<string>(work, Fields.Version) != v || Required<string>(work, Fields.ETag) != tag))
                throw new BoundaryException("FILE_IDENTITY_CONFLICT");
            var proof = VerifyFile(id, v, tag);
            if (HasFile())
            {
                EvidenceMatches(proof);
                if (state == WorkState.FileSaved) { FileReceipt("FileSaved"); return; }
            }
            RequireLoadedVersion();
            if (Stale()) { End(WorkState.Superseded, "CONTENT_REVISION_CHANGED"); return; }
            var patch = Patch(); patch[Fields.FileId] = proof.FileId; patch[Fields.Version] = proof.Version; patch[Fields.ETag] = proof.ETag;
            patch[Fields.FileHash] = proof.Sha256; patch[Fields.FileBytes] = proof.ByteLength; patch[Fields.FileInputHash] = proof.InputHash;
            patch[Fields.State] = new OptionSetValue((int)WorkState.FileSaved); Commit(patch);
            context.OutputParameters["Result"] = "FileSaved";
            context.OutputParameters["FileSha256"] = proof.Sha256; context.OutputParameters["FileByteLength"] = proof.ByteLength.ToString(System.Globalization.CultureInfo.InvariantCulture);
            context.OutputParameters["FileId"] = proof.FileId; context.OutputParameters["FileVersion"] = proof.Version; context.OutputParameters["FileETag"] = proof.ETag;
        }
        internal void FinalizeFile()
        {
            Load(true, true);
            if (TerminalReceiptOrDisposition(true)) return;
            RequireLoadedVersion(); RequireLease();
            if (state != WorkState.FileSaved) throw new BoundaryException("FILE_NOT_RECORDED");
            var proof = VerifyFile(Required<string>(work, Fields.FileId), Required<string>(work, Fields.Version), Required<string>(work, Fields.ETag));
            EvidenceMatches(proof); RequireArtifactKey();
            var artifactId = StableId("artifact"); var eventId = StableId("render-event");
            if (Find(Artifact, "shuttle_externalwork", work.Id).Entities.Count != 0 || Find(Schema.Event, "shuttle_businesseventid", eventId).Entities.Count != 0)
                throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            var superseded = Stale(); RequireLease();
            var artifact = new Entity(Artifact, artifactId) {
                ["shuttle_name"] = "Synthetic readiness pack " + proposal.RequestKey.ToString("D"),
                [Schema.CaseLookup] = new EntityReference(Schema.Case, caseRow.Id), [Fields.Proposal] = new EntityReference(Schema.Proposal, proposalRow.Id),
                ["shuttle_externalwork"] = new EntityReference(Schema.Work, work.Id), [Schema.ContentRevision] = checked((int)proposal.ExpectedContentRevision),
                [Fields.FileId] = proof.FileId, [Fields.Version] = proof.Version, [Fields.ETag] = proof.ETag, [Fields.FileHash] = proof.Sha256,
                [Fields.Template] = Required<string>(work, Fields.Template), [Fields.Skill] = Required<string>(work, Fields.Skill),
                ["shuttle_registrationstate"] = superseded ? "Superseded" : "Registered", ["ownerid"] = Required<EntityReference>(caseRow, "ownerid") };
            if (writer.Create(artifact) != artifactId) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            var evt = new Entity(Schema.Event, eventId) {
                ["shuttle_name"] = superseded ? "Artifact superseded" : "Artifact registered",
                [Schema.CaseLookup] = new EntityReference(Schema.Case, caseRow.Id), [Fields.Proposal] = new EntityReference(Schema.Proposal, proposalRow.Id),
                ["shuttle_operation"] = superseded ? "ArtifactSuperseded" : "ArtifactRegistered", [Schema.Hash] = Required<string>(work, Fields.InputHash),
                [Schema.Actor] = new EntityReference("systemuser", context.InitiatingUserId), [Schema.Writer] = new EntityReference("systemuser", context.UserId),
                ["shuttle_occurredat"] = now, ["shuttle_correlationid"] = work.Id.ToString("D"), ["ownerid"] = Required<EntityReference>(caseRow, "ownerid") };
            if (writer.Create(evt) != eventId) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            // All writes execute within the required synchronous pipeline transaction.
            var patch = Patch(); patch[Fields.State] = new OptionSetValue((int)(superseded ? WorkState.Superseded : WorkState.Complete));
            patch[Fields.Error] = superseded ? "CONTENT_REVISION_CHANGED" : null;
            Commit(patch, superseded ? (Guid?)null : artifactId);
            context.OutputParameters["ArtifactVersionId"] = artifactId; FileReceipt(superseded ? "Superseded" : "Complete", false);
        }
        private ExactFileEvidence VerifyFile(string id, string version, string etag)
        {
            var provider = providerFactory == null ? null : providerFactory();
            if (provider == null) throw new BoundaryException("PROVIDER_VERIFIER_NOT_INSTALLED");
            var owner = Reference(caseRow, "ownerid", "systemuser");
            if (owner.Id != context.InitiatingUserId || Reference(proposalRow, Schema.Actor, "systemuser").Id != owner.Id)
                throw new BoundaryException("PROVIDER_OWNER_POLICY_MISMATCH");
            var user = caller.Retrieve("systemuser", context.InitiatingUserId, new ColumnSet("azureactivedirectoryobjectid", "isdisabled"));
            if (user == null || user.Id != context.InitiatingUserId || Required<bool>(user, "isdisabled")) throw new BoundaryException("PROVIDER_OWNER_POLICY_MISMATCH");
            var entra = Required<Guid>(user, "azureactivedirectoryobjectid");
            if (entra == Guid.Empty) throw new BoundaryException("PROVIDER_OWNER_POLICY_MISMATCH");
            var read = provider.Read(new ProviderRequest {
                FileId = id, Version = version, ETag = etag, StorageKey = Required<string>(work, Fields.StorageKey), InputHash = Required<string>(work, Fields.InputHash),
                CaseId = caseRow.Id, CaseOwnerId = owner.Id, CallerEntraObjectId = entra,
                ExpectedControls = RenderControls.Build(proposal, Required<string>(caseRow, "shuttle_factsjson"), proposalRow.Id, work.Id, Utc(Required<DateTime>(proposalRow, Schema.CommittedAt))),
                RecheckSourceAccess = () => {
                    var current = caller.Retrieve(Schema.Case, caseRow.Id, new ColumnSet(Schema.SourceBindings, "shuttle_factsjson", "ownerid"));
                    if (current == null || current.Id != caseRow.Id || current.RowVersion != caseRow.RowVersion ||
                        Required<string>(current, "shuttle_factsjson") != Required<string>(caseRow, "shuttle_factsjson")) throw new BoundaryException("CASE_ROW_VERSION_CONFLICT");
                    OwnerMatches(caseRow, current); policy.Sources.Authorize(proposal, Required<string>(current, Schema.SourceBindings));
                } });
            RequireLease();
            return ExactFileEvidence.FromProviderRead(read, id, version, etag, Required<string>(work, Fields.StorageKey), DateTime.UtcNow, Required<string>(work, Fields.InputHash));
        }
        private void EvidenceMatches(ExactFileEvidence proof)
        {
            if (Required<string>(work, Fields.FileHash) != proof.Sha256 || Required<long>(work, Fields.FileBytes) != proof.ByteLength ||
                Required<string>(work, Fields.FileInputHash) != proof.InputHash) throw new BoundaryException("FILE_EVIDENCE_CONFLICT");
        }
        private void RequireArtifactKey()
        {
            var m = ((RetrieveEntityResponse)writer.Execute(new RetrieveEntityRequest { LogicalName = Artifact, EntityFilters = EntityFilters.All, RetrieveAsIfPublished = false })).EntityMetadata;
            if (m == null || m.Keys == null || !m.Keys.Any(k => k.EntityKeyIndexStatus == EntityKeyIndexStatus.Active && k.KeyAttributes != null &&
                k.KeyAttributes.Length == 1 && k.KeyAttributes[0] == "shuttle_externalwork")) throw new BoundaryException("ACTIVE_ARTIFACT_KEY_REQUIRED");
        }
        private EntityCollection Find(string table, string attribute, Guid id)
        {
            var query = new QueryExpression(table) { ColumnSet = new ColumnSet(true), TopCount = 2 };
            query.Criteria.AddCondition(attribute, ConditionOperator.Equal, id);
            var rows = caller.RetrieveMultiple(query);
            if (rows == null || rows.MoreRecords || rows.Entities.Count > 1) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            return rows;
        }
        private void HistoricalReceipt(bool checkToken)
        {
            if (checkToken && (Parameter<string>("LeaseToken") != Required<string>(work, Fields.Token) || Reference(work, Fields.Worker, "systemuser").Id != context.InitiatingUserId))
                throw new BoundaryException("LEASE_OWNER_MISMATCH");
            var rows = Find(Artifact, "shuttle_externalwork", work.Id);
            if (rows.Entities.Count != 1) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            var a = rows.Entities[0]; OwnerMatches(caseRow, a);
            if (a.Id != StableId("artifact") || Reference(a, Schema.CaseLookup, Schema.Case).Id != caseRow.Id || Reference(a, Fields.Proposal, Schema.Proposal).Id != proposalRow.Id ||
                Required<int>(a, Schema.ContentRevision) != proposal.ExpectedContentRevision ||
                new[] { Fields.FileId, Fields.Version, Fields.ETag, Fields.FileHash, Fields.Template, Fields.Skill }.Any(f => Required<string>(a, f) != Required<string>(work, f)) ||
                Required<string>(work, Fields.FileInputHash) != Required<string>(work, Fields.InputHash) || Required<long>(work, Fields.FileBytes) < 1 ||
                Required<string>(a, "shuttle_registrationstate") != (state == WorkState.Complete ? "Registered" : "Superseded")) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            var events = Find(Schema.Event, "shuttle_businesseventid", StableId("render-event"));
            if (events.Entities.Count != 1) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            var e = events.Entities[0]; OwnerMatches(caseRow, e);
            if (Reference(e, Schema.CaseLookup, Schema.Case).Id != caseRow.Id || Reference(e, Fields.Proposal, Schema.Proposal).Id != proposalRow.Id ||
                Required<string>(e, Schema.Hash) != Required<string>(work, Fields.InputHash) || Required<string>(e, "shuttle_correlationid") != work.Id.ToString("D") ||
                Required<string>(e, "shuttle_operation") != (state == WorkState.Complete ? "ArtifactRegistered" : "ArtifactSuperseded")) throw new BoundaryException("REGISTRATION_STATE_CONFLICT");
            // Access checked historical receipt grants no current pointer or approval.
            context.OutputParameters["ArtifactVersionId"] = a.Id; FileReceipt("HistoricalReceipt");
        }
        private bool TerminalReceiptOrDisposition(bool checkToken)
        {
            if (state == WorkState.Complete) { HistoricalReceipt(checkToken); return true; }
            if (state != WorkState.Superseded) return false;
            var count = new[] { Fields.Token, Fields.Worker, Fields.Expires }.Count(f => Present(work, f));
            if (count != 0 && count != 3) throw new BoundaryException("WORK_LEASE_INTEGRITY");
            if (count == 3) HistoricalReceipt(checkToken);
            else
            {
                // Expired or failed work can be superseded before any artifact was
                // registered. Known file evidence survives, but is not an artifact receipt.
                context.OutputParameters["Result"] = "Superseded";
                context.OutputParameters["WorkRowVersion"] = work.RowVersion;
            }
            return true;
        }
        private void FileReceipt(string result, bool includeVersion = true)
        {
            context.OutputParameters["Result"] = result;
            if (includeVersion) context.OutputParameters["WorkRowVersion"] = work.RowVersion;
            context.OutputParameters["FileId"] = Required<string>(work, Fields.FileId); context.OutputParameters["FileVersion"] = Required<string>(work, Fields.Version);
            context.OutputParameters["FileETag"] = Required<string>(work, Fields.ETag); context.OutputParameters["FileSha256"] = Required<string>(work, Fields.FileHash);
            context.OutputParameters["FileByteLength"] = Required<long>(work, Fields.FileBytes).ToString(System.Globalization.CultureInfo.InvariantCulture);
        }
        private Guid StableId(string kind)
        {
            using (var sha = SHA256.Create()) { var hash = sha.ComputeHash(Encoding.UTF8.GetBytes("shuttle-" + kind + "-v1:" + work.Id.ToString("D"))); var bytes = new byte[16]; Array.Copy(hash, bytes, 16); return new Guid(bytes); }
        }
        private void RequireLoadedVersion() { if (Parameter<string>("ExpectedWorkRowVersion") != work.RowVersion) throw new BoundaryException("WORK_ROW_VERSION_CONFLICT"); }
    }
}
