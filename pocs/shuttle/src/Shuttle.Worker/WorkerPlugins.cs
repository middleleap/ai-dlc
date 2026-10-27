using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Shuttle.Dataverse;
using Shuttle.Guards;

namespace Shuttle.Worker
{
    // Custom API PostOperation workaround is required: main-operation plug-ins cannot
    // receive secure step configuration. No parameterless configuration can enable this code.
    public abstract class WorkerPlugin : IPlugin
    {
        private readonly string secure;
        protected WorkerPlugin(string secureConfiguration) { secure = secureConfiguration; }
        protected abstract string Message { get; }
        protected abstract string[] Parameters { get; }
        public void Execute(IServiceProvider services)
        {
            var c = (IPluginExecutionContext)services.GetService(typeof(IPluginExecutionContext));
            var trace = (ITracingService)services.GetService(typeof(ITracingService));
            try
            {
                if (c == null || c.Stage != 40 || c.Mode != 0 || c.Depth != 1 || !c.IsInTransaction || c.MessageName != Message ||
                    c.InitiatingUserId == Guid.Empty || c.UserId == Guid.Empty || c.OrganizationId == Guid.Empty)
                    throw new BoundaryException("WORKER_PIPELINE_CONFIGURATION");
                var policy = WorkerPolicy.Parse(secure);
                policy.Authorize(c);
                if (c.InputParameters == null || c.OutputParameters == null || c.InputParameters.Count != Parameters.Length ||
                    c.InputParameters.Keys.Any(k => !Parameters.Contains(k, StringComparer.Ordinal)))
                    throw new BoundaryException("WORKER_PARAMETER_SHAPE");
                var factory = (IOrganizationServiceFactory)services.GetService(typeof(IOrganizationServiceFactory));
                if (factory == null) throw new BoundaryException("WORKER_PIPELINE_CONFIGURATION");
                var writer = factory.CreateOrganizationService(c.UserId);
                var caller = factory.CreateOrganizationService(c.InitiatingUserId);
                if (writer == null || caller == null) throw new BoundaryException("WORKER_PIPELINE_CONFIGURATION");
                Run(new WorkerExecution(c, policy, writer, caller, DateTime.UtcNow,
                    () => SharePointExactFileProviderFactory.Create(services, policy.ProviderConfiguration)));
            }
            catch (BoundaryException ex)
            {
                trace?.Trace("Shuttle worker: {0}", ex.Code);
                throw new InvalidPluginExecutionException("SHUTTLE:" + ex.Code);
            }
            catch (Exception)
            {
                trace?.Trace("Shuttle worker: PLATFORM_OPERATION_FAILED");
                throw new InvalidPluginExecutionException("SHUTTLE:PLATFORM_OPERATION_FAILED");
            }
        }
        private protected abstract void Run(WorkerExecution execution);
    }

    public sealed class ClaimRenderWork : WorkerPlugin
    {
        public ClaimRenderWork() : base(null) { }
        public ClaimRenderWork(string unsecure, string secure) : base(secure) { }
        protected override string Message => "shuttle_ClaimRenderWork";
        protected override string[] Parameters => new[] { "WorkId", "ExpectedWorkRowVersion" };
        private protected override void Run(WorkerExecution execution) => execution.Claim();
    }

    public sealed class RecordRenderFile : WorkerPlugin
    {
        public RecordRenderFile() : base(null) { }
        public RecordRenderFile(string unsecure, string secure) : base(secure) { }
        protected override string Message => "shuttle_RecordRenderFile";
        protected override string[] Parameters => new[] { "WorkId", "ExpectedWorkRowVersion", "LeaseToken", "FileId", "FileVersion", "FileETag" };
        private protected override void Run(WorkerExecution execution) => execution.RecordFile();
    }

    public sealed class FinalizeArtifact : WorkerPlugin
    {
        public FinalizeArtifact() : base(null) { }
        public FinalizeArtifact(string unsecure, string secure) : base(secure) { }
        protected override string Message => "shuttle_FinalizeArtifact";
        protected override string[] Parameters => new[] { "WorkId", "ExpectedWorkRowVersion", "LeaseToken" };
        private protected override void Run(WorkerExecution execution) => execution.FinalizeFile();
    }

