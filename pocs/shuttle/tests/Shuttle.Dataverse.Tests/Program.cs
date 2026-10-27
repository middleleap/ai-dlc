using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json.Nodes;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using Shuttle.Dataverse;
using Shuttle.Guards;

internal static partial class Program
{
    static int checks;
    static readonly string Pack = File.ReadAllText(Path.Combine(System.AppContext.BaseDirectory, "fixtures/pack-draft.json"));
    static readonly string Comment = File.ReadAllText(Path.Combine(System.AppContext.BaseDirectory, "fixtures/inspection-comment.json"));
    static readonly string Bindings = File.ReadAllText(Path.Combine(System.AppContext.BaseDirectory, "fixtures/embedded-sources.json"));
    static readonly string Config = "{\"policy\":\"LAB_EMBEDDED_SOURCES\",\"enabled\":true}";
    static readonly Guid Actor = Guid.Parse("99999999-9999-4999-8999-999999999999"), Writer = Guid.Parse("88888888-8888-4888-8888-888888888888");

    static void Main()
    {
        Check(StrictWireDecoder.Decode(Pack).Kind == ProposalKind.PackDraft, "valid pack");
        Check(StrictWireDecoder.Decode(Comment).Kind == ProposalKind.InspectionComment, "valid comment wire");
        RejectWire(Pack.Replace("\"schemaVersion\":", "\"actor\":\"admin\",\"schemaVersion\":"), "UNKNOWN_JSON_PROPERTY");
        RejectWire(Pack.Replace("\"schemaVersion\":", "\"kind\":\"PackDraft\",\"schemaVersion\":"), "DUPLICATE_JSON_PROPERTY");
        RejectWire(Pack.Replace("\"title\": \"Decision brief\"", "\"title\": \"Decision brief\", \"title\": \"Changed\""), "DUPLICATE_JSON_PROPERTY");
        RejectWire(Pack.Replace("\"PackDraft\"", "'PackDraft'"), "INVALID_JSON");
        RejectWire(Pack.Replace("\"kind\":", "/*a*/\"kind\":"), "INVALID_JSON");
        RejectWire(Pack.TrimEnd().Substring(0, Pack.TrimEnd().Length - 1) + ",}", "INVALID_JSON");
        RejectWire(Pack + "{}", "INVALID_JSON");
        RejectWire(Pack.Replace("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA"), "INVALID_IDENTIFIER");
        RejectWire(Pack.Replace("\"expectedContentRevision\": 1", "\"expectedContentRevision\": 1.0"), "INVALID_REVISION");
        RejectWire(Pack.Replace("\"expectedContentRevision\": 1", "\"expectedContentRevision\": 2147483648"), "INVALID_REVISION");
        RejectWire(Comment.Replace("\"text\":", "\"approved\":true,\"text\":"), "UNKNOWN_JSON_PROPERTY");
        var malformedUnicode = JsonNode.Parse(Pack); malformedUnicode["payload"]["sections"][0]["text"] = "x";
        RejectWire(malformedUnicode.ToJsonString().Replace("\"text\":\"x\"", "\"text\":\"\\uD800\""), "INVALID_UNICODE");
        RejectWire(new string(' ', StrictWireDecoder.MaxWireBytes + 1) + Pack, "JSON_TOO_LARGE");
        Boundary(() => EmbeddedSourcePolicy.FromSecureConfiguration(null), "INVALID_JSON");
        Boundary(() => EmbeddedSourcePolicy.FromSecureConfiguration(Config.Replace("true", "false")), "LAB_POLICY_NOT_ENABLED");
        Boundary(() => EmbeddedSourcePolicy.FromSecureConfiguration(Config.Replace("LAB_EMBEDDED_SOURCES", "SHAREPOINT")), "LAB_POLICY_NOT_ENABLED");
        var policy = EmbeddedSourcePolicy.FromSecureConfiguration(Config);
        Check(policy.Authorize(StrictWireDecoder.Decode(Pack), Bindings).Count == 4, "pinned embedded sources");
        Boundary(() => policy.Authorize(StrictWireDecoder.Decode(Comment), Bindings), "FILE_ACL_VERIFIER_NOT_CONFIGURED");
        Boundary(() => policy.Authorize(StrictWireDecoder.Decode(Pack.Replace(Schema.TemplateRelease, "uninstalled")), Bindings), "RELEASE_NOT_INSTALLED");
        var changedSources = JsonNode.Parse(Bindings); changedSources["sources"][0]["content"] = "changed";
        Boundary(() => policy.Authorize(StrictWireDecoder.Decode(Pack), changedSources.ToJsonString()), "SOURCE_INTEGRITY");
        changedSources = JsonNode.Parse(Bindings); changedSources["sources"][0]["url"] = "https://example.org";
        Boundary(() => policy.Authorize(StrictWireDecoder.Decode(Pack), changedSources.ToJsonString()), "UNKNOWN_JSON_PROPERTY");

        using (var f = new Fixture())
        {
            f.Pre();
            Check(f.FactoryUsers.SequenceEqual(new[] { Writer, Actor }), "explicit writer and initiating caller services");
            Check(f.Caller.CaseReads == 1 && f.Writer.CaseReads == 0, "case/source retrieved as caller");
            Check(f.Writer.Updates.Count == 1, "one CAS");
            var update = f.Writer.Updates.Single();
            Check(update.ConcurrencyBehavior == ConcurrencyBehavior.IfRowVersionMatches && update.Target.RowVersion == "17", "explicit rowversion matching");
            Check((long)update.Target[Schema.GuardSequence] == 5 && !update.Target.Contains(Schema.ContentRevision), "CAS advances guard only");
            Check(f.Target.GetAttributeValue<EntityReference>(Schema.Actor).Id == Actor && f.Target.GetAttributeValue<EntityReference>(Schema.Writer).Id == Writer, "server actors");
            f.Post();
            Check(f.Writer.Creates.Select(x => x.LogicalName).SequenceEqual(new[] { Schema.Event, Schema.Work }), "event and outbox emitted");
            Check(f.Writer.Creates[1].GetAttributeValue<OptionSetValue>("shuttle_workstate").Value == 1, "pending render work");
            Check(f.Writer.Creates.All(x => x.GetAttributeValue<EntityReference>("ownerid").Id == Actor), "case ownership inherited");
        }
        PluginReject(f => f.Properties["IsInTransaction"] = false, "PIPELINE_CONFIGURATION");
        PluginReject(f => f.Properties["Depth"] = 2, "PIPELINE_CONFIGURATION");
        PluginReject(f => f.Target["ownerid"] = new EntityReference("systemuser", Guid.NewGuid()), "PLATFORM_ATTRIBUTE_INVALID");
        using (var f = new Fixture())
        {
            f.AddObservedPlatformFields(); f.Pre(); f.Post();
            Check(f.Writer.Creates.Count == 2 && f.Writer.UserReads == 1, "observed stage20 system shape passes after scoped BU validation");
            Check(f.Target.GetAttributeValue<EntityReference>("ownerid").Id == Actor && f.Target.GetAttributeValue<EntityReference>(Schema.Actor).Id == Actor && f.Target.GetAttributeValue<EntityReference>(Schema.Writer).Id == Writer, "platform compatibility fields cannot override context authority or trusted owner");
        }
        using (var f = new Fixture())
        {
            f.AddObservedPlatformFields();
            f.Target["createdby"] = new EntityReference("systemuser", Writer);
            f.Target["modifiedonbehalfby"] = new EntityReference("systemuser", Actor);
            f.Target["createdon"] = new DateTime(2000, 1, 1); f.Pre();
            Check(f.Target.GetAttributeValue<DateTime>(Schema.CommittedAt).Year >= 2026 && f.Target.GetAttributeValue<EntityReference>(Schema.Actor).Id == Actor, "audit compatibility fields never determine actor or committed time");
        }
        using (var f = new Fixture())
        {
            f.Target["ownerid"] = new EntityReference("systemuser", Actor); f.Pre();
            Check(f.Target.GetAttributeValue<EntityReference>("ownerid").Id == Actor, "explicit matching default owner indistinguishable at stage20 and harmlessly accepted");
        }
        using (var f = new Fixture())
        {
            f.Target["ownerid"] = new EntityReference("systemuser", Actor);
            var trustedOwner = Guid.NewGuid(); f.Caller.CaseRow["ownerid"] = new EntityReference("team", trustedOwner); f.Pre();
            Check(f.Target.GetAttributeValue<EntityReference>("ownerid").LogicalName == "team" && f.Target.GetAttributeValue<EntityReference>("ownerid").Id == trustedOwner, "owner always overwritten from caller-authorized Case, not incoming default");
        }
        foreach (var name in PlatformCreateFields.ObservedNames)
        {
            PluginReject(f => f.Target[name] = "bad-type", "PLATFORM_ATTRIBUTE_INVALID");
            if (name != "modifiedonbehalfby") PluginReject(f => f.Target[name] = null, "PLATFORM_ATTRIBUTE_INVALID");
        }
        foreach (var name in new[] { "createdby", "modifiedby", "modifiedonbehalfby", "ownerid", "owninguser" })
        {
            PluginReject(f => f.Target[name] = new EntityReference("systemuser", Guid.NewGuid()), "PLATFORM_ATTRIBUTE_INVALID");
            PluginReject(f => f.Target[name] = new EntityReference("team", Actor), "PLATFORM_ATTRIBUTE_INVALID");
            PluginReject(f => f.Target[name] = new EntityReference("systemuser", Guid.Empty), "PLATFORM_ATTRIBUTE_INVALID");
            PluginReject(f => { var reference = new EntityReference("systemuser", Actor); reference.KeyAttributes["alternate"] = "untrusted"; f.Target[name] = reference; }, "PLATFORM_ATTRIBUTE_INVALID");
        }
        PluginReject(f => f.Target["owningbusinessunit"] = new EntityReference("businessunit", Guid.NewGuid()), "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["owningbusinessunit"] = new EntityReference("systemuser", f.Writer.ActorBusinessUnit), "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["owningbusinessunit"] = new EntityReference("businessunit", Guid.Empty), "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => { f.AddObservedPlatformFields(); f.Writer.MissingBusinessUnit = true; }, "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["statecode"] = new OptionSetValue(1), "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["statuscode"] = new OptionSetValue(2), "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["createdon"] = DateTime.MinValue, "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["modifiedon"] = DateTime.MinValue, "PLATFORM_ATTRIBUTE_INVALID");
        PluginReject(f => f.Target["createdonbehalfby"] = new EntityReference("systemuser", Actor), "RESERVED_OR_UNKNOWN_ATTRIBUTE");
        PluginReject(f => f.Target["overriddencreatedon"] = DateTime.UtcNow, "RESERVED_OR_UNKNOWN_ATTRIBUTE");
        PluginReject(f => f.Target[Schema.Actor] = new EntityReference("systemuser", Actor), "RESERVED_OR_UNKNOWN_ATTRIBUTE");
        using (var f = new Fixture())
        {
            f.Target["zz_sensitive_name"] = "SECRET_ATTRIBUTE_VALUE";
            f.Target["a_bad;\nSECRET_INJECTION"] = "SECRET_OTHER_VALUE";
            f.Target.KeyAttributes["key_name"] = "SECRET_KEY_VALUE";
            RejectPlugin(f.Pre, "RESERVED_OR_UNKNOWN_ATTRIBUTE");
            var line = f.Trace.Lines.Single(x => x.StartsWith("SHUTTLE_TARGET_SHAPE"));
            Check(line.StartsWith("SHUTTLE_TARGET_SHAPE stage=20; attributes=redacted_name,shuttle_case,"), "trace names sorted and invalid logical names redacted");
            Check(line.EndsWith("zz_sensitive_name; keys=key_name") && !line.Contains("SECRET"), "shape trace contains names only, never values");
            Check(f.Writer.Updates.Count == 0, "shape instrumentation does not relax unknown fields");
        }
        using (var f = new Fixture())
        {
            for (var i = 0; i < 1000; i++) f.Target["z_" + i.ToString("D4")] = "secret";
            RejectPlugin(f.Pre, "RESERVED_OR_UNKNOWN_ATTRIBUTE");
            var line = f.Trace.Lines.Single(x => x.StartsWith("SHUTTLE_TARGET_SHAPE"));
            Check(line.Contains(",truncated_names; keys=") && line.Length < 64 * 129 + 100, "shape trace bounded under oversized attacker attribute set");
        }
        using (var f = new Fixture()) { f.Target.Id = Guid.NewGuid(); f.Pre(); f.Post(); Check(f.Writer.Creates.Count == 2, "explicit primary GUID is not a replay key"); }
        PluginReject(f => f.Target[Schema.Proposal + "id"] = "wrong-type", "MISSING_OR_INVALID_ATTRIBUTE");
        PluginReject(f => f.Target["createdon"] = "not-a-date", "PLATFORM_ATTRIBUTE_INVALID");
        using (var f = new Fixture()) { f.Pre(); f.Target["createdon"] = DateTime.UtcNow; f.Post(false); Check(f.Writer.Creates.Count == 2, "Post accepts known platform columns and OutputParameters id without Target.Id"); }
        using (var f = new Fixture()) { f.Pre(); f.PreparePost(); ((ParameterCollection)f.Properties["OutputParameters"])["id"] = Guid.NewGuid(); RejectPlugin(f.ExecutePost, "PROPOSAL_ID_MISSING"); }
        using (var f = new Fixture()) { f.Pre(); f.PreparePost(); f.Target["unexpectedplatformcolumn"] = "reject"; RejectPlugin(f.ExecutePost, "RESERVED_OR_UNKNOWN_ATTRIBUTE"); }
        PluginReject(f => f.Target[Schema.Revision] = 2, "ENVELOPE_MISMATCH");
        PluginReject(f => f.Writer.ActiveKey = false, "ACTIVE_REQUEST_KEY_REQUIRED");
        PluginReject(f => f.Writer.HasCreatePrivilege = false, "OPERATION_DENIED");
        PluginReject(f => f.Writer.CaseAccess = AccessRights.None, "ACCESS_DENIED");
        PluginReject(f => f.Caller.CaseRow.Attributes.Remove(Schema.SourceBindings), "MISSING_OR_INVALID_ATTRIBUTE");
        PluginReject(f => f.Caller.CaseRow[Schema.ContentRevision] = 2, "STALE_CONTENT_REVISION");
        PluginReject(f => f.Caller.CaseRow.RowVersion = null, "CONCURRENCY_CONTEXT_REQUIRED");
        PluginReject(f => f.Caller.CaseRow[Schema.GuardSequence] = long.MaxValue, "CONCURRENCY_CONTEXT_REQUIRED");
        PluginReject(f => f.Caller.ReceiptHash = CanonicalProposal.Hash(StrictWireDecoder.Decode(Pack)), "REPLAY_RECONCILIATION_REQUIRED");
        PluginReject(f => f.Caller.ReceiptHash = new string('0', 64), "REQUEST_KEY_CONFLICT");
        using (var f = new Fixture())
        {
            f.Caller.ReceiptHash = CanonicalProposal.Hash(StrictWireDecoder.Decode(Pack));
            f.Writer.CaseAccess = AccessRights.None;
            RejectPlugin(f.Pre, "ACCESS_DENIED"); Check(f.Caller.ReceiptQueries == 0, "denied retry does not inspect receipts");
        }
        using (var f = new Fixture())
        {
            f.Writer.FailUpdate = true;
            RejectPlugin(f.Pre, "PLATFORM_OPERATION_FAILED");
            Check(!f.Shared.ContainsKey(Schema.SharedValidated) && !f.Target.Contains(Schema.Actor), "CAS failure does not mark validated");
            Check(f.Trace.Lines.Single(x => x.StartsWith("Shuttle boundary:")).Contains("stage=20") && f.Trace.Lines.Single(x => x.StartsWith("Shuttle boundary:")).Contains("System.InvalidOperationException"), "trace includes bounded stage and exception type");
            Check(!f.Trace.Lines.Single(x => x.StartsWith("Shuttle boundary:")).Contains("injected concurrency failure"), "trace omits exception message");
        }
        using (var f = new Fixture())
        {
            f.Writer.UpdateFault = new System.ServiceModel.FaultException<OrganizationServiceFault>(new OrganizationServiceFault { ErrorCode = -12345, Message = "sensitive inner data" }, "sensitive outer data");
            RejectPlugin(f.Pre, "PLATFORM_OPERATION_FAILED");
            Check(f.Trace.Lines.Single(x => x.StartsWith("Shuttle boundary:")).Contains("sdkFaultErrorCode=-12345") && !f.Trace.Lines.Single(x => x.StartsWith("Shuttle boundary:")).Contains("sensitive"), "trace includes only numeric SDK fault code");
        }
        using (var f = new Fixture())
        {
            f.Pre(); f.Target[Schema.Hash] = new string('0', 64);
            RejectPlugin(f.Post, "VALIDATION_STATE_MISMATCH"); Check(f.Writer.Creates.Count == 0, "tampered target emits no event");
        }
        using (var f = new Fixture())
        {
            f.Pre(); f.Shared.Clear(); RejectPlugin(f.Post, "VALIDATION_STATE_MISSING");
            Check(f.Writer.Creates.Count == 0, "missing preoperation blocks post");
        }
        using (var f = new Fixture())
        {
            f.Pre(); f.Writer.FailCreateTable = Schema.Event;
            RejectPlugin(f.Post, "PLATFORM_OPERATION_FAILED"); Check(f.Writer.Creates.Count == 0, "event failure aborts before work");
        }
        using (var f = new Fixture())
        {
            f.Pre(); f.Writer.FailCreateTable = Schema.Work;
            RejectPlugin(f.Post, "PLATFORM_OPERATION_FAILED"); Check(f.Writer.Creates.Count == 1, "work failure propagates; rollback needs tenant proof");
        }
        TestTimestampReleaseCommit();
        Console.WriteLine($"PASS: {checks} local adapter assertions. SDK fakes do not prove Dataverse transactions, ACLs, native integration or packaging compatibility.");
    }
    static void Check(bool condition, string message) { checks++; if (!condition) throw new Exception("FAIL: " + message); }
    static void RejectWire(string json, string code) => Boundary(() => StrictWireDecoder.Decode(json), code);
    static void Boundary(Action action, string code) { try { action(); } catch (BoundaryException ex) { Check(ex.Code == code, code + " got " + ex.Code); return; } throw new Exception("Expected " + code); }
    static void RejectPlugin(Action action, string code) { try { action(); } catch (InvalidPluginExecutionException ex) { Check(ex.Message == "SHUTTLE:" + code, code + " got " + ex.Message); return; } throw new Exception("Expected " + code); }
    static void PluginReject(Action<Fixture> setup, string code)
    { using (var f = new Fixture()) { setup(f); RejectPlugin(f.Pre, code); Check(f.Writer.Updates.Count == 0 && f.Writer.Creates.Count == 0, code + " has no writes"); } }

    internal sealed class Fixture : IServiceProvider, IOrganizationServiceFactory, IDisposable
    {
        internal readonly FakeService Caller = new FakeService(), Writer = new FakeService();
        internal readonly FakeTrace Trace = new FakeTrace();
        internal readonly List<Guid> FactoryUsers = new List<Guid>();
        internal readonly Dictionary<string, object> Properties;
        internal readonly Entity Target;
        internal readonly ParameterCollection Shared = new ParameterCollection();
        readonly IPluginExecutionContext context;
        internal Fixture()
        {
            var p = StrictWireDecoder.Decode(Pack);
            Target = new Entity(Schema.Proposal) {
                [Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId), [Schema.Kind] = new OptionSetValue(1),
                [Schema.SchemaVersion] = p.SchemaVersion, [Schema.Revision] = 1, [Schema.RequestKey] = p.RequestKey.ToString("D"), [Schema.Payload] = Pack };
            context = DispatchProxy.Create<IPluginExecutionContext, ContextProxy>();
            Properties = ((ContextProxy)context).Values;
            Properties["Stage"] = 20; Properties["Mode"] = 0; Properties["Depth"] = 1;
            Properties["IsInTransaction"] = true; Properties["MessageName"] = "Create"; Properties["PrimaryEntityName"] = Schema.Proposal;
            Properties["UserId"] = Program.Writer; Properties["InitiatingUserId"] = Actor; Properties["CorrelationId"] = Guid.NewGuid();
            Properties["InputParameters"] = new ParameterCollection { ["Target"] = Target }; Properties["SharedVariables"] = Shared;
            Caller.CaseRow = new Entity(Schema.Case, p.CaseId) { RowVersion = "17", [Schema.ContentRevision] = 1,
                [Schema.GuardSequence] = 4L, [Schema.SourceBindings] = Bindings, ["ownerid"] = new EntityReference("systemuser", Actor) };
        }
        public object GetService(Type t) => t == typeof(IPluginExecutionContext) ? context : t == typeof(IOrganizationServiceFactory) ? this : t == typeof(ITracingService) ? Trace : null;
        public IOrganizationService CreateOrganizationService(Guid? userId) { if (!userId.HasValue) throw new Exception("Unexpected SYSTEM"); FactoryUsers.Add(userId.Value); return userId == Actor ? Caller : Writer; }
        internal void AddObservedPlatformFields()
        {
            Target["createdby"] = new EntityReference("systemuser", Actor); Target["modifiedby"] = new EntityReference("systemuser", Actor);
            Target["createdon"] = DateTime.UtcNow; Target["modifiedon"] = DateTime.UtcNow; Target["modifiedonbehalfby"] = null;
            Target["ownerid"] = new EntityReference("systemuser", Actor); Target["owninguser"] = new EntityReference("systemuser", Actor);
            Target["owningbusinessunit"] = new EntityReference("businessunit", Writer.ActorBusinessUnit);
            Target["statecode"] = new OptionSetValue(0); Target["statuscode"] = new OptionSetValue(1);
        }
        internal void Pre() => new ValidateDraftProposal(null, Config).Execute(this);
        internal void PreparePost(bool populateTarget = true) { Properties["Stage"] = 40; var id = Target.Id == Guid.Empty ? Guid.NewGuid() : Target.Id; if (populateTarget) Target.Id = id; Properties["PrimaryEntityId"] = id; Properties["OutputParameters"] = new ParameterCollection { ["id"] = id }; }
        internal void ExecutePost() => new CommitProposalEventAndWork(null, Config).Execute(this);
        internal void Post() => Post(true);
        internal void Post(bool populateTarget) { PreparePost(populateTarget); ExecutePost(); }
        public void Dispose() { }
    }
    internal sealed class FakeTrace : ITracingService
    {
        internal readonly List<string> Lines = new List<string>();
        public void Trace(string format, params object[] args) => Lines.Add(string.Format(System.Globalization.CultureInfo.InvariantCulture, format, args));
    }
    public class ContextProxy : DispatchProxy
    {
        public Dictionary<string, object> Values { get; } = new Dictionary<string, object>();
        protected override object Invoke(MethodInfo targetMethod, object[] args)
        {
            var name = targetMethod.Name.StartsWith("get_") ? targetMethod.Name.Substring(4) : targetMethod.Name;
            if (Values.TryGetValue(name, out var value)) return value;
            return targetMethod.ReturnType.IsValueType ? Activator.CreateInstance(targetMethod.ReturnType) : null;
        }
    }
    internal sealed class FakeService : IOrganizationService
    {
        internal bool ActiveKey = true, HasCreatePrivilege = true, FailUpdate;
        internal Exception UpdateFault;
        internal AccessRights CaseAccess = AccessRights.ReadAccess | AccessRights.AppendToAccess;
        internal string ReceiptHash, FailCreateTable;
        internal Entity CaseRow;
        internal int CaseReads, ReceiptQueries, UserReads;
        internal Guid ActorBusinessUnit = Guid.NewGuid();
        internal bool MissingBusinessUnit;
        internal readonly List<UpdateRequest> Updates = new List<UpdateRequest>();
        internal readonly List<Entity> Creates = new List<Entity>();
        static readonly Guid CreateId = Guid.NewGuid(), ReadId = Guid.NewGuid(), AppendId = Guid.NewGuid();
        public Guid Create(Entity entity) { if (entity.LogicalName == FailCreateTable) throw new InvalidOperationException("injected platform failure"); Creates.Add(entity); return Guid.NewGuid(); }
        public Entity Retrieve(string entityName, Guid id, ColumnSet columns)
        {
            if (entityName == "systemuser") { UserReads++; var actor = new Entity("systemuser", id); if (!MissingBusinessUnit) actor["businessunitid"] = new EntityReference("businessunit", ActorBusinessUnit); return actor; }
            CaseReads++; return CaseRow;
        }
        public EntityCollection RetrieveMultiple(QueryBase q)
        {
            ReceiptQueries++; var rows = new EntityCollection();
            if (ReceiptHash != null) { var p = StrictWireDecoder.Decode(Pack); rows.Entities.Add(new Entity(Schema.Proposal, Guid.NewGuid())
            { [Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId), [Schema.RequestKey] = p.RequestKey.ToString("D"), [Schema.Hash] = ReceiptHash }); }
            return rows;
        }
        public OrganizationResponse Execute(OrganizationRequest request)
        {
            if (request is RetrieveEntityRequest)
            {
                var meta = new EntityMetadata();
                var key = new EntityKeyMetadata { KeyAttributes = new[] { Schema.CaseLookup, Schema.RequestKey } };
                Set(key, "EntityKeyIndexStatus", ActiveKey ? EntityKeyIndexStatus.Active : EntityKeyIndexStatus.Pending);
                Set(meta, "Keys", new[] { key });
                var privileges = new[] { Privilege(PrivilegeType.Create, CreateId), Privilege(PrivilegeType.Read, ReadId), Privilege(PrivilegeType.Append, AppendId) };
                Set(meta, "Privileges", privileges); return new RetrieveEntityResponse { Results = new ParameterCollection { ["EntityMetadata"] = meta } };
            }
            if (request is RetrieveUserPrivilegesRequest)
                return new RetrieveUserPrivilegesResponse { Results = new ParameterCollection { ["RolePrivileges"] = (HasCreatePrivilege ? new[] { CreateId, ReadId, AppendId } : new[] { ReadId, AppendId }).Select(id => new RolePrivilege { PrivilegeId = id }).ToArray() } };
            if (request is RetrievePrincipalAccessRequest) return new RetrievePrincipalAccessResponse { Results = new ParameterCollection { ["AccessRights"] = CaseAccess } };
            if (request is UpdateRequest update) { if (UpdateFault != null) throw UpdateFault; if (FailUpdate) throw new InvalidOperationException("injected concurrency failure"); Updates.Add(update); return new UpdateResponse(); }
            throw new NotSupportedException(request.RequestName);
        }
        static SecurityPrivilegeMetadata Privilege(PrivilegeType type, Guid id) { var p = (SecurityPrivilegeMetadata)Activator.CreateInstance(typeof(SecurityPrivilegeMetadata), true); Set(p, "PrivilegeType", type); Set(p, "PrivilegeId", id); return p; }
        static void Set(object o, string name, object value) => o.GetType().GetProperty(name).SetValue(o, value);
        public void Update(Entity entity) => throw new Exception("Unsafe Update used instead of explicit CAS");
        public void Delete(string name, Guid id) => throw new NotSupportedException();
        public void Associate(string name, Guid id, Relationship relationship, EntityReferenceCollection related) => throw new NotSupportedException();
        public void Disassociate(string name, Guid id, Relationship relationship, EntityReferenceCollection related) => throw new NotSupportedException();
    }
}
