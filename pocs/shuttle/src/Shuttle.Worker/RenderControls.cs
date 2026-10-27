using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Shuttle.Dataverse;
using Shuttle.Guards;

namespace Shuttle.Worker
{
    // Only the immutable released synthetic case is admitted; a new case requires a release.
    internal static class RenderControls
    {
        private const string CaseHash = "cc586f889aa39ab8cdde42d3f7ff854248440085ad787c8446a2b468447ecba8";
        private static readonly string[][] Sections = {
            new[] { "decision-brief", "Decision brief", "SH_DecisionBrief" },
            new[] { "scope-and-facts", "Scope and seven facts", "SH_ScopeAndFacts" },
            new[] { "readiness-gaps", "Readiness gaps and next actions", "SH_ReadinessGaps" },
            new[] { "inheritance", "Inheritance and evidence", "SH_Inheritance" },
            new[] { "provenance", "Provenance and limits", "SH_Provenance" },
            new[] { "inspection", "Inspection and outstanding decisions", "SH_Inspection" }
        };
        internal static IDictionary<string, string> Build(Proposal p, string facts, Guid proposalId, Guid workId, DateTime committedAt)
            => Build(p, facts, proposalId, workId, committedAt,
                Schema.ResolveRenderContract(p?.PackDraft?.TemplateRelease, p?.PackDraft?.SkillRelease));

        internal static IDictionary<string, string> Build(Proposal p, string facts, Guid proposalId, Guid workId, DateTime committedAt,
            RenderControlContract contract)
        {
            if (contract != RenderControlContract.CanonicalIsoV1 && contract != RenderControlContract.UtcPrefixedIsoV1)
                throw new BoundaryException("RENDER_CONTROL_CONTRACT_UNSUPPORTED");
            if (contract != Schema.ResolveRenderContract(p?.PackDraft?.TemplateRelease, p?.PackDraft?.SkillRelease))
                throw new BoundaryException("RENDER_CONTROL_CONTRACT_MISMATCH");
            using (var sha = SHA256.Create())
                if (facts == null || BitConverter.ToString(sha.ComputeHash(new UTF8Encoding(false, true).GetBytes(facts))).Replace("-", "").ToLowerInvariant() != CaseHash)
                    throw new BoundaryException("RENDER_CASE_RELEASE_MISMATCH");
            using (var doc = StrictJson.Parse(facts, 250000))
            {
                var r = doc.RootElement;
                if (StrictJson.Text(r, "caseId") != p.CaseId.ToString("D") || r.GetProperty("synthetic").ValueKind != JsonValueKind.True ||
                    r.GetProperty("contentRevision").GetInt32() != p.ExpectedContentRevision || p.PackDraft == null ||
                    proposalId == Guid.Empty || workId == Guid.Empty || committedAt.Kind != DateTimeKind.Utc)
                    throw new BoundaryException("RENDER_CASE_RELEASE_MISMATCH");
                var c = new Dictionary<string, string>(StringComparer.Ordinal) {
                    { "SH_CaseKey", StrictJson.Text(r, "caseKey") }, { "SH_CaseTitle", StrictJson.Text(r, "title") },
                    { "SH_CaseId", p.CaseId.ToString("D") }, { "SH_ContentRevision", p.ExpectedContentRevision.ToString(CultureInfo.InvariantCulture) },
                    { "SH_ProposalId", proposalId.ToString("D") }, { "SH_WorkId", workId.ToString("D") }, { "SH_ProposalHash", CanonicalProposal.Hash(p) },
                    { "SH_GeneratedUtc", (contract == RenderControlContract.UtcPrefixedIsoV1 ? "UTC " : "") +
                        committedAt.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture) },
                    { "SH_TemplateRelease", p.PackDraft.TemplateRelease }, { "SH_SkillRelease", p.PackDraft.SkillRelease }
                };
                var actual = p.PackDraft.Sections;
                if (actual.Count != Sections.Length || actual.Select(s => s.Key).Distinct(StringComparer.Ordinal).Count() != Sections.Length)
                    throw new BoundaryException("RENDER_SECTION_RELEASE_MISMATCH");
                foreach (var e in Sections)
                {
                    var s = actual.SingleOrDefault(x => x.Key == e[0]);
                    if (s == null || s.Title != e[1]) throw new BoundaryException("RENDER_SECTION_RELEASE_MISMATCH");
                    c.Add(e[2], s.Text + "\n\nSources: " + (s.SourceIds.Count == 0 ? "No source cited; evidence owed" : string.Join(", ", s.SourceIds)) +
                        (s.OwedOwner == null ? "" : "\n\nOwed owner: " + s.OwedOwner));
                }
                c.Add("SH_SourceRegister", string.Join("\n\n", r.GetProperty("sources").EnumerateArray().Select(s =>
                    StrictJson.Text(s, "id") + " | " + StrictJson.Text(s, "version") + " | as of " + StrictJson.Text(s, "asOfDate") + "\n" +
                    StrictJson.Text(s, "file") + "\nSHA-256: " + StrictJson.Text(s, "sha256") + "\nScope: " + StrictJson.Text(s, "scope"))));
                return c;
            }
        }
    }
}
