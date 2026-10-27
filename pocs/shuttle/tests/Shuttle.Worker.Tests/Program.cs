using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Shuttle.Dataverse;
using Shuttle.Guards;
using Shuttle.Worker;

internal static partial class Program
{
    static int checks;
    internal static readonly Guid Actor = Guid.Parse("99999999-9999-4999-8999-999999999999"), Writer = Guid.Parse("88888888-8888-4888-8888-888888888888"), Org = Guid.Parse("77777777-7777-4777-8777-777777777777");
    internal static readonly Guid WorkId = Guid.Parse("66666666-6666-4666-8666-666666666666"), ProposalId = Guid.Parse("55555555-5555-4555-8555-555555555555");
    internal static readonly string Token = "44444444-4444-4444-8444-444444444444";
    internal static readonly string Pack = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures/pack-draft.json"));
    internal static readonly string Sources = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures/embedded-sources.json"));
    internal static readonly string Config = JsonSerializer.Serialize(new { policy = "LAB_EMBEDDED_WORKER_V1", enabled = true, workerId = Actor.ToString("D"), writerId = Writer.ToString("D"), organisationId = Org.ToString("D"), leaseSeconds = 600, maxAttempts = 3 });

    static void Main(string[] args)
    {
        if (args.Length != 0)
        {
            if (args.Length != 3 || args[0] != "--verify-word-output") throw new ArgumentException("Expected --verify-word-output <actual-docx> <expected-controls-json>");
            var info = new FileInfo(args[1]);
            if (!info.Exists || info.Length < 1 || info.Length > 10 * 1024 * 1024) throw new ArgumentException("Actual DOCX exceeds provider bounds or is missing.");
            var expected = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(args[2]));
            var bytes = File.ReadAllBytes(args[1]); DocxControlBinding.Verify(bytes, expected);
            using var sha = System.Security.Cryptography.SHA256.Create();
            Console.WriteLine("PROVIDED DOCX LOCAL VALIDATION PASS; bytes=" + bytes.Length + "; sha256=" + BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant() + "; exact 17 values and OPC structure accepted. No authoring provenance, SharePoint ACL/token, Dataverse registration or native/ordinary-user qualification claimed.");
            return;
        }
        using (var f = new Fixture())
        {
            f.Claim();
            Check(f.FactoryUsers.SequenceEqual(new[] { Writer, Actor }), "explicit writer and worker scopes");
            Check(f.Caller.Reads == 3 && f.WriterService.Reads == 1, "bindings read as worker, receipt read as writer");
            Check(f.WriterService.Updates.Count == 2, "case and job CAS");
            Check(f.WriterService.Updates.All(x => x.ConcurrencyBehavior == ConcurrencyBehavior.IfRowVersionMatches), "both updates use CAS");
            Check(f.WriterService.Updates[0].Target.RowVersion == "17" && f.WriterService.Updates[1].Target.RowVersion == "19", "loaded row versions bound");
            Check(f.State == WorkState.Leased && (int)f.Work[Fields.Attempts] == 1, "fresh claim records state and attempt");
            Check(f.Work.GetAttributeValue<EntityReference>(Fields.Worker).Id == Actor, "lease persists fixed worker");
            Check(Guid.TryParseExact((string)f.Output["LeaseToken"], "D", out _), "server token");
            Check((DateTime)f.Output["LeaseExpiresAt"] > DateTime.UtcNow.AddMinutes(9), "bounded lease expiry");
            Check((string)f.Output["PayloadJson"] == Pack && (string)f.Output["OutputStorageKey"] == f.StorageKey, "frozen persisted input and stable server path");
            Check((string)f.Output["WorkRowVersion"] == "20", "post-write work version returned");
            Check(!f.WriterService.Updates.Any(u => u.Target.Contains(Schema.ContentRevision) || u.Target.Contains("shuttle_currentartifactversion") || u.Target.Contains("shuttle_acceptedartifactversion")), "claim changes neither basis nor artifact pointers");
        }
        RejectClaim(f => f.Properties["InitiatingUserId"] = Guid.NewGuid(), "WORKER_IDENTITY_DENIED");
        RejectClaim(f => f.Properties["UserId"] = Guid.NewGuid(), "WORKER_IDENTITY_DENIED");
        RejectClaim(f => f.Properties["OrganizationId"] = Guid.NewGuid(), "WORKER_IDENTITY_DENIED");
        RejectClaim(f => f.Properties["IsInTransaction"] = false, "WORKER_PIPELINE_CONFIGURATION");
        RejectClaim(f => f.Properties["Stage"] = 30, "WORKER_PIPELINE_CONFIGURATION");
        RejectClaim(f => f.Properties["Mode"] = 1, "WORKER_PIPELINE_CONFIGURATION");
        RejectClaim(f => f.Properties["Depth"] = 2, "WORKER_PIPELINE_CONFIGURATION");
        RejectClaim(f => f.Input["ActorId"] = Actor, "WORKER_PARAMETER_SHAPE");
        RejectClaim(f => f.Input["WorkId"] = "not-guid", "WORKER_PARAMETER_TYPE");
        RejectClaim(f => f.Input["ExpectedWorkRowVersion"] = "18", "WORK_ROW_VERSION_CONFLICT");
        RejectClaim(f => f.Input["ExpectedWorkRowVersion"] = "W/\"19\"", "ROW_VERSION_REQUIRED");
        RejectClaim(f => f.Work.RowVersion = null, "ROW_VERSION_REQUIRED");
        RejectClaim(f => f.Case.RowVersion = null, "ROW_VERSION_REQUIRED");
        RejectClaim(f => f.Case[Schema.GuardSequence] = long.MaxValue, "CASE_CONCURRENCY_CONTEXT");
        RejectClaim(f => f.Work[Fields.InputHash] = new string('0', 64), "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Proposal[Schema.Hash] = new string('0', 64), "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Proposal[Schema.Revision] = 2, "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Work[Fields.StorageKey] = "../../arbitrary.docx", "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Work["ownerid"] = new EntityReference("systemuser", Guid.NewGuid()), "WORK_OWNER_MISMATCH");
        RejectClaim(f => f.Case[Schema.SourceBindings] = Sources.Replace("Sponsor: synthetic", "Sponsor: changed"), "SOURCE_INTEGRITY", requireChange: true);
        RejectClaim(f => f.Work[Fields.FileId] = "partial", "FILE_IDENTITY_INCOMPLETE");
        RejectClaim(f => f.Work[Fields.Attempts] = -1, "WORK_STATE_INTEGRITY");
        RejectClaim(f => f.Work[Fields.State] = new OptionSetValue(99), "WORK_STATE_INTEGRITY");
        RejectClaim(f => f.SetLease(), "WORK_ALREADY_LEASED");
        RejectClaim(f => { f.SetLease(expired: true); f.Work.Attributes.Remove(Fields.Worker); }, "WORKER_ATTRIBUTE_REQUIRED");
        RejectClaim(f => f.Work[Fields.Token] = Token, "WORK_LEASE_INTEGRITY");
        RejectClaim(f => f.Work[Fields.State] = new OptionSetValue((int)WorkState.Complete), "REGISTRATION_STATE_CONFLICT");
        foreach (var change in new[] { Config.Replace("true", "false"), Config.Replace("600", "119"), Config.Replace("600", "1801"), Config.Replace("maxAttempts\":3", "maxAttempts\":6") })
        {
            using (var f = new Fixture()) { Reject(() => f.Claim(change), change.Contains("false") ? "WORKER_POLICY_DISABLED" : "WORKER_POLICY_BOUNDS"); Check(f.WriterService.Updates.Count == 0, "invalid config has no writes"); }
        }
        using (var f = new Fixture()) { Reject(() => new ClaimRenderWork().Execute(f), "INVALID_JSON"); Check(f.FactoryUsers.Count == 0, "default constructor cannot enable worker"); }
        using (var f = new Fixture())
        {
            f.SetLease(expired: true, saved: true); f.Claim();
            Check(f.State == WorkState.Leased && (int)f.Work[Fields.Attempts] == 2, "expired saved job reclaimed");
            Check((string)f.Work[Fields.Token] != Token && (string)f.Output["ExistingFileId"] == "file-1", "new lease preserves reconciliation identity");
            f.PrepareFailure(Token); Reject(f.Failure, "LEASE_OWNER_MISMATCH");
        }
        using (var f = new Fixture())
        {
            f.SetLease(); f.PrepareFailure(Token); f.Failure();
            Check(f.State == WorkState.RetryDue && !f.Work.Contains(Fields.Token) && !f.Work.Contains(Fields.Worker), "retry disposition clears authority");
            f.PrepareClaim(); f.Claim(); Check((int)f.Work[Fields.Attempts] == 2, "retry increments bounded attempt");
        }
        using (var f = new Fixture())
        {
            f.SetLease(expired: true); f.Work[Fields.Attempts] = 3; f.Claim();
            Check(f.State == WorkState.Failed && (string)f.Work[Fields.Error] == "ATTEMPTS_EXHAUSTED", "maximum attempts ends job");
            Check(!f.Output.ContainsKey("PayloadJson"), "terminal claim discloses no frozen input");
        }
        using (var f = new Fixture())
        {
            f.Case[Schema.ContentRevision] = 2; f.Claim();
            Check(f.State == WorkState.Superseded && !f.Output.ContainsKey("PayloadJson"), "changed basis supersedes without rendering");
        }
        RejectFailure(f => f.Work[Fields.Expires] = DateTime.UtcNow.AddMinutes(-1), "LEASE_EXPIRED");
        RejectFailure(f => f.Work[Fields.Worker] = new EntityReference("systemuser", Guid.NewGuid()), "LEASE_OWNER_MISMATCH");
        RejectFailure(f => f.Input["LeaseToken"] = Guid.NewGuid().ToString("D"), "LEASE_OWNER_MISMATCH");
        RejectFailure(f => f.Input["ErrorCode"] = "secret=do-not-log", "FAILURE_CODE_NOT_ALLOWED");
        using (var f = new Fixture())
        {
            f.SetLease(saved: true); f.PrepareFailure(Token); f.Input["Retryable"] = false; f.Failure();
            Check(f.State == WorkState.Failed && (string)f.Work[Fields.FileId] == "file-1", "terminal failure preserves known external identity");
        }
        using (var f = new Fixture())
        {
            f.WriterService.FailCasTable = Schema.Work; Reject(f.Claim, "PLATFORM_OPERATION_FAILED");
            Check(f.Output.Count == 0, "job CAS fault returns no partial lease");
            Check(f.WriterService.Updates.Count == 2, "case CAS precedes failing job CAS; real rollback remains tenant test");
        }
        using (var f = new Fixture())
        {
            f.WriterService.FailCasTable = Schema.Case; Reject(f.Claim, "PLATFORM_OPERATION_FAILED");
            Check(f.WriterService.Updates.Count == 1 && f.Output.Count == 0, "case conflict prevents job mutation and receipt");
        }
        foreach (var finalizing in new[] { false, true })
        {
            using (var f = new Fixture())
            {
                f.SetLease(saved: finalizing); f.PrepareProvider(finalizing);
                Reject(() => f.Provider(finalizing), "PROVIDER_VERIFIER_NOT_INSTALLED");
                Check(f.WriterService.Updates.Count == 0 && f.Output.Count == 0, "provider-unimplemented path has zero writes or receipts");
                f.Input["FileSha256"] = new string('0', 64);
                Reject(() => f.Provider(finalizing), "WORKER_PARAMETER_SHAPE");
            }
        }
        TestExactBytes();
        TestArtifactRegistration();
        TestTimestampControls();
        ProviderBoundaryTests.Run();
        Console.WriteLine($"PASS: {checks} local worker assertions. SDK fakes do not prove Dataverse transaction rollback, Custom API registration, SharePoint access, flow execution or tenant acceptance.");
    }

    static void TestExactBytes()
    {
        var now = DateTime.UtcNow;
        Func<ProviderRead> read = () => new ProviderRead { FileId = "f", Version = "v1", ETag = "etag1", StorageKey = "case/request.docx", ConfiguredLibraryVerified = true,
            CaseFileAccessRechecked = true, SourceAccessRechecked = true, ReadAtUtc = now, ExactVersionBytes = Encoding.UTF8.GetBytes("abc") };
        Func<ProviderRead, ExactFileEvidence> verify = r => ExactFileEvidence.FromProviderRead(r, "f", "v1", "etag1", "case/request.docx", now);
        var first = read(); var proof = verify(first);
        Check(proof.Sha256 == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" && proof.ByteLength == 3, "SHA-256 from actual supplied provider-read bytes, known vector");
        first.ExactVersionBytes[0] = 0; Check(proof.Sha256 == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "receipt digest immutable after caller buffer mutation");
        var other = read(); other.ExactVersionBytes = Encoding.UTF8.GetBytes("abd"); Check(verify(other).Sha256 != proof.Sha256, "bytes differ despite same ETag fixture");
        Boundary(() => verify(null), "PROVIDER_VERIFIER_NOT_INSTALLED");
        foreach (Action<ProviderRead> mutate in new Action<ProviderRead>[] { r => r.FileId = "other", r => r.Version = "v2", r => r.ETag = "etag2", r => r.StorageKey = "other/path" })
        { var r = read(); mutate(r); Boundary(() => verify(r), "PROVIDER_FILE_BINDING_MISMATCH"); }
        foreach (Action<ProviderRead> mutate in new Action<ProviderRead>[] { r => r.ConfiguredLibraryVerified = false, r => r.CaseFileAccessRechecked = false, r => r.SourceAccessRechecked = false })
        { var r = read(); mutate(r); Boundary(() => verify(r), "PROVIDER_ACCESS_PROOF_REQUIRED"); }
        var old = read(); old.ReadAtUtc = now.AddSeconds(-31); Boundary(() => verify(old), "PROVIDER_EVIDENCE_EXPIRED");
        var future = read(); future.ReadAtUtc = now.AddSeconds(1); Boundary(() => verify(future), "PROVIDER_EVIDENCE_EXPIRED");
        var empty = read(); empty.ExactVersionBytes = null; Boundary(() => verify(empty), "PROVIDER_BYTES_REQUIRED");
        var tooLarge = read(); tooLarge.ExactVersionBytes = new byte[10 * 1024 * 1024 + 1]; Boundary(() => verify(tooLarge), "PROVIDER_BYTES_REQUIRED");
    }
    static void Check(bool condition, string text) { checks++; if (!condition) throw new Exception("FAIL: " + text); }
    static void Reject(Action action, string code) { try { action(); } catch (InvalidPluginExecutionException e) { Check(e.Message == "SHUTTLE:" + code, code + " got " + e.Message); return; } throw new Exception("Expected " + code); }
    static void Boundary(Action action, string code) { try { action(); } catch (BoundaryException e) { Check(e.Code == code, code + " got " + e.Code); return; } throw new Exception("Expected " + code); }
    static void RejectClaim(Action<Fixture> setup, string code, bool requireChange = false)
    {
        using (var f = new Fixture())
        {
            setup(f);
            if (requireChange && (string)f.Case[Schema.SourceBindings] == Sources)
                f.Case[Schema.SourceBindings] = Sources.Replace("S01", "Z01");
            Reject(f.Claim, code); Check(f.WriterService.Updates.Count == 0, code + " has zero writes");
        }
    }
    static void RejectFailure(Action<Fixture> setup, string code)
    { using (var f = new Fixture()) { f.SetLease(); f.PrepareFailure(Token); setup(f); Reject(f.Failure, code); Check(f.WriterService.Updates.Count == 0, code + " has zero writes"); } }

    internal sealed class Fixture : IServiceProvider, IOrganizationServiceFactory, IDisposable
    {
        internal readonly Dictionary<string, Entity> Rows = new Dictionary<string, Entity>();
        internal readonly List<Guid> FactoryUsers = new List<Guid>();
        internal readonly FakeService Caller, WriterService;
        internal readonly Dictionary<string, object> Properties;
        internal readonly ParameterCollection Input = new ParameterCollection(), Output = new ParameterCollection();
        internal readonly IPluginExecutionContext context;
        internal Entity Work => Rows[Schema.Work]; internal Entity Case => Rows[Schema.Case]; internal Entity Proposal => Rows[Schema.Proposal];
        internal WorkState State => (WorkState)Work.GetAttributeValue<OptionSetValue>(Fields.State).Value;
        internal readonly string StorageKey;
        internal Fixture()
        {
            var p = StrictWireDecoder.Decode(Pack); var owner = new EntityReference("systemuser", Actor); var hash = CanonicalProposal.Hash(p);
            StorageKey = p.CaseId.ToString("D") + "/" + p.RequestKey.ToString("D") + ".docx";
            Rows[Schema.Case] = new Entity(Schema.Case, p.CaseId) { RowVersion = "17", [Schema.ContentRevision] = 1, [Schema.GuardSequence] = 4L, [Schema.SourceBindings] = Sources,
                ["shuttle_factsjson"] = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures/case-alpha.json")), ["ownerid"] = owner };
            Rows[Schema.Proposal] = new Entity(Schema.Proposal, ProposalId) { RowVersion = "18", [Schema.Payload] = Pack, [Schema.Hash] = hash, [Schema.Kind] = new OptionSetValue(1),
                [Schema.Revision] = 1, [Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId), [Schema.SchemaVersion] = p.SchemaVersion, [Schema.RequestKey] = p.RequestKey.ToString("D"),
                [Schema.Actor] = owner, [Schema.Writer] = new EntityReference("systemuser", Writer), [Schema.CommittedAt] = DateTime.UtcNow.AddMinutes(-10), ["ownerid"] = owner };
            Rows[Schema.Work] = new Entity(Schema.Work, WorkId) { RowVersion = "19", [Schema.CaseLookup] = new EntityReference(Schema.Case, p.CaseId), [Fields.Proposal] = new EntityReference(Schema.Proposal, ProposalId),
                [Schema.Revision] = 1, [Fields.InputHash] = hash, [Fields.Template] = p.PackDraft.TemplateRelease, [Fields.Skill] = p.PackDraft.SkillRelease,
                [Fields.State] = new OptionSetValue(1), [Fields.Attempts] = 0, [Fields.StorageKey] = StorageKey, ["ownerid"] = owner };
            Rows["systemuser"] = new Entity("systemuser", Actor) { ["azureactivedirectoryobjectid"] = Actor, ["isdisabled"] = false };
            Caller = new FakeService(Rows, false); WriterService = new FakeService(Rows, true);
            context = DispatchProxy.Create<IPluginExecutionContext, ContextProxy>(); Properties = ((ContextProxy)context).Values;
            Properties["Stage"] = 40; Properties["Mode"] = 0; Properties["Depth"] = 1; Properties["IsInTransaction"] = true;
            Properties["InitiatingUserId"] = Actor; Properties["UserId"] = Writer; Properties["OrganizationId"] = Org;
            Properties["InputParameters"] = Input; Properties["OutputParameters"] = Output; PrepareClaim();
        }
        internal void PrepareClaim() { Input.Clear(); Input["WorkId"] = WorkId; Input["ExpectedWorkRowVersion"] = Work.RowVersion; Output.Clear(); Properties["MessageName"] = "shuttle_ClaimRenderWork"; }
        internal void Claim() => Claim(Config);
        internal void Claim(string config) => new ClaimRenderWork(null, config).Execute(this);
        internal void SetLease(bool expired = false, bool saved = false)
        {
            Work[Fields.State] = new OptionSetValue((int)(saved ? WorkState.FileSaved : WorkState.Leased)); Work[Fields.Attempts] = 1;
            Work[Fields.Token] = Token; Work[Fields.Expires] = DateTime.UtcNow.AddMinutes(expired ? -1 : 10); Work[Fields.Worker] = new EntityReference("systemuser", Actor);
            if (saved) { Work[Fields.FileId] = "file-1"; Work[Fields.Version] = "1.0"; Work[Fields.ETag] = "etag-1";
                Work[Fields.FileHash] = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"; Work[Fields.FileBytes] = 3L; Work[Fields.FileInputHash] = Work[Fields.InputHash]; }
        }
        internal void PrepareFailure(string token)
        {
            PrepareClaim(); Input["LeaseToken"] = token; Input["Retryable"] = true; Input["ErrorCode"] = "WORD_TEMPORARY";
            Properties["MessageName"] = "shuttle_RecordRenderFailure";
        }
        internal void Failure() => new RecordRenderFailure(null, Config).Execute(this);
        internal void PrepareProvider(bool finalizing)
        {
            PrepareClaim(); Input["LeaseToken"] = Token;
            Properties["MessageName"] = finalizing ? "shuttle_FinalizeArtifact" : "shuttle_RecordRenderFile";
            if (!finalizing) { Input["FileId"] = "file-1"; Input["FileVersion"] = "1.0"; Input["FileETag"] = "etag-1"; }
        }
        internal void Provider(bool finalizing) { if (finalizing) new FinalizeArtifact(null, Config).Execute(this); else new RecordRenderFile(null, Config).Execute(this); }
        public object GetService(Type type) => type == typeof(IPluginExecutionContext) ? context : type == typeof(IOrganizationServiceFactory) ? this : null;
        public IOrganizationService CreateOrganizationService(Guid? userId) { if (!userId.HasValue) throw new Exception("No SYSTEM service allowed"); FactoryUsers.Add(userId.Value); return userId == Writer ? WriterService : userId == Actor ? Caller : throw new Exception("Unexpected service identity"); }
        public void Dispose() { }
    }
    internal sealed class FakeService : IOrganizationService
    {
        readonly Dictionary<string, Entity> rows; readonly bool canWrite;
        internal readonly List<UpdateRequest> Updates = new List<UpdateRequest>(); internal readonly List<Entity> Creates = new List<Entity>(); internal int Reads; internal string FailCasTable;
        internal bool ActiveArtifactKey = true;
        internal FakeService(Dictionary<string, Entity> rows, bool canWrite) { this.rows = rows; this.canWrite = canWrite; }
        public Entity Retrieve(string name, Guid id, ColumnSet columns)
        {
            Reads++; var original = rows[name]; if (original.Id != id) throw new Exception("wrong lookup");
            var copy = new Entity(name, id) { RowVersion = original.RowVersion };
            foreach (var a in original.Attributes) if (columns.AllColumns || columns.Columns.Contains(a.Key)) copy[a.Key] = a.Value;
            return copy;
        }
        public OrganizationResponse Execute(OrganizationRequest request)
        {
            if (!canWrite) throw new Exception("Unexpected request");
            if (request is RetrieveEntityRequest)
            {
                var metadata = new Microsoft.Xrm.Sdk.Metadata.EntityMetadata();
                var key = new Microsoft.Xrm.Sdk.Metadata.EntityKeyMetadata { KeyAttributes = new[] { "shuttle_externalwork" } };
                typeof(Microsoft.Xrm.Sdk.Metadata.EntityKeyMetadata).GetProperty("EntityKeyIndexStatus").SetValue(key, ActiveArtifactKey ? EntityKeyIndexStatus.Active : EntityKeyIndexStatus.Pending);
                typeof(Microsoft.Xrm.Sdk.Metadata.EntityMetadata).GetProperty("Keys").SetValue(metadata, new[] { key });
                return new RetrieveEntityResponse { Results = { ["EntityMetadata"] = metadata } };
            }
            if (!(request is UpdateRequest u)) throw new Exception("Unexpected request");
            Updates.Add(u); var row = rows[u.Target.LogicalName];
            if (FailCasTable == row.LogicalName || u.ConcurrencyBehavior != ConcurrencyBehavior.IfRowVersionMatches || u.Target.RowVersion != row.RowVersion) throw new Exception("CAS conflict");
            foreach (var a in u.Target.Attributes) { if (a.Value == null) row.Attributes.Remove(a.Key); else row[a.Key] = a.Value; }
            row.RowVersion = (long.Parse(row.RowVersion) + 1).ToString(); return new UpdateResponse();
        }
        public Guid Create(Entity entity) { if (!canWrite || entity.Id == Guid.Empty || rows.ContainsKey(entity.LogicalName)) throw new Exception("Duplicate or unexpected Create"); rows[entity.LogicalName] = entity; Creates.Add(entity); return entity.Id; }
        public void Update(Entity entity) => throw new Exception("CAS required");
        public void Delete(string name, Guid id) => throw new Exception("Unexpected Delete");
        public EntityCollection RetrieveMultiple(QueryBase query)
        {
            if (!(query is QueryExpression q) || q.Criteria.Conditions.Count != 1) throw new Exception("Unexpected Query");
            var result = new EntityCollection();
            if (rows.TryGetValue(q.EntityName, out var row))
            {
                var c = q.Criteria.Conditions[0]; var wanted = (Guid)c.Values[0];
                if (c.AttributeName == q.EntityName + "id" ? row.Id == wanted : row.GetAttributeValue<EntityReference>(c.AttributeName)?.Id == wanted) result.Entities.Add(row);
            }
            return result;
        }
        public void Associate(string n, Guid id, Relationship r, EntityReferenceCollection e) => throw new Exception("Unexpected Associate");
        public void Disassociate(string n, Guid id, Relationship r, EntityReferenceCollection e) => throw new Exception("Unexpected Disassociate");
    }
    public class ContextProxy : DispatchProxy
    {
        internal readonly Dictionary<string, object> Values = new Dictionary<string, object>();
        protected override object Invoke(MethodInfo method, object[] args)
        {
            if (method.Name.StartsWith("get_")) return Values.TryGetValue(method.Name.Substring(4), out var value) ? value : method.ReturnType.IsValueType ? Activator.CreateInstance(method.ReturnType) : null;
            throw new NotSupportedException(method.Name);
        }
    }
}
