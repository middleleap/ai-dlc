using System;
using System.Text;
using Microsoft.Xrm.Sdk;
using Shuttle.Dataverse;
using Shuttle.Worker;

internal static partial class Program
{
    static WorkerExecution Execution(Fixture f, TestProvider provider) => new WorkerExecution(f.context, WorkerPolicy.Parse(Config), f.WriterService, f.Caller, DateTime.UtcNow, () => provider);
    static void TestArtifactRegistration()
    {
        using (var f = new Fixture())
        {
            f.SetLease(); f.PrepareProvider(false); var provider = new TestProvider();
            Execution(f, provider).RecordFile();
            Check(f.State == WorkState.FileSaved && (long)f.Work[Fields.FileBytes] == 3L, "record binds server-read bytes durably");
            Check((string)f.Work[Fields.FileInputHash] == (string)f.Work[Fields.InputHash], "record binds proposal input hash");
            Check(provider.ControlCount == 17 && provider.Reads == 1 && f.WriterService.Updates.Count == 2, "released controls and two CAS writes");
            f.Input["ExpectedWorkRowVersion"] = "19"; Execution(f, provider).RecordFile();
            Check((string)f.Output["Result"] == "FileSaved" && f.WriterService.Updates.Count == 2, "exact record retry reconciles despite lost response row version");
            f.Input["FileETag"] = "other"; Boundary(() => Execution(f, provider).RecordFile(), "FILE_IDENTITY_CONFLICT");
            f.PrepareProvider(true); Execution(f, provider).FinalizeFile();
            Check(f.State == WorkState.Complete && f.WriterService.Creates.Count == 2, "finalize creates one artifact and one render event");
            Check((int)f.Case[Schema.ContentRevision] == 1 && f.Case.GetAttributeValue<EntityReference>("shuttle_currentartifactversion").Id == (Guid)f.Output["ArtifactVersionId"], "pointer advances without revision or approval");
            Check((string)f.Rows["shuttle_artifactversion"]["shuttle_registrationstate"] == "Registered", "registration has no approval state");
            var artifact = (Guid)f.Output["ArtifactVersionId"]; var writes = f.WriterService.Updates.Count;
            f.Input["ExpectedWorkRowVersion"] = "20"; Execution(f, provider).FinalizeFile();
            Check((string)f.Output["Result"] == "HistoricalReceipt" && (Guid)f.Output["ArtifactVersionId"] == artifact && f.WriterService.Creates.Count == 2 && f.WriterService.Updates.Count == writes, "finalize retry creates no duplicate writes");
            f.Case[Schema.ContentRevision] = 2; f.Case["shuttle_currentartifactversion"] = new EntityReference("shuttle_artifactversion", Guid.NewGuid());
            var current = f.Case.GetAttributeValue<EntityReference>("shuttle_currentartifactversion").Id;
            f.PrepareClaim(); f.Input["ExpectedWorkRowVersion"] = "19"; f.Claim();
            Check((string)f.Output["Result"] == "HistoricalReceipt" && f.Case.GetAttributeValue<EntityReference>("shuttle_currentartifactversion").Id == current && f.WriterService.Updates.Count == writes, "historical claim never makes prior file current");
            f.PrepareProvider(true); f.Input["LeaseToken"] = Guid.NewGuid().ToString("D"); Boundary(() => Execution(f, provider).FinalizeFile(), "LEASE_OWNER_MISMATCH");
            f.PrepareClaim(); f.Rows.Remove(Schema.Event); Reject(f.Claim, "REGISTRATION_STATE_CONFLICT");
        }
        using (var f = new Fixture())
        {
            f.SetLease(saved: true); f.Case[Schema.ContentRevision] = 2; f.PrepareProvider(true);
            Execution(f, new TestProvider()).FinalizeFile();
            Check(f.State == WorkState.Superseded && (string)f.Rows["shuttle_artifactversion"]["shuttle_registrationstate"] == "Superseded" && !f.Case.Contains("shuttle_currentartifactversion"), "changed basis records superseded file without pointer");
        }
        foreach (var path in new[] { "expired-claim", "failure", "record" })
        using (var f = new Fixture())
        {
            f.SetLease(saved: true, expired: path == "expired-claim"); f.Case[Schema.ContentRevision] = 2;
            if (path == "expired-claim") { f.PrepareClaim(); f.Claim(); }
            else if (path == "failure") { f.PrepareFailure(Token); f.Failure(); }
            else { f.Work[Fields.State] = new OptionSetValue((int)WorkState.Leased); f.PrepareProvider(false); Execution(f, new TestProvider()).RecordFile(); }
            var writes = f.WriterService.Updates.Count;
            f.PrepareClaim(); f.Claim();
            Check((string)f.Output["Result"] == "Superseded" && !f.Output.ContainsKey("ArtifactVersionId") && f.WriterService.Creates.Count == 0 && f.WriterService.Updates.Count == writes, path + " terminal work has status, not fabricated artifact receipt");
            f.PrepareProvider(true); Execution(f, new TestProvider()).FinalizeFile();
            Check((string)f.Output["Result"] == "Superseded" && !f.Output.ContainsKey("ArtifactVersionId") && f.WriterService.Updates.Count == writes, path + " terminal finalize replay is stable");
        }
        using (var f = new Fixture())
        {
            f.SetLease(saved: true); f.PrepareProvider(true); f.WriterService.ActiveArtifactKey = false;
            Boundary(() => Execution(f, new TestProvider()).FinalizeFile(), "ACTIVE_ARTIFACT_KEY_REQUIRED");
            Check(f.WriterService.Creates.Count == 0 && f.WriterService.Updates.Count == 0, "inactive key blocks all registration writes");
        }
        using (var f = new Fixture())
        {
            f.SetLease(saved: true); f.PrepareProvider(true);
            Boundary(() => Execution(f, new TestProvider { Bytes = "abd" }).FinalizeFile(), "FILE_EVIDENCE_CONFLICT");
            Check(f.WriterService.Creates.Count == 0 && f.WriterService.Updates.Count == 0, "same ETag with different provider bytes rejected");
        }
        using (var f = new Fixture())
        {
            f.SetLease(); f.PrepareProvider(false);
            f.Work[Fields.Expires] = DateTime.UtcNow.AddMilliseconds(100);
            Boundary(() => Execution(f, new TestProvider { AfterRead = () => System.Threading.Thread.Sleep(200) }).RecordFile(), "LEASE_EXPIRED");
            Check(f.WriterService.Updates.Count == 0, "lease expires during provider read without writes");
        }
        using (var f = new Fixture())
        {
            f.SetLease(); f.PrepareProvider(false);
            Boundary(() => Execution(f, new TestProvider { WrongInput = true }).RecordFile(), "PROVIDER_INPUT_BINDING_MISMATCH");
            Check(f.WriterService.Updates.Count == 0, "caller cannot bind wrong rendered input");
        }
        using (var f = new Fixture())
        {
            f.SetLease(); f.PrepareProvider(false);
            Boundary(() => Execution(f, new TestProvider { BeforeRecheck = () => f.Case[Schema.SourceBindings] = Sources.Replace("S01", "Z01") }).RecordFile(), "SOURCE_INTEGRITY");
            Check(f.WriterService.Updates.Count == 0, "revocation during read blocks evidence persistence");
        }
        using (var f = new Fixture())
        {
            f.Case["shuttle_factsjson"] = ((string)f.Case["shuttle_factsjson"]).Replace("Fictional Bank Alpha", "Other");
            Boundary(() => Execution(f, new TestProvider()).Claim(), "RENDER_CASE_RELEASE_MISMATCH");
            Check(f.WriterService.Updates.Count == 0, "unreleased case bytes cannot claim render work");
        }
        using (var f = new Fixture())
        {
            f.SetLease(saved: true); f.PrepareProvider(true); f.WriterService.FailCasTable = Schema.Work;
            try { Execution(f, new TestProvider()).FinalizeFile(); throw new Exception("Expected final job CAS failure"); }
            catch (Exception ex) when (ex.Message == "CAS conflict") { Check(f.Output.Count == 0 && f.WriterService.Creates.Count == 2, "failed final CAS emits no receipt; fake deliberately does not simulate rollback"); }
        }
    }
    sealed class TestProvider : IExactFileProvider
    {
        internal int Reads, ControlCount; internal string Bytes = "abc"; internal bool WrongInput;
        internal Action BeforeRecheck, AfterRead;
        public ProviderRead Read(ProviderRequest r)
        {
            Reads++; ControlCount = r.ExpectedControls.Count; BeforeRecheck?.Invoke(); r.RecheckSourceAccess(); AfterRead?.Invoke();
            return new ProviderRead { FileId = r.FileId, Version = r.Version, ETag = r.ETag, StorageKey = r.StorageKey,
                InputHash = WrongInput ? new string('0', 64) : r.InputHash, ExactVersionBytes = Encoding.UTF8.GetBytes(Bytes),
                ConfiguredLibraryVerified = true, CaseFileAccessRechecked = true, SourceAccessRechecked = true, ReadAtUtc = DateTime.UtcNow };
        }
    }
}