    public sealed class RecordRenderFailure : WorkerPlugin
    {
        public RecordRenderFailure() : base(null) { }
        public RecordRenderFailure(string unsecure, string secure) : base(secure) { }
        protected override string Message => "shuttle_RecordRenderFailure";
        protected override string[] Parameters => new[] { "WorkId", "ExpectedWorkRowVersion", "LeaseToken", "Retryable", "ErrorCode" };
        private protected override void Run(WorkerExecution execution) => execution.Failure();
    }

    internal sealed partial class WorkerExecution
    {
        private readonly IPluginExecutionContext context;
        private readonly WorkerPolicy policy;
        private readonly IOrganizationService writer, caller;
        private readonly DateTime now;
        private readonly Func<IExactFileProvider> providerFactory;
        private Entity work, caseRow, proposalRow;
        private Proposal proposal;
        private WorkState state;
        private int attempts;
        private bool leaseAuthorityRequired;
        internal WorkerExecution(IPluginExecutionContext context, WorkerPolicy policy, IOrganizationService writer, IOrganizationService caller, DateTime now,
            Func<IExactFileProvider> providerFactory = null)
        { this.context = context; this.policy = policy; this.writer = writer; this.caller = caller; this.now = now; this.providerFactory = providerFactory; }

        internal void Claim()
        {
            Load(true, true);
            if (TerminalReceiptOrDisposition(false)) return;
            RequireLoadedVersion();
            if (state == WorkState.Leased || state == WorkState.FileSaved)
            {
                LeaseShape();
                if (Utc(Required<DateTime>(work, Fields.Expires)) > now) throw new BoundaryException("WORK_ALREADY_LEASED");
            }
            else if (state != WorkState.Pending && state != WorkState.RetryDue)
                throw new BoundaryException("WORK_STATE_NOT_CLAIMABLE");
            else if (Present(work, Fields.Token) || Present(work, Fields.Expires) || Present(work, Fields.Worker))
                throw new BoundaryException("WORK_LEASE_INTEGRITY");
            if (state == WorkState.Pending && (attempts != 0 || HasFile())) throw new BoundaryException("WORK_STATE_INTEGRITY");
            if (state == WorkState.RetryDue && attempts == 0) throw new BoundaryException("WORK_STATE_INTEGRITY");
            if (Stale()) { End(WorkState.Superseded, "CONTENT_REVISION_CHANGED"); return; }
            if (attempts >= policy.MaxAttempts) { End(WorkState.Failed, "ATTEMPTS_EXHAUSTED"); return; }
            var controls = RenderControls.Build(proposal, Required<string>(caseRow, "shuttle_factsjson"), proposalRow.Id, work.Id, Utc(Required<DateTime>(proposalRow, Schema.CommittedAt)));
            var token = Guid.NewGuid().ToString("D");
            var expiry = now.AddSeconds(policy.LeaseSeconds);
            var patch = Patch();
            patch[Fields.State] = new OptionSetValue((int)WorkState.Leased);
            patch[Fields.Token] = token; patch[Fields.Expires] = expiry;
            patch[Fields.Worker] = new EntityReference("systemuser", context.InitiatingUserId);
            patch[Fields.Attempts] = checked(attempts + 1); patch[Fields.Error] = null;
            Commit(patch);
            context.OutputParameters["Result"] = "Leased";
            context.OutputParameters["LeaseToken"] = token;
            context.OutputParameters["LeaseExpiresAt"] = expiry;
            context.OutputParameters["PayloadJson"] = Required<string>(proposalRow, Schema.Payload);
            context.OutputParameters["ControlsJson"] = System.Text.Json.JsonSerializer.Serialize(controls);
            context.OutputParameters["OutputStorageKey"] = Required<string>(work, Fields.StorageKey);
            // Existing metadata is a reconciliation hint, not verified provider evidence.
            context.OutputParameters["ExistingFileId"] = work.GetAttributeValue<string>(Fields.FileId) ?? "";
            context.OutputParameters["ExistingFileVersion"] = work.GetAttributeValue<string>(Fields.Version) ?? "";
            context.OutputParameters["ExistingFileETag"] = work.GetAttributeValue<string>(Fields.ETag) ?? "";
        }

