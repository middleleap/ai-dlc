using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Xml.Linq;
using Microsoft.Xrm.Sdk;
using Shuttle.Dataverse;
using Shuttle.Guards;
using Shuttle.Worker;

internal static partial class Program
{
    static void TestTimestampControls()
    {
        var proposal = StrictWireDecoder.Decode(Pack);
        var facts = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures/case-alpha.json"));
        var committed = new DateTime(2026, 10, 27, 2, 45, 16, DateTimeKind.Utc).AddTicks(1234567);
        var legacy = RenderControls.Build(proposal, facts, ProposalId, WorkId, committed);
        Check(legacy["SH_GeneratedUtc"] == "2026-10-27T02:45:16Z", "existing v0.1 timestamp remains unchanged");
        var candidateProposal = StrictWireDecoder.Decode(Pack.Replace(Schema.TemplateRelease, Schema.UtcPrefixedTemplateRelease));
        var candidate = RenderControls.Build(candidateProposal, facts, ProposalId, WorkId, committed, RenderControlContract.UtcPrefixedIsoV1);
        Check(candidate["SH_GeneratedUtc"] == "UTC 2026-10-27T02:45:16Z", "candidate preserves persisted UTC second without connector date coercion");
        var changed = new[] { "SH_GeneratedUtc", "SH_TemplateRelease", "SH_ProposalHash" };
        Check(candidate.Count == 17 && candidate.All(c => changed.Contains(c.Key) || c.Value == legacy[c.Key]), "new release changes only timestamp and its hash-bound release provenance");
        Check(candidate["SH_ProposalHash"] != legacy["SH_ProposalHash"], "new release is included in the canonical proposal hash");
        Boundary(() => RenderControls.Build(proposal, facts, ProposalId, WorkId, committed, RenderControlContract.UtcPrefixedIsoV1), "RENDER_CONTROL_CONTRACT_MISMATCH");
        Boundary(() => RenderControls.Build(candidateProposal, facts, ProposalId, WorkId, committed, RenderControlContract.CanonicalIsoV1), "RENDER_CONTROL_CONTRACT_MISMATCH");
        Check(committed.Kind == DateTimeKind.Utc && committed.Ticks % TimeSpan.TicksPerSecond == 1234567, "rendering leaves persisted instant unchanged");
        var culture = CultureInfo.CurrentCulture;
        try
        {
            foreach (var name in new[] { "en-US", "da-DK", "ar-SA" })
            {
                CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo(name);
                Check(RenderControls.Build(candidateProposal, facts, ProposalId, WorkId, committed, RenderControlContract.UtcPrefixedIsoV1)["SH_GeneratedUtc"] ==
                    "UTC 2026-10-27T02:45:16Z", "candidate culture-independent: " + name);
            }
        }
        finally { CultureInfo.CurrentCulture = culture; }
        foreach (var kind in new[] { DateTimeKind.Local, DateTimeKind.Unspecified })
            Boundary(() => RenderControls.Build(candidateProposal, facts, ProposalId, WorkId, DateTime.SpecifyKind(committed, kind), RenderControlContract.UtcPrefixedIsoV1), "RENDER_CASE_RELEASE_MISMATCH");
        Boundary(() => RenderControls.Build(proposal, facts, ProposalId, WorkId, committed, (RenderControlContract)42), "RENDER_CONTROL_CONTRACT_UNSUPPORTED");
        using (var f = new Fixture())
        {
            f.Proposal[Schema.CommittedAt] = committed;
            f.Claim();
            var claimed = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>((string)f.Output["ControlsJson"]);
            Check(claimed["SH_GeneratedUtc"] == "2026-10-27T02:45:16Z", "old work Claim remains bound to its existing contract");
        }

        // Constructed locally from public text; no Word output or tenant capture.
        var synthetic = SyntheticDocx.Create(legacy);
        var populated = PopulateTimestampPackage(synthetic, candidate);
        DocxControlBinding.Verify(populated, candidate); checks++;
        Boundary(() => DocxControlBinding.Verify(populated, legacy), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        foreach (var value in new[] { "10/27/2026 2:45:16 AM", "2026-10-27T02:45:16Z", "UTC 2026-10-27T02:45:17Z",
            "UTC 2026-10-27T06:45:16+04:00", "utc 2026-10-27T02:45:16Z", "UTC 2026-10-27T02:45:16Z " })
        {
            var tampered = new Dictionary<string, string>(candidate) { ["SH_GeneratedUtc"] = value };
            Boundary(() => DocxControlBinding.Verify(PopulateTimestampPackage(synthetic, tampered), candidate), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        }
        TestBoundTimestampStages(synthetic, committed);
        TestTimestampBindingTampering();
    }

    static void TestBoundTimestampStages(byte[] synthetic, DateTime committed)
    {
        foreach (var release in new[] { Schema.TemplateRelease, Schema.UtcPrefixedTemplateRelease })
        using (var f = new Fixture())
        {
            SetTimestampRelease(f, release); f.Proposal[Schema.CommittedAt] = committed;
            f.Claim();
            var firstControls = (string)f.Output["ControlsJson"];
            var claimed = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(firstControls);
            var expectedTime = release == Schema.TemplateRelease ? "2026-10-27T02:45:16Z" : "UTC 2026-10-27T02:45:16Z";
            Check(claimed["SH_GeneratedUtc"] == expectedTime && claimed["SH_TemplateRelease"] == release, "Claim derives format from its persisted hash-bound release");
            var token = (string)f.Output["LeaseToken"];
            f.PrepareFailure(token); f.Failure();
            f.PrepareClaim(); f.Claim(); token = (string)f.Output["LeaseToken"];
            Check((string)f.Output["ControlsJson"] == firstControls && (int)f.Work[Fields.Attempts] == 2, "retry derives identical controls from persisted release and committed instant");
            var provider = new BoundTimestampProvider(PopulateTimestampPackage(synthetic, claimed), claimed, expectedTime);
            f.PrepareProvider(false); f.Input["LeaseToken"] = token;
            TimestampExecution(f, provider).RecordFile();
            Check(f.State == WorkState.FileSaved && provider.Reads == 1, "Record accepts only exact bytes bound to the same timestamp contract");
            f.Input["ExpectedWorkRowVersion"] = "19"; TimestampExecution(f, provider).RecordFile();
            Check(f.State == WorkState.FileSaved && provider.Reads == 2, "lost Record response retry keeps the same format");
            f.PrepareProvider(true); f.Input["LeaseToken"] = token;
            TimestampExecution(f, provider).FinalizeFile();
            Check(f.State == WorkState.Complete && provider.Reads == 3 && f.WriterService.Creates.Count == 2, "Finalize verifies the same pinned format and registers one artifact/event");
        }
    }

    static WorkerExecution TimestampExecution(Fixture f, IExactFileProvider provider) =>
        new WorkerExecution(f.context, WorkerPolicy.Parse(Config), f.WriterService, f.Caller, DateTime.UtcNow, () => provider);

    static void SetTimestampRelease(Fixture f, string release, string skill = Schema.SkillRelease)
    {
        var payload = Pack.Replace(Schema.TemplateRelease, release).Replace(Schema.SkillRelease, skill);
        var decoded = StrictWireDecoder.Decode(payload);
        var hash = CanonicalProposal.Hash(decoded);
        f.Proposal[Schema.Payload] = payload; f.Proposal[Schema.Hash] = hash;
        f.Work[Fields.Template] = release; f.Work[Fields.Skill] = skill; f.Work[Fields.InputHash] = hash;
    }

    static void TestTimestampBindingTampering()
    {
        Boundary(() => Schema.ResolveRenderContract(null, Schema.SkillRelease), "RELEASE_NOT_INSTALLED");
        Boundary(() => Schema.ResolveRenderContract(Schema.UtcPrefixedTemplateRelease, null), "RELEASE_NOT_INSTALLED");
        Boundary(() => Schema.ResolveRenderContract("", Schema.SkillRelease), "RELEASE_NOT_INSTALLED");
        RejectClaim(f => f.Work[Fields.Template] = Schema.UtcPrefixedTemplateRelease, "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Proposal[Schema.Payload] = Pack.Replace(Schema.TemplateRelease, Schema.UtcPrefixedTemplateRelease), "WORK_BINDING_MISMATCH");
        RejectClaim(f => { SetTimestampRelease(f, Schema.UtcPrefixedTemplateRelease); f.Work[Fields.Template] = Schema.TemplateRelease; }, "WORK_BINDING_MISMATCH");
        RejectClaim(f => f.Work.Attributes.Remove(Fields.Template), "WORKER_ATTRIBUTE_REQUIRED");
        foreach (var release in new[] { "readiness-gaps-public-utc-prefix-v0.9", "readiness-gaps-public-v0.9" })
        {
            RejectClaim(f => SetTimestampRelease(f, release), "RELEASE_NOT_INSTALLED");
            foreach (var finalizing in new[] { false, true })
            using (var f = new Fixture())
            {
                SetTimestampRelease(f, release); f.SetLease(saved: finalizing); f.PrepareProvider(finalizing);
                var provider = new TestProvider();
                Boundary(() => { if (finalizing) Execution(f, provider).FinalizeFile(); else Execution(f, provider).RecordFile(); }, "RELEASE_NOT_INSTALLED");
                Check(provider.Reads == 0 && f.WriterService.Updates.Count == 0 && f.WriterService.Creates.Count == 0, "unknown release blocks provider reads and writes at both verification stages");
            }
            using (var f = new Fixture())
            {
                SetTimestampRelease(f, release); f.SetLease(); f.PrepareFailure(Token);
                Reject(f.Failure, "RELEASE_NOT_INSTALLED");
                Check(f.WriterService.Updates.Count == 0, "unknown release cannot enter retry disposition");
            }
        }
        RejectClaim(f => SetTimestampRelease(f, Schema.UtcPrefixedTemplateRelease, "shuttle-public-v0.2"), "RELEASE_NOT_INSTALLED");
    }

    sealed class BoundTimestampProvider : IExactFileProvider
    {
        readonly byte[] bytes;
        readonly IDictionary<string, string> frozen;
        readonly string timestamp;
        internal int Reads;
        internal BoundTimestampProvider(byte[] bytes, IDictionary<string, string> frozen, string timestamp)
        { this.bytes = bytes; this.frozen = new Dictionary<string, string>(frozen); this.timestamp = timestamp; }
        public ProviderRead Read(ProviderRequest r)
        {
            Reads++;
            Check(r.ExpectedControls["SH_GeneratedUtc"] == timestamp && r.ExpectedControls.Count == frozen.Count &&
                frozen.All(c => r.ExpectedControls[c.Key] == c.Value), "each verification stage derives the exact Claim release contract");
            DocxControlBinding.Verify(bytes, r.ExpectedControls); r.RecheckSourceAccess();
            return new ProviderRead { FileId = r.FileId, Version = r.Version, ETag = r.ETag, StorageKey = r.StorageKey,
                InputHash = r.InputHash, ExactVersionBytes = bytes, ConfiguredLibraryVerified = true, CaseFileAccessRechecked = true,
                SourceAccessRechecked = true, ReadAtUtc = DateTime.UtcNow };
        }
    }

    static byte[] PopulateTimestampPackage(byte[] source, IDictionary<string, string> controls)
    {
        XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        using var memory = new MemoryStream(); memory.Write(source, 0, source.Length);
        using (var zip = new ZipArchive(memory, ZipArchiveMode.Update, true))
        {
            var entry = zip.GetEntry("word/document.xml");
            XDocument doc;
            using (var input = entry.Open()) doc = XDocument.Load(input);
            foreach (var control in doc.Descendants(w + "sdt"))
            {
                var name = (string)control.Element(w + "sdtPr").Element(w + "alias").Attribute(w + "val");
                var run = new XElement(w + "r");
                foreach (var line in controls[name].Split('\n'))
                {
                    if (run.HasElements) run.Add(new XElement(w + "br"));
                    run.Add(new XElement(w + "t", new XAttribute(XNamespace.Xml + "space", "preserve"), line));
                }
                control.Element(w + "sdtContent").ReplaceNodes(new XElement(w + "p", run));
            }
            entry.Delete();
            using var output = zip.CreateEntry("word/document.xml").Open(); doc.Save(output);
        }
        return memory.ToArray();
    }
}
