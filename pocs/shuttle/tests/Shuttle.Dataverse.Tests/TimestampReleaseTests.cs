using System.Linq;
using System.Text.Json.Nodes;
using Shuttle.Dataverse;
using Shuttle.Guards;

internal static partial class Program
{
    static void TestTimestampReleaseCommit()
    {
        Check(Schema.TemplateRelease == "readiness-gaps-public-v0.1" && Schema.SkillRelease == "shuttle-public-v0.1",
            "legacy public tuple remains the default");
        Check(Schema.UtcPrefixedTemplateRelease == "readiness-gaps-public-utc-prefix-v0.2",
            "timestamp candidate uses an explicit public release");
        Check(Schema.ResolveRenderContract(Schema.TemplateRelease, Schema.SkillRelease) == RenderControlContract.CanonicalIsoV1,
            "legacy tuple retains canonical ISO render controls");
        Check(Schema.ResolveRenderContract(Schema.UtcPrefixedTemplateRelease, Schema.SkillRelease) == RenderControlContract.UtcPrefixedIsoV1,
            "only the candidate tuple selects UTC prefixed controls");

        var legacy = StrictWireDecoder.Decode(Pack);
        const string legacyHash = "e76cfc341e1585e9d5f9c8164cf1259fb39ba1bb420682e6e71aed883e0d4479";
        Check(CanonicalProposal.Hash(legacy) == legacyHash, "legacy public canonical hash is unchanged");
        var candidatePayload = Pack.Replace(Schema.TemplateRelease, Schema.UtcPrefixedTemplateRelease);
        var candidate = StrictWireDecoder.Decode(candidatePayload);
        var candidateHash = CanonicalProposal.Hash(candidate);
        Check(candidateHash != legacyHash, "canonical hash binds the render release before dispatch");

        var policy = EmbeddedSourcePolicy.FromSecureConfiguration(Config);
        Check(policy.Authorize(candidate, Bindings).OrderBy(x => x).SequenceEqual(new[] { "S01", "S02", "S03", "S04" }),
            "candidate retains the exact public embedded source policy");
        var changedSources = JsonNode.Parse(Bindings); changedSources["sources"][0]["content"] = "changed";
        Boundary(() => policy.Authorize(candidate, changedSources.ToJsonString()), "SOURCE_INTEGRITY");

        foreach (var template in new[] { Schema.TemplateRelease, Schema.UtcPrefixedTemplateRelease })
        {
            var payload = Pack.Replace(Schema.TemplateRelease, template);
            var expected = CanonicalProposal.Hash(StrictWireDecoder.Decode(payload));
            using (var f = new Fixture())
            {
                f.Target[Schema.Payload] = payload;
                f.Pre(); f.Post();
                var work = f.Writer.Creates.Single(x => x.LogicalName == Schema.Work);
                var received = f.Writer.Creates.Single(x => x.LogicalName == Schema.Event);
                Check(work.GetAttributeValue<string>("shuttle_templaterelease") == template &&
                    work.GetAttributeValue<string>("shuttle_skillrelease") == Schema.SkillRelease,
                    "guarded commit stamps the exact proposal release tuple into work");
                Check(f.Target.GetAttributeValue<string>(Schema.Hash) == expected &&
                    received.GetAttributeValue<string>(Schema.Hash) == expected &&
                    work.GetAttributeValue<string>("shuttle_inputhash") == expected,
                    "proposal, event and work retain the same canonical release binding");
            }
            PluginReject(f => {
                f.Target[Schema.Payload] = payload;
                f.Caller.ReceiptHash = expected;
            }, "REPLAY_RECONCILIATION_REQUIRED");
            PluginReject(f => {
                f.Target[Schema.Payload] = payload;
                f.Caller.ReceiptHash = template == Schema.TemplateRelease ? candidateHash : legacyHash;
            }, "REQUEST_KEY_CONFLICT");
            using (var f = new Fixture())
            {
                f.Target[Schema.Payload] = payload;
                f.Pre();
                f.Target[Schema.Payload] = template == Schema.TemplateRelease ? candidatePayload : Pack;
                RejectPlugin(f.Post, "VALIDATION_STATE_MISMATCH");
                Check(f.Writer.Creates.Count == 0, "release tampering after validation emits no event or work");
            }
        }

        var unsupported = new[] {
            new[] { "uninstalled", Schema.SkillRelease },
            new[] { Schema.TemplateRelease, "shuttle-public-v0.2" },
            new[] { Schema.UtcPrefixedTemplateRelease, "shuttle-public-v0.2" },
            new[] { "readiness-gaps-public-utc-prefix-v0.9", Schema.SkillRelease },
            new[] { Schema.TemplateRelease.ToUpperInvariant(), Schema.SkillRelease },
            new[] { Schema.UtcPrefixedTemplateRelease, Schema.SkillRelease.ToUpperInvariant() },
            new[] { Schema.TemplateRelease + " ", Schema.SkillRelease },
            new[] { Schema.UtcPrefixedTemplateRelease, Schema.SkillRelease + " " }
        };
        foreach (var tuple in unsupported)
        {
            Boundary(() => Schema.ResolveRenderContract(tuple[0], tuple[1]), "RELEASE_NOT_INSTALLED");
            var payload = Pack.Replace(Schema.TemplateRelease, tuple[0]).Replace(Schema.SkillRelease, tuple[1]);
            Boundary(() => policy.Authorize(StrictWireDecoder.Decode(payload), Bindings), "RELEASE_NOT_INSTALLED");
            PluginReject(f => f.Target[Schema.Payload] = payload, "RELEASE_NOT_INSTALLED");
        }
        foreach (var tuple in new[] {
            new string[] { null, Schema.SkillRelease },
            new string[] { Schema.UtcPrefixedTemplateRelease, null },
            new[] { "", Schema.SkillRelease },
            new[] { Schema.TemplateRelease, "" }
        }) Boundary(() => Schema.ResolveRenderContract(tuple[0], tuple[1]), "RELEASE_NOT_INSTALLED");
    }
}