        internal void Failure()
        {
            Load(false); RequireLease();
            var retry = Parameter<bool>("Retryable");
            var error = Parameter<string>("ErrorCode");
            if (!new[] { "WORD_TEMPORARY", "WORD_POLICY", "STORAGE_TEMPORARY", "STORAGE_CONFLICT", "PROVIDER_UNAVAILABLE", "RENDER_INVALID" }.Contains(error, StringComparer.Ordinal))
                throw new BoundaryException("FAILURE_CODE_NOT_ALLOWED");
            if (Stale()) { End(WorkState.Superseded, "CONTENT_REVISION_CHANGED"); return; }
            // No caller free text, URLs, raw payload, stack trace, or credentials are persisted.
            End(retry && attempts < policy.MaxAttempts ? WorkState.RetryDue : WorkState.Failed, error);
        }

        private void Load(bool checkSources, bool allowHistoricalVersion = false)
        {
            var id = Parameter<Guid>("WorkId");
            if (id == Guid.Empty) throw new BoundaryException("WORK_ID_INVALID");
            var version = Parameter<string>("ExpectedWorkRowVersion"); ValidateVersion(version);
            work = caller.Retrieve(Schema.Work, id, new ColumnSet(Schema.CaseLookup, Fields.Proposal, Schema.Revision, Fields.InputHash,
                Fields.Template, Fields.Skill, Fields.State, Fields.Attempts, Fields.StorageKey, Fields.Token, Fields.Expires,
                Fields.Worker, Fields.FileId, Fields.Version, Fields.ETag, Fields.FileHash, Fields.FileBytes, Fields.FileInputHash, "ownerid"));
            if (work == null || work.LogicalName != Schema.Work || work.Id != id) throw new BoundaryException("WORK_INTEGRITY");
            ValidateVersion(work.RowVersion);
            if (version != work.RowVersion && !allowHistoricalVersion) throw new BoundaryException("WORK_ROW_VERSION_CONFLICT");
            var caseRef = Reference(work, Schema.CaseLookup, Schema.Case);
            var proposalRef = Reference(work, Fields.Proposal, Schema.Proposal);
            caseRow = caller.Retrieve(Schema.Case, caseRef.Id, new ColumnSet(Schema.ContentRevision, Schema.GuardSequence, Schema.SourceBindings, "shuttle_factsjson", "shuttle_currentartifactversion", "ownerid"));
            proposalRow = caller.Retrieve(Schema.Proposal, proposalRef.Id, new ColumnSet(Schema.Payload, Schema.Hash, Schema.Kind, Schema.Revision,
                Schema.CaseLookup, Schema.SchemaVersion, Schema.RequestKey, Schema.Actor, Schema.Writer, Schema.CommittedAt, "ownerid"));
            if (caseRow == null || caseRow.Id != caseRef.Id || caseRow.LogicalName != Schema.Case ||
                proposalRow == null || proposalRow.Id != proposalRef.Id || proposalRow.LogicalName != Schema.Proposal)
                throw new BoundaryException("WORK_BINDING_MISMATCH");
            ValidateVersion(caseRow.RowVersion);
            if (Required<long>(caseRow, Schema.GuardSequence) < 0 || Required<long>(caseRow, Schema.GuardSequence) == long.MaxValue ||
                Required<int>(caseRow, Schema.ContentRevision) < 1) throw new BoundaryException("CASE_CONCURRENCY_CONTEXT");
            OwnerMatches(caseRow, work); OwnerMatches(caseRow, proposalRow);
            proposal = StrictWireDecoder.Decode(Required<string>(proposalRow, Schema.Payload));
            if (proposal.Kind != ProposalKind.PackDraft || proposal.PackDraft == null || proposal.CaseId != caseRef.Id ||
                Reference(proposalRow, Schema.CaseLookup, Schema.Case).Id != proposal.CaseId ||
                Required<OptionSetValue>(proposalRow, Schema.Kind).Value != (int)ProposalKind.PackDraft ||
                Required<string>(proposalRow, Schema.SchemaVersion) != proposal.SchemaVersion ||
                Required<string>(proposalRow, Schema.RequestKey) != proposal.RequestKey.ToString("D") ||
                Required<int>(proposalRow, Schema.Revision) != proposal.ExpectedContentRevision ||
                Required<int>(work, Schema.Revision) != proposal.ExpectedContentRevision ||
                Required<string>(work, Fields.InputHash) != CanonicalProposal.Hash(proposal) ||
                Required<string>(proposalRow, Schema.Hash) != Required<string>(work, Fields.InputHash) ||
                Required<string>(work, Fields.Template) != proposal.PackDraft.TemplateRelease ||
                Required<string>(work, Fields.Skill) != proposal.PackDraft.SkillRelease ||
                Required<string>(work, Fields.StorageKey) != proposal.CaseId.ToString("D") + "/" + proposal.RequestKey.ToString("D") + ".docx")
                throw new BoundaryException("WORK_BINDING_MISMATCH");
            // Resolve from the persisted, canonically hashed release for every action,
            // including failure/retry and historical paths which skip source rechecks.
            Schema.ResolveRenderContract(proposal.PackDraft.TemplateRelease, proposal.PackDraft.SkillRelease);
            Reference(proposalRow, Schema.Actor, "systemuser"); Reference(proposalRow, Schema.Writer, "systemuser");
            if (Utc(Required<DateTime>(proposalRow, Schema.CommittedAt)) > now) throw new BoundaryException("WORK_BINDING_MISMATCH");
            if (checkSources) policy.Sources.Authorize(proposal, Required<string>(caseRow, Schema.SourceBindings));
            var s = Required<OptionSetValue>(work, Fields.State).Value;
            if (!Enum.IsDefined(typeof(WorkState), s)) throw new BoundaryException("WORK_STATE_INTEGRITY");
            state = (WorkState)s; attempts = Required<int>(work, Fields.Attempts);
            if (attempts < 0 || attempts > 5) throw new BoundaryException("WORK_STATE_INTEGRITY");
            HasFile(); // Reject partial identity tuples before any transition.
        }

