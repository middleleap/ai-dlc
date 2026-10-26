using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using Shuttle.Guards;

namespace Shuttle.Dataverse
{
    public abstract class ProposalPlugin : IPlugin
    {
        private readonly string secureConfiguration;
        protected ProposalPlugin(string secure) { secureConfiguration = secure; }
        protected abstract int Stage { get; }
        public void Execute(IServiceProvider services)
        {
            var context = (IPluginExecutionContext)services.GetService(typeof(IPluginExecutionContext));
            var trace = (ITracingService)services.GetService(typeof(ITracingService));
            try
            {
                if (context == null || context.Stage != Stage || context.Mode != 0 || !context.IsInTransaction ||
                    context.MessageName != "Create" || context.PrimaryEntityName != Schema.Proposal || context.Depth != 1 ||
                    context.InitiatingUserId == Guid.Empty || context.UserId == Guid.Empty)
                    throw new BoundaryException("PIPELINE_CONFIGURATION");
                var factory = (IOrganizationServiceFactory)services.GetService(typeof(IOrganizationServiceFactory));
                if (factory == null || !context.InputParameters.TryGetValue("Target", out var rawTarget) || !(rawTarget is Entity target))
                    throw new BoundaryException("PIPELINE_CONFIGURATION");
                // Names only, bounded and sanitized: no attribute values, IDs or payload content.
                trace?.Trace("SHUTTLE_TARGET_SHAPE stage={0}; attributes={1}; keys={2}",
                    context.Stage, DiagnosticNames(target.Attributes.Keys), DiagnosticNames(target.KeyAttributes.Keys));
                // The effective writer is the explicitly registered step principal; never SYSTEM/null.
                var writer = factory.CreateOrganizationService(context.UserId);
                var caller = factory.CreateOrganizationService(context.InitiatingUserId);
                if (writer == null || caller == null) throw new BoundaryException("PIPELINE_CONFIGURATION");
                ExecuteBoundary(context, target, writer, caller, secureConfiguration);
            }
            catch (BoundaryException ex)
            {
                trace?.Trace("Shuttle boundary: {0}", ex.Code);
                throw new InvalidPluginExecutionException("SHUTTLE:" + ex.Code);
            }
            catch (Exception ex)
            {
                // Do not expose data, inner platform faults or a partial receipt; failure rolls back.
                var fault = ex as System.ServiceModel.FaultException<OrganizationServiceFault>;
                trace?.Trace("Shuttle boundary: PLATFORM_OPERATION_FAILED; stage={0}; exceptionType={1}; sdkFaultErrorCode={2}",
                    context == null ? -1 : context.Stage, ex.GetType().FullName,
                    fault == null || fault.Detail == null ? "none" : fault.Detail.ErrorCode.ToString(System.Globalization.CultureInfo.InvariantCulture));
                throw new InvalidPluginExecutionException("SHUTTLE:PLATFORM_OPERATION_FAILED");
            }
        }
        private static string DiagnosticNames(IEnumerable<string> names)
        {
            // Logical names cannot contain separators. Redact invalid input instead of
            // copying caller-controlled text into trace. Limit output independently of input.
            var ordered = names.Select(name => !string.IsNullOrEmpty(name) && name.Length <= 128 &&
                name.All(c => c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '_')
                ? name : "redacted_name").Distinct(StringComparer.Ordinal).OrderBy(n => n, StringComparer.Ordinal).Take(65).ToArray();
            return string.Join(",", ordered.Take(64).Concat(ordered.Length > 64 ? new[] { "truncated_names" } : new string[0]));
        }
        protected abstract void ExecuteBoundary(IPluginExecutionContext context, Entity target, IOrganizationService writer, IOrganizationService caller, string secure);

