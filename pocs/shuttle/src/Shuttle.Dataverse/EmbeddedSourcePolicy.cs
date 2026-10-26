using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Shuttle.Guards;

namespace Shuttle.Dataverse
{
    // Deliberately limited to immutable local fixture bytes delivered through Case ACLs.
    // It does not authorize any SharePoint source or file.
    public sealed class EmbeddedSourcePolicy
    {
        private EmbeddedSourcePolicy() { }
        public static readonly IReadOnlyDictionary<string, string> SourceHashes = new ReadOnlyDictionary<string, string>(new Dictionary<string, string>(StringComparer.Ordinal)
        {
            { "S01", "a3610b3023ae50d1261876a698eb134d56ed754f34f0934084de322501c21ae0" },
            { "S02", "a8efa9187f70a01797f0d2229075c11b885c9556990988394b4f1a4d7530bc3e" },
            { "S03", "bbd94ae6c8cccc3f96a8a69fa7a733d2eead6df89b8b77e97ed34220dcd32928" },
            { "S04", "9ebdfdd73663b8a48afa1c71c5b271d6e859b7e1e95965d1be52634dca3976ab" }
        });
        public static EmbeddedSourcePolicy FromSecureConfiguration(string secure)
        {
            using (var doc = StrictJson.Parse(secure, 4096))
            {
                var root = doc.RootElement;
                StrictJson.Shape(root, new[] { "policy", "enabled" });
                if (StrictJson.Text(root, "policy") != "LAB_EMBEDDED_SOURCES" || root.GetProperty("enabled").ValueKind != JsonValueKind.True)
                    throw new BoundaryException("LAB_POLICY_NOT_ENABLED");
                return new EmbeddedSourcePolicy();
            }
        }
        public IReadOnlyList<string> Authorize(Proposal proposal, string callerReadableCaseBindings)
        {
            if (proposal.Kind != ProposalKind.PackDraft) throw new BoundaryException("FILE_ACL_VERIFIER_NOT_CONFIGURED");
            if (proposal.PackDraft.TemplateRelease != Schema.TemplateRelease || proposal.PackDraft.SkillRelease != Schema.SkillRelease)
                throw new BoundaryException("RELEASE_NOT_INSTALLED");
            using (var doc = StrictJson.Parse(callerReadableCaseBindings, 250000))
            {
                var root = doc.RootElement;
                StrictJson.Shape(root, new[] { "schemaVersion", "classification", "sources" });
                if (StrictJson.Text(root, "schemaVersion") != "shuttle.sources.embedded.v0.1" || StrictJson.Text(root, "classification") != "SYNTHETIC_ONLY")
                    throw new BoundaryException("SOURCE_POLICY_MISMATCH");
                var sources = root.GetProperty("sources");
                if (sources.ValueKind != JsonValueKind.Array || sources.GetArrayLength() != 4) throw new BoundaryException("SOURCE_POLICY_MISMATCH");
                var ids = new HashSet<string>(StringComparer.Ordinal);
                foreach (var source in sources.EnumerateArray())
                {
                    StrictJson.Shape(source, new[] { "id", "sha256", "content" });
                    var id = StrictJson.Text(source, "id");
                    if (!ids.Add(id) || !SourceHashes.TryGetValue(id, out var expected) || StrictJson.Text(source, "sha256") != expected || Hash(StrictJson.Text(source, "content")) != expected)
                        throw new BoundaryException("SOURCE_INTEGRITY");
                }
                return new List<string>(ids);
            }
        }
        private static string Hash(string text)
        {
            using (var hash = SHA256.Create()) return BitConverter.ToString(hash.ComputeHash(new UTF8Encoding(false, true).GetBytes(text))).Replace("-", "").ToLowerInvariant();
        }
    }
}