        private bool Stale() => Required<int>(caseRow, Schema.ContentRevision) != proposal.ExpectedContentRevision;
        private bool HasFile()
        {
            var fields = new[] { Fields.FileId, Fields.Version, Fields.ETag };
            var count = fields.Count(f => Present(work, f));
            if (count != 0 && count != fields.Length) throw new BoundaryException("FILE_IDENTITY_INCOMPLETE");
            if (count == 0 && new[] { Fields.FileHash, Fields.FileBytes, Fields.FileInputHash }.Any(f => Present(work, f))) throw new BoundaryException("FILE_IDENTITY_INCOMPLETE");
            if (count > 0)
            {
                Bounded(Required<string>(work, Fields.FileId), 500); Bounded(Required<string>(work, Fields.Version), 200); Bounded(Required<string>(work, Fields.ETag), 500);
                var hash = Required<string>(work, Fields.FileHash);
                if (hash.Length != 64 || hash.Any(c => !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f')) ||
                    Required<long>(work, Fields.FileBytes) < 1 || Required<long>(work, Fields.FileBytes) > 10 * 1024 * 1024 ||
                    Required<string>(work, Fields.FileInputHash) != Required<string>(work, Fields.InputHash)) throw new BoundaryException("FILE_EVIDENCE_INVALID");
            }
            return count > 0;
        }
        private void LeaseShape()
        {
            CanonicalId(Required<string>(work, Fields.Token));
            Reference(work, Fields.Worker, "systemuser");
            Utc(Required<DateTime>(work, Fields.Expires));
            if (attempts == 0 || (state == WorkState.FileSaved && !HasFile())) throw new BoundaryException("WORK_LEASE_INTEGRITY");
        }
        private void RequireLease()
        {
            if (state != WorkState.Leased && state != WorkState.FileSaved) throw new BoundaryException("WORK_NOT_LEASED");
            LeaseShape();
            var token = Parameter<string>("LeaseToken"); CanonicalId(token);
            if (Reference(work, Fields.Worker, "systemuser").Id != context.InitiatingUserId ||
                token != Required<string>(work, Fields.Token)) throw new BoundaryException("LEASE_OWNER_MISMATCH");
            if (Utc(Required<DateTime>(work, Fields.Expires)) <= DateTime.UtcNow) throw new BoundaryException("LEASE_EXPIRED");
            leaseAuthorityRequired = true;
        }
        private void End(WorkState next, string error)
        {
            var patch = Patch();
            patch[Fields.State] = new OptionSetValue((int)next); patch[Fields.Error] = error;
            patch[Fields.Token] = null; patch[Fields.Expires] = null; patch[Fields.Worker] = null;
            Commit(patch); context.OutputParameters["Result"] = next.ToString();
        }
        private Entity Patch() => new Entity(Schema.Work, work.Id) { RowVersion = work.RowVersion };
        private void Commit(Entity patch, Guid? currentArtifact = null)
        {
            // Do not use ExecuteTransaction inside a plug-in. The pipeline must provide the
            // transaction; both CAS operations and later failures must roll back together.
            if (leaseAuthorityRequired) RequireLease();
            var casePatch = new Entity(Schema.Case, caseRow.Id) { RowVersion = caseRow.RowVersion };
            casePatch[Schema.GuardSequence] = checked(Required<long>(caseRow, Schema.GuardSequence) + 1);
            if (currentArtifact.HasValue) casePatch["shuttle_currentartifactversion"] = new EntityReference("shuttle_artifactversion", currentArtifact.Value);
            writer.Execute(new UpdateRequest { Target = casePatch, ConcurrencyBehavior = ConcurrencyBehavior.IfRowVersionMatches });
            // CAS may wait for another transaction. Recheck expiry immediately before the
            // job transition; an expiry failure must roll back the preceding case CAS.
            if (leaseAuthorityRequired) RequireLease();
            writer.Execute(new UpdateRequest { Target = patch, ConcurrencyBehavior = ConcurrencyBehavior.IfRowVersionMatches });
            var committed = writer.Retrieve(Schema.Work, work.Id, new ColumnSet(false));
            if (committed == null || committed.Id != work.Id || committed.LogicalName != Schema.Work) throw new BoundaryException("WORK_INTEGRITY");
            ValidateVersion(committed.RowVersion);
            context.OutputParameters["WorkRowVersion"] = committed.RowVersion;
        }
        private T Parameter<T>(string name)
        {
            if (!context.InputParameters.TryGetValue(name, out var value) || !(value is T)) throw new BoundaryException("WORKER_PARAMETER_TYPE");
            return (T)value;
        }
        private static bool Present(Entity e, string field) => e.Contains(field) && e[field] != null;
        private static T Required<T>(Entity e, string field)
        {
            if (!e.Attributes.TryGetValue(field, out var value) || !(value is T)) throw new BoundaryException("WORKER_ATTRIBUTE_REQUIRED");
            return (T)value;
        }
        private static EntityReference Reference(Entity e, string field, string table)
        {
            var r = Required<EntityReference>(e, field);
            if (r.LogicalName != table || r.Id == Guid.Empty || r.KeyAttributes.Count != 0) throw new BoundaryException("WORK_BINDING_MISMATCH");
            return r;
        }
        private static void OwnerMatches(Entity basis, Entity row)
        {
            var owner = Required<EntityReference>(basis, "ownerid");
            if (owner.LogicalName != "systemuser" && owner.LogicalName != "team") throw new BoundaryException("WORK_OWNER_MISMATCH");
            var other = Reference(row, "ownerid", owner.LogicalName);
            if (owner.Id == Guid.Empty || owner.KeyAttributes.Count != 0 || other.Id != owner.Id) throw new BoundaryException("WORK_OWNER_MISMATCH");
        }
        internal static void Bounded(string value, int max)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Length > max || value.Any(char.IsControl)) throw new BoundaryException("FILE_IDENTITY_INVALID");
        }
        private static void ValidateVersion(string value)
        {
            if (string.IsNullOrEmpty(value) || value.Length > 40 || value.Any(c => c < '0' || c > '9')) throw new BoundaryException("ROW_VERSION_REQUIRED");
        }
        private static void CanonicalId(string value)
        {
            if (!Guid.TryParseExact(value, "D", out var id) || id == Guid.Empty || id.ToString("D") != value) throw new BoundaryException("LEASE_TOKEN_INVALID");
        }
        private static DateTime Utc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Local || value == DateTime.MinValue || value == DateTime.MaxValue) throw new BoundaryException("SERVER_TIME_INVALID");
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }
    }
}