        protected static Proposal DecodeTarget(Entity target, bool postOperation)
        {
            var allowed = new HashSet<string>(new[] { Schema.CaseLookup, Schema.Kind, Schema.SchemaVersion, Schema.Revision, Schema.RequestKey, Schema.Payload, Schema.Proposal + "id" }, StringComparer.Ordinal);
            if (!postOperation) allowed.UnionWith(PlatformCreateFields.ObservedNames);
            if (postOperation)
                allowed.UnionWith(new[] { "shuttle_name", Schema.Hash, Schema.Actor, Schema.Writer, Schema.CommittedAt, "ownerid",
                    "createdon", "createdby", "createdonbehalfby", "modifiedon", "modifiedby", "modifiedonbehalfby",
                    "owningbusinessunit", "owninguser", "owningteam", "statecode", "statuscode", "versionnumber" });
            if (target.LogicalName != Schema.Proposal || target.KeyAttributes.Count != 0 || target.Attributes.Keys.Any(k => !allowed.Contains(k))) throw new BoundaryException("RESERVED_OR_UNKNOWN_ATTRIBUTE");
            // The platform may populate primary ID before/after the core operation. It is
            // not the replay key or authority; Create cannot overwrite an existing record.
            if (target.Contains(Schema.Proposal + "id") &&
                (Required<Guid>(target, Schema.Proposal + "id") == Guid.Empty || Required<Guid>(target, Schema.Proposal + "id") != target.Id))
                throw new BoundaryException("PROPOSAL_ID_MISMATCH");
            var p = StrictWireDecoder.Decode(Required<string>(target, Schema.Payload));
            var caseRef = Required<EntityReference>(target, Schema.CaseLookup);
            if (caseRef.LogicalName != Schema.Case || caseRef.Id != p.CaseId || caseRef.KeyAttributes.Count != 0 ||
                Required<string>(target, Schema.SchemaVersion) != p.SchemaVersion ||
                Required<OptionSetValue>(target, Schema.Kind).Value != (int)p.Kind ||
                Required<int>(target, Schema.Revision) != p.ExpectedContentRevision ||
                Required<string>(target, Schema.RequestKey) != p.RequestKey.ToString("D"))
                throw new BoundaryException("ENVELOPE_MISMATCH");
            return p;
        }
        protected static T Required<T>(Entity entity, string name)
        {
            if (!entity.Attributes.TryGetValue(name, out var value) || !(value is T)) throw new BoundaryException("MISSING_OR_INVALID_ATTRIBUTE");
            return (T)value;
        }
        protected static T Shared<T>(IPluginExecutionContext context, string name)
        {
            if (!context.SharedVariables.TryGetValue(name, out var value) || !(value is T)) throw new BoundaryException("VALIDATION_STATE_MISSING");
            return (T)value;
        }
    }

    public sealed class ValidateDraftProposal : ProposalPlugin
    {
        public ValidateDraftProposal() : base(null) { }
        public ValidateDraftProposal(string unsecure, string secure) : base(secure) { }
        protected override int Stage => 20;

