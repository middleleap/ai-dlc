using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using Shuttle.Guards;

namespace Shuttle.Dataverse
{
    public sealed class BoundaryException : Exception
    {
        public string Code { get; }
        public BoundaryException(string code) : base(code) { Code = code; }
    }

    public static class StrictJson
    {
        public static JsonDocument Parse(string text, int maxBytes)
        {
            if (text == null) throw new BoundaryException("INVALID_JSON");
            try
            {
                if (new UTF8Encoding(false, true).GetByteCount(text) > maxBytes) throw new BoundaryException("JSON_TOO_LARGE");
                var document = JsonDocument.Parse(text, new JsonDocumentOptions { AllowTrailingCommas = false, CommentHandling = JsonCommentHandling.Disallow, MaxDepth = 16 });
                try { Unique(document.RootElement); return document; }
                catch { document.Dispose(); throw; }
            }
            catch (JsonException) { throw new BoundaryException("INVALID_JSON"); }
            catch (EncoderFallbackException) { throw new BoundaryException("INVALID_UNICODE"); }
        }
        private static void Unique(JsonElement e)
        {
            if (e.ValueKind == JsonValueKind.Object)
            {
                var names = new HashSet<string>(StringComparer.Ordinal);
                foreach (var p in e.EnumerateObject())
                { if (!names.Add(p.Name)) throw new BoundaryException("DUPLICATE_JSON_PROPERTY"); Unique(p.Value); }
            }
            else if (e.ValueKind == JsonValueKind.Array) foreach (var item in e.EnumerateArray()) Unique(item);
            else if (e.ValueKind == JsonValueKind.String)
            {
                // System.Text.Json rejects escaped unpaired surrogates when materializing strings.
                try { new UTF8Encoding(false, true).GetByteCount(e.GetString()); }
                catch (Exception ex) when (ex is InvalidOperationException || ex is EncoderFallbackException)
                { throw new BoundaryException("INVALID_UNICODE"); }
            }
        }
        public static void Shape(JsonElement obj, string[] required, params string[] optional)
        {
            if (obj.ValueKind != JsonValueKind.Object) throw new BoundaryException("INVALID_JSON_SHAPE");
            var allowed = new HashSet<string>(required.Concat(optional), StringComparer.Ordinal);
            foreach (var p in obj.EnumerateObject()) if (!allowed.Contains(p.Name)) throw new BoundaryException("UNKNOWN_JSON_PROPERTY");
            foreach (var name in required) if (!obj.TryGetProperty(name, out _)) throw new BoundaryException("MISSING_JSON_PROPERTY");
        }
        public static string Text(JsonElement obj, string name)
        {
            var value = obj.GetProperty(name);
            if (value.ValueKind != JsonValueKind.String) throw new BoundaryException("INVALID_JSON_TYPE");
            return value.GetString();
        }
        public static int Int(JsonElement obj, string name)
        {
            var value = obj.GetProperty(name);
            if (value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var number) || number < 1)
                throw new BoundaryException("INVALID_REVISION");
            return number;
        }
        public static Guid Id(JsonElement obj, string name)
        {
            var text = Text(obj, name);
            if (!Guid.TryParseExact(text, "D", out var id) || id == Guid.Empty || text != id.ToString("D"))
                throw new BoundaryException("INVALID_IDENTIFIER");
            return id;
        }
    }

    public static class StrictWireDecoder
    {
        public const int MaxWireBytes = 500000;
        public static Proposal Decode(string json)
        {
            using (var document = StrictJson.Parse(json, MaxWireBytes))
            {
                var root = document.RootElement;
                StrictJson.Shape(root, new[] { "schemaVersion", "kind", "caseId", "expectedContentRevision", "requestKey", "payload" });
                var version = StrictJson.Text(root, "schemaVersion");
                var kind = StrictJson.Text(root, "kind");
                var caseId = StrictJson.Id(root, "caseId");
                var revision = StrictJson.Int(root, "expectedContentRevision");
                var requestKey = StrictJson.Id(root, "requestKey");
                var payload = root.GetProperty("payload");
                Proposal proposal;
                if (kind == "PackDraft")
                {
                    StrictJson.Shape(payload, new[] { "templateRelease", "skillRelease", "sections" });
                    var sections = payload.GetProperty("sections");
                    if (sections.ValueKind != JsonValueKind.Array || sections.GetArrayLength() > 12) throw new BoundaryException("INVALID_PACK_PAYLOAD");
                    var values = new List<PackSection>();
                    foreach (var section in sections.EnumerateArray())
                    {
                        StrictJson.Shape(section, new[] { "key", "title", "text", "sourceIds" }, "owedOwner");
                        var sources = section.GetProperty("sourceIds");
                        if (sources.ValueKind != JsonValueKind.Array || sources.GetArrayLength() > 32) throw new BoundaryException("INVALID_SOURCE_REFERENCE");
                        var ids = new List<string>();
                        foreach (var source in sources.EnumerateArray())
                        {
                            if (source.ValueKind != JsonValueKind.String) throw new BoundaryException("INVALID_SOURCE_REFERENCE");
                            ids.Add(source.GetString());
                        }
                        values.Add(new PackSection(StrictJson.Text(section, "key"), StrictJson.Text(section, "title"), StrictJson.Text(section, "text"), ids,
                            section.TryGetProperty("owedOwner", out _) ? StrictJson.Text(section, "owedOwner") : null));
                    }
                    proposal = new Proposal(version, ProposalKind.PackDraft, caseId, revision, requestKey,
                        new PackDraftPayload(StrictJson.Text(payload, "templateRelease"), StrictJson.Text(payload, "skillRelease"), values));
                }
                else if (kind == "InspectionComment")
                {
                    StrictJson.Shape(payload, new[] { "artifactVersionId", "artifactHash", "text" }, "relatedCommentId");
                    proposal = new Proposal(version, ProposalKind.InspectionComment, caseId, revision, requestKey, inspectionComment:
                        new InspectionCommentPayload(StrictJson.Id(payload, "artifactVersionId"), StrictJson.Text(payload, "artifactHash"), StrictJson.Text(payload, "text"),
                            payload.TryGetProperty("relatedCommentId", out _) ? (Guid?)StrictJson.Id(payload, "relatedCommentId") : null));
                }
                else throw new BoundaryException("INVALID_KIND");
                var error = ProposalGuard.ValidateShape(proposal);
                if (error != null) throw new BoundaryException(error);
                return proposal;
            }
        }
    }
}