        protected override void ExecuteBoundary(IPluginExecutionContext context, Entity target, IOrganizationService writer, IOrganizationService caller, string secure)
        {
            var policy = EmbeddedSourcePolicy.FromSecureConfiguration(secure);
            var p = DecodeTarget(target, false);
            PlatformCreateFields.Validate(target, context, writer);
            VerifyPrivilegesAndKey(writer, context.InitiatingUserId);
            var caseRef = new EntityReference(Schema.Case, p.CaseId);
            var access = (RetrievePrincipalAccessResponse)writer.Execute(new RetrievePrincipalAccessRequest
            { Principal = new EntityReference("systemuser", context.InitiatingUserId), Target = caseRef });
            var needed = AccessRights.ReadAccess | AccessRights.AppendToAccess;
            if ((access.AccessRights & needed) != needed) throw new BoundaryException("ACCESS_DENIED");
            // Caller-scoped retrieval is the source access check. Missing FLS-protected fields fail closed.
            var caseRow = caller.Retrieve(Schema.Case, p.CaseId, new ColumnSet(Schema.ContentRevision, Schema.GuardSequence, Schema.SourceBindings, "ownerid"));
            if (caseRow == null || caseRow.Id != p.CaseId) throw new BoundaryException("ACCESS_DENIED");
            var permittedSources = policy.Authorize(p, Required<string>(caseRow, Schema.SourceBindings));
            var owner = Required<EntityReference>(caseRow, "ownerid");
            if ((owner.LogicalName != "systemuser" && owner.LogicalName != "team") || owner.Id == Guid.Empty) throw new BoundaryException("CASE_OWNER_INVALID");
            var revision = Required<int>(caseRow, Schema.ContentRevision);
            var sequence = Required<long>(caseRow, Schema.GuardSequence);
            var trusted = new TrustedContext(context.InitiatingUserId, context.UserId, p.CaseId, revision, caseRow.RowVersion, sequence,
                true, true, true, false, permittedSources, new Guid[0], new Guid[0]);
            var decision = ProposalGuard.Evaluate(p, trusted, new DataverseReceiptLookup(caller));
            if (decision.Kind == DecisionKind.Reject) throw new BoundaryException(decision.Code);
            if (decision.Kind == DecisionKind.ReplayReceipt)
                // Native Create cannot turn into a successful retrieval of a different existing ID.
                throw new BoundaryException("REPLAY_RECONCILIATION_REQUIRED");
            if (string.IsNullOrWhiteSpace(caseRow.RowVersion) || sequence < 0 || sequence == long.MaxValue) throw new BoundaryException("CONCURRENCY_CONTEXT_REQUIRED");
            // Strengthens the pure core: every fresh kind takes the case CAS boundary, including PackDraft.
            var change = new Entity(Schema.Case, p.CaseId) { RowVersion = caseRow.RowVersion };
            change[Schema.GuardSequence] = checked(sequence + 1);
            writer.Execute(new UpdateRequest { Target = change, ConcurrencyBehavior = ConcurrencyBehavior.IfRowVersionMatches });
            var time = DateTime.UtcNow;
            target["ownerid"] = owner;
            target["shuttle_name"] = p.Kind + " " + p.RequestKey.ToString("D");
            target[Schema.Actor] = new EntityReference("systemuser", context.InitiatingUserId);
            target[Schema.Writer] = new EntityReference("systemuser", context.UserId);
            target[Schema.Hash] = decision.Plan.CanonicalHash;
            target[Schema.CommittedAt] = time;
            context.SharedVariables[Schema.SharedValidated] = true;
            context.SharedVariables[Schema.SharedActor] = context.InitiatingUserId;
            context.SharedVariables[Schema.SharedWriter] = context.UserId;
            context.SharedVariables[Schema.SharedHash] = decision.Plan.CanonicalHash;
            context.SharedVariables[Schema.SharedOwner] = owner;
            context.SharedVariables[Schema.SharedTime] = time;
        }

        private static void VerifyPrivilegesAndKey(IOrganizationService writer, Guid actor)
        {
            var metadata = ((RetrieveEntityResponse)writer.Execute(new RetrieveEntityRequest
            { LogicalName = Schema.Proposal, EntityFilters = EntityFilters.All, RetrieveAsIfPublished = false })).EntityMetadata;
            if (metadata == null || metadata.Keys == null || !metadata.Keys.Any(k => k.EntityKeyIndexStatus == EntityKeyIndexStatus.Active &&
                k.KeyAttributes != null && k.KeyAttributes.Length == 2 && new HashSet<string>(k.KeyAttributes, StringComparer.Ordinal).SetEquals(new[] { Schema.CaseLookup, Schema.RequestKey })))
                throw new BoundaryException("ACTIVE_REQUEST_KEY_REQUIRED");
            var userPrivileges = ((RetrieveUserPrivilegesResponse)writer.Execute(new RetrieveUserPrivilegesRequest { UserId = actor })).RolePrivileges;
            var held = new HashSet<Guid>((userPrivileges ?? new RolePrivilege[0]).Select(r => r.PrivilegeId));
            foreach (var type in new[] { PrivilegeType.Create, PrivilegeType.Read, PrivilegeType.Append })
            {
                var privilege = metadata.Privileges?.SingleOrDefault(p => p.PrivilegeType == type);
                if (privilege == null || !held.Contains(privilege.PrivilegeId)) throw new BoundaryException("OPERATION_DENIED");
            }
        }
    }

    public sealed class CommitProposalEventAndWork : ProposalPlugin
    {
        public CommitProposalEventAndWork() : base(null) { }
        public CommitProposalEventAndWork(string unsecure, string secure) : base(secure) { }
        protected override int Stage => 40;
        protected override void ExecuteBoundary(IPluginExecutionContext context, Entity target, IOrganizationService writer, IOrganizationService caller, string secure)
        {
            var p = DecodeTarget(target, true);
            if (!Shared<bool>(context, Schema.SharedValidated) || Shared<Guid>(context, Schema.SharedActor) != context.InitiatingUserId ||
                Shared<Guid>(context, Schema.SharedWriter) != context.UserId || Shared<string>(context, Schema.SharedHash) != CanonicalProposal.Hash(p))
                throw new BoundaryException("VALIDATION_STATE_MISMATCH");
            if (context.PrimaryEntityId == Guid.Empty || context.OutputParameters == null ||
                !context.OutputParameters.TryGetValue("id", out var outputId) || !(outputId is Guid) ||
                (Guid)outputId != context.PrimaryEntityId || (target.Id != Guid.Empty && target.Id != context.PrimaryEntityId))
                throw new BoundaryException("PROPOSAL_ID_MISSING");
            var owner = Shared<EntityReference>(context, Schema.SharedOwner);
            var time = Shared<DateTime>(context, Schema.SharedTime);
            if (Required<EntityReference>(target, "ownerid").Id != owner.Id || Required<EntityReference>(target, "ownerid").LogicalName != owner.LogicalName ||
                Required<EntityReference>(target, Schema.Actor).Id != context.InitiatingUserId || Required<EntityReference>(target, Schema.Actor).LogicalName != "systemuser" ||
                Required<EntityReference>(target, Schema.Writer).Id != context.UserId || Required<EntityReference>(target, Schema.Writer).LogicalName != "systemuser" ||
                Required<string>(target, Schema.Hash) != Shared<string>(context, Schema.SharedHash) || Required<DateTime>(target, Schema.CommittedAt) != time)
                throw new BoundaryException("VALIDATION_STATE_MISMATCH");
            var e = new Entity(Schema.Event);
            e["shuttle_name"] = p.Kind + " received";
            e[Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId);
            e["shuttle_proposal"] = new EntityReference(Schema.Proposal, context.PrimaryEntityId);
            e["shuttle_operation"] = p.Kind.ToString();
            e[Schema.Hash] = Shared<string>(context, Schema.SharedHash);
            e[Schema.Actor] = new EntityReference("systemuser", context.InitiatingUserId);
            e[Schema.Writer] = new EntityReference("systemuser", context.UserId);
            e["shuttle_occurredat"] = time;
            e["shuttle_correlationid"] = context.CorrelationId.ToString("D");
            e["ownerid"] = owner;
            writer.Create(e);
            if (p.Kind == ProposalKind.PackDraft)
            {
                var work = new Entity(Schema.Work);
                work["shuttle_name"] = "Render " + p.RequestKey.ToString("D");
                work[Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId);
                work["shuttle_proposal"] = new EntityReference(Schema.Proposal, context.PrimaryEntityId);
                work[Schema.Revision] = (int)p.ExpectedContentRevision;
                work["shuttle_inputhash"] = Shared<string>(context, Schema.SharedHash);
                work["shuttle_templaterelease"] = p.PackDraft.TemplateRelease;
                work["shuttle_skillrelease"] = p.PackDraft.SkillRelease;
                work["shuttle_workstate"] = new OptionSetValue(1);
                work["shuttle_attempts"] = 0;
                work["shuttle_outputstoragekey"] = p.CaseId.ToString("D") + "/" + p.RequestKey.ToString("D") + ".docx";
                work["ownerid"] = owner;
                writer.Create(work);
            }
        }
    }

    internal sealed class DataverseReceiptLookup : IReceiptLookup
    {
        private readonly IOrganizationService caller;
        internal DataverseReceiptLookup(IOrganizationService caller) { this.caller = caller; }
        public CommittedReceipt Find(Guid caseId, Guid requestKey)
        {
            var query = new QueryExpression(Schema.Proposal)
            { ColumnSet = new ColumnSet(Schema.CaseLookup, Schema.RequestKey, Schema.Hash), TopCount = 2 };
            query.Criteria.AddCondition(Schema.CaseLookup, ConditionOperator.Equal, caseId);
            query.Criteria.AddCondition(Schema.RequestKey, ConditionOperator.Equal, requestKey.ToString("D"));
            var rows = caller.RetrieveMultiple(query).Entities;
            if (rows.Count > 1) throw new BoundaryException("RECEIPT_INTEGRITY");
            if (rows.Count == 0) return null;
            var row = rows[0];
            if (row.GetAttributeValue<EntityReference>(Schema.CaseLookup)?.Id != caseId || row.GetAttributeValue<string>(Schema.RequestKey) != requestKey.ToString("D"))
                throw new BoundaryException("RECEIPT_INTEGRITY");
            return new CommittedReceipt(row.Id, caseId, requestKey, row.GetAttributeValue<string>(Schema.Hash), "AcceptedDraftInput");
        }
    }
}
