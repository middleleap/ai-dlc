using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    // Plain-text binding for this exact synthetic template release. This is not a general
    // Word parser or a substitute for Word connector/visual/label/MFA qualification.
    internal static class DocxControlBinding
    {
        private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        private const string StaticDocumentText = "Shuttle Readiness and Gaps Pack" + "SYNTHETIC POC · DRAFT · NOT APPROVED" +
            "This pack identifies missing inputs and next actions. It does not grant bank readiness, launch permission or approval." +
            "Inspect the generated contents against their sources. A saved document is a draft, not an approval or an accepted readiness decision." +
            "CaseCase titleCase IDDecision-basis revisionProposal IDRender work IDCanonical proposal SHA-256Generated at (UTC)Template releaseRecorded skill release" +
            "Decision briefScope and seven factsReadiness gaps and next actionsInheritance and evidenceProvenance and limitsInspection and outstanding decisionsSource register";
        private static readonly string[] Names = { "SH_CaseKey", "SH_CaseTitle", "SH_CaseId", "SH_ContentRevision", "SH_ProposalId", "SH_WorkId",
            "SH_ProposalHash", "SH_GeneratedUtc", "SH_TemplateRelease", "SH_SkillRelease", "SH_DecisionBrief", "SH_ScopeAndFacts", "SH_ReadinessGaps",
            "SH_Inheritance", "SH_Provenance", "SH_Inspection", "SH_SourceRegister" };
        private static readonly string[] PartNames = { "word/document.xml", "word/styles.xml", "docProps/core.xml", "word/numbering.xml",
            "_rels/.rels", "word/_rels/document.xml.rels", "word/_rels/header1.xml.rels", "word/_rels/footer1.xml.rels", "word/header1.xml",
            "word/footer1.xml", "[Content_Types].xml", "docProps/custom.xml", "docProps/app.xml", "word/footnotes.xml",
            "word/_rels/footnotes.xml.rels", "word/endnotes.xml", "word/_rels/endnotes.xml.rels", "word/settings.xml", "word/comments.xml",
            "word/_rels/comments.xml.rels", "word/fontTable.xml", "word/_rels/fontTable.xml.rels" };
        // Public synthetic contract: no custom XML or tenant metadata is admitted.
        private static readonly string[] DirectoryNames = { "_rels/", "docProps/", "word/", "word/_rels/" };
        // Exact bytes of the inert public synthetic numbering part; changes require a new review.
        private const string NumberingHash = "055bb267c1ddeb4c76dbaa48ef0a716aace0370edfda8ef92bd71d0e4863807a";
        // Static paragraph/control associations are part of the release. Matching
        // aliases alone would let a valid section be moved under another heading.
        private const string BodyLayoutHash = "d2a6b4f59b8bafb7f59cc83f0ff5ea3885e2c098638dcb9964e9908142423953";
        // This release has paragraphs and plain-text controls only. A denylist of
        // active Word elements is insufficient: e.g. noBreakHyphen and numbering
        // labels display text without a w:t node. Keep exact legal text positions.
        private static readonly IDictionary<string, string[]> StoryChildren = new Dictionary<string, string[]>(StringComparer.Ordinal) {
            { "document", new[] { "body" } }, { "body", new[] { "p", "sdt", "sectPr" } },
            { "hdr", new[] { "p" } }, { "ftr", new[] { "p" } }, { "p", new[] { "pPr", "r" } },
            { "pPr", new[] { "jc", "pStyle", "pageBreakBefore", "spacing" } },
            { "r", new[] { "rPr", "t", "br", "cr", "tab", "fldChar", "instrText" } },
            { "rPr", new[] { "b", "bCs", "color", "i", "iCs", "sz", "szCs" } },
            { "sdt", new[] { "sdtPr", "sdtContent" } }, { "sdtContent", new[] { "p" } },
            { "sdtPr", new[] { "alias", "id", "tag", "text" } },
            { "sectPr", new[] { "docGrid", "footerReference", "headerReference", "pgMar", "pgNumType", "pgSz" } },
            { "alias", new string[0] }, { "b", new string[0] }, { "bCs", new string[0] }, { "br", new string[0] },
            { "color", new string[0] }, { "cr", new string[0] }, { "docGrid", new string[0] }, { "fldChar", new string[0] },
            { "footerReference", new string[0] }, { "headerReference", new string[0] }, { "i", new string[0] },
            { "iCs", new string[0] }, { "id", new string[0] }, { "instrText", new string[0] }, { "jc", new string[0] },
            { "pStyle", new string[0] }, { "pageBreakBefore", new string[0] }, { "pgMar", new string[0] },
            { "pgNumType", new string[0] }, { "pgSz", new string[0] }, { "spacing", new string[0] },
            { "sz", new string[0] }, { "szCs", new string[0] }, { "t", new string[0] }, { "tab", new string[0] },
            { "tag", new string[0] }, { "text", new string[0] } };

        internal static void Verify(byte[] bytes, IDictionary<string, string> expected)
        {
            if (bytes == null || bytes.Length == 0 || bytes.Length > 10 * 1024 * 1024 || expected == null ||
                expected.Count != Names.Length || Names.Any(n => !expected.ContainsKey(n) || expected[n] == null))
                throw new BoundaryException("PROVIDER_DOCUMENT_BINDING_MISMATCH");
            try
            {
                using (var stream = new MemoryStream(bytes, false))
                using (var zip = new ZipArchive(stream, ZipArchiveMode.Read, false))
                {
                    if (zip.Entries.Count > 256) Deny();
                    var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    long expanded = 0;
                    foreach (var entry in zip.Entries)
                    {
                        if (!names.Add(entry.FullName) || entry.FullName.Contains("..") || entry.FullName.Contains("\\") ||
                            entry.FullName.StartsWith("/", StringComparison.Ordinal) || entry.FullName.EndsWith(".bin", StringComparison.OrdinalIgnoreCase) ||
                            entry.FullName.StartsWith("word/media/", StringComparison.OrdinalIgnoreCase) ||
                            entry.FullName.StartsWith("word/embeddings/", StringComparison.OrdinalIgnoreCase)) Deny();
                        if (entry.FullName.EndsWith("/", StringComparison.Ordinal))
                        {
                            if (!DirectoryNames.Contains(entry.FullName, StringComparer.Ordinal) || entry.Length != 0) Deny();
                        }
                        else if (!PartNames.Contains(entry.FullName, StringComparer.Ordinal)) Deny();
                        expanded = checked(expanded + entry.Length);
                        if (expanded > 32 * 1024 * 1024 || entry.Length > 2 * 1024 * 1024) Deny();
                        if (entry.FullName == "word/numbering.xml")
                            using (var sha = SHA256.Create())
                            using (var body = entry.Open())
                                if (BitConverter.ToString(sha.ComputeHash(body)).Replace("-", "").ToLowerInvariant() !=
                                    NumberingHash) Deny();
                        if (entry.FullName.EndsWith(".rels", StringComparison.OrdinalIgnoreCase))
                        {
                            var rels = Xml(entry);
                            foreach (var rel in rels.Descendants())
                                if ((string)rel.Attribute("TargetMode") == "External" || ((string)rel.Attribute("Type") ?? "").EndsWith("/attachedTemplate", StringComparison.Ordinal)) Deny();
                            Relationships(entry.FullName, rels);
                        }
                        if (entry.FullName == "[Content_Types].xml") ContentTypes(Xml(entry));
                        if (entry.FullName.StartsWith("word/", StringComparison.Ordinal) && entry.FullName.EndsWith(".xml", StringComparison.Ordinal))
                        {
                            var document = Xml(entry);
                            var story = entry.FullName == "word/document.xml" || entry.FullName == "word/header1.xml" || entry.FullName == "word/footer1.xml";
                            if (story) VerifyStoryGrammar(entry.FullName, document);
                            foreach (var e in document.Descendants())
                                if ((story && e.Name.Namespace != W) ||
                                    new[] { "altChunk", "drawing", "object", "pict", "subDoc", "vanish", "webHidden", "del", "ins", "moveFrom", "moveTo", "dataBinding", "fldSimple", "sym", "footnoteReference", "endnoteReference", "numPr" }.Any(x => e.Name == W + x)) Deny();
                            if (entry.FullName == "word/document.xml") VerifyMainDocument(document, expected);
                            else
                            {
                                var text = string.Concat(document.Descendants(W + "t").Select(x => x.Value));
                                var wanted = entry.FullName == "word/header1.xml" ? "SHUTTLE · SYNTHETIC LAB" :
                                    entry.FullName == "word/footer1.xml" ? "Draft — no approval  |  " : "";
                                if (text != wanted) Deny();
                                var fields = document.Descendants(W + "instrText").ToArray();
                                if (fields.Any(e => entry.FullName != "word/footer1.xml" || e.Value.Trim() != "PAGE")) Deny();
                            }
                        }
                    }
                    // Word removes empty relationship parts; each remains checked as empty
                    // if present. The package and document relationship graphs are mandatory.
                    if (PartNames.Any(p => (!p.EndsWith(".rels", StringComparison.Ordinal) || p == "_rels/.rels" || p == "word/_rels/document.xml.rels") && !names.Contains(p))) Deny();
                }
            }
            catch (InvalidDataException) { Deny(); }
            catch (XmlException) { Deny(); }
            catch (OverflowException) { Deny(); }
        }

        private static void Relationships(string part, XDocument xml)
        {
            XNamespace ns = "http://schemas.openxmlformats.org/package/2006/relationships";
            const string office = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
            var allowed = new HashSet<string>(StringComparer.Ordinal);
            if (part == "_rels/.rels")
            {
                allowed.Add(office + "officeDocument\nword/document.xml");
                allowed.Add("http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\ndocProps/core.xml");
                allowed.Add(office + "extended-properties\ndocProps/app.xml");
                allowed.Add(office + "custom-properties\ndocProps/custom.xml");
            }
            else if (part == "word/_rels/document.xml.rels")
            {
                foreach (var name in new[] { "styles", "numbering", "footnotes", "endnotes", "settings", "comments", "fontTable", "header", "footer" })
                    allowed.Add(office + name + "\nword/" + (name == "header" ? "header1.xml" : name == "footer" ? "footer1.xml" : name + ".xml"));
            }
            if (xml.Root == null || xml.Root.Name != ns + "Relationships" || xml.Root.Elements().Count() != allowed.Count) Deny();
            var ids = new HashSet<string>(StringComparer.Ordinal);
            foreach (var rel in xml.Root.Elements())
            {
                var type = (string)rel.Attribute("Type");
                var id = (string)rel.Attribute("Id");
                var key = type + "\n" + CanonicalTarget(part, (string)rel.Attribute("Target"));
                if (rel.Name != ns + "Relationship" || string.IsNullOrEmpty(id) || !ids.Add(id) || type == null ||
                    !allowed.Remove(key) || rel.Attribute("TargetMode") != null) Deny();
            }
            if (allowed.Count != 0) Deny();
        }

        private static string CanonicalTarget(string source, string target)
        {
            if (string.IsNullOrEmpty(target) || target.Contains("..") || target.Contains("//") || target.Contains("\\") ||
                target.Contains(":") || target.Contains("%") || target.Contains("?") || target.Contains("#")) Deny();
            if (target.StartsWith("/", StringComparison.Ordinal)) return target.Substring(1);
            return (source == "_rels/.rels" ? "" : source.StartsWith("customXml/", StringComparison.Ordinal) ? "customXml/" : "word/") + target;
        }

        private static void ContentTypes(XDocument xml)
        {
            XNamespace ns = "http://schemas.openxmlformats.org/package/2006/content-types";
            const string word = "application/vnd.openxmlformats-officedocument.wordprocessingml.";
            var expected = new Dictionary<string, string>(StringComparer.Ordinal) {
                { "/word/document.xml", word + "document.main+xml" }, { "/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml" },
                { "/docProps/custom.xml", "application/vnd.openxmlformats-officedocument.custom-properties+xml" },
                { "/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml" } };
            foreach (var name in new[] { "styles", "numbering", "footnotes", "endnotes", "settings", "comments", "fontTable", "header", "footer" })
                expected.Add("/word/" + (name == "header" ? "header1" : name == "footer" ? "footer1" : name) + ".xml", word + name + "+xml");
            if (xml.Root == null || xml.Root.Name != ns + "Types") Deny();
            var defaults = new Dictionary<string, string>(StringComparer.Ordinal);
            var overrides = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var e in xml.Root.Elements())
            {
                var part = (string)e.Attribute("PartName");
                if (e.Name == ns + "Override")
                {
                    if (part == null || !expected.ContainsKey(part) || (string)e.Attribute("ContentType") != expected[part]) Deny();
                    if (overrides.ContainsKey(part)) Deny();
                    overrides.Add(part, (string)e.Attribute("ContentType"));
                }
                else if (e.Name == ns + "Default")
                {
                    var extension = (string)e.Attribute("Extension");
                    if (extension == null || defaults.ContainsKey(extension) ||
                        !new[] { "png", "jpeg", "jpg", "bmp", "gif", "svg", "rels", "xml", "odttf" }.Contains(extension, StringComparer.Ordinal) ||
                        (extension == "rels" && (string)e.Attribute("ContentType") != "application/vnd.openxmlformats-package.relationships+xml") ||
                        (extension == "xml" && (string)e.Attribute("ContentType") != "application/xml" &&
                            (string)e.Attribute("ContentType") != word + "document.main+xml")) Deny();
                    defaults.Add(extension, (string)e.Attribute("ContentType"));
                }
                else Deny();
            }
            if (!defaults.ContainsKey("rels") || !defaults.ContainsKey("xml") ||
                expected.Any(p => (overrides.ContainsKey(p.Key) ? overrides[p.Key] : defaults["xml"]) != p.Value)) Deny();
        }

        private static void VerifyMainDocument(XDocument doc, IDictionary<string, string> expected)
        {
            var bodyTokens = doc.Root.Element(W + "body").Elements().Select(e => e.Name == W + "p" ?
                "p:" + string.Concat(e.Descendants(W + "t").Select(t => t.Value)) : e.Name == W + "sdt" ?
                "sdt:" + (string)e.Element(W + "sdtPr")?.Element(W + "alias")?.Attribute(W + "val") : "sectPr").ToArray();
            using (var sha = SHA256.Create())
                if (bodyTokens.Length != 39 || BitConverter.ToString(sha.ComputeHash(new UTF8Encoding(false, true).GetBytes(string.Join("\n", bodyTokens)))).Replace("-", "").ToLowerInvariant() != BodyLayoutHash) Deny();
            var controls = doc.Descendants(W + "sdt").ToArray();
            if (controls.Length != Names.Length) Deny();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var control in controls)
            {
                if (control.Ancestors(W + "sdt").Any()) Deny();
                if (control.Elements(W + "sdtPr").Count() != 1 || control.Elements(W + "sdtContent").Count() != 1) Deny();
                var props = control.Element(W + "sdtPr");
                var content = control.Element(W + "sdtContent");
                var title = (string)props.Element(W + "alias")?.Attribute(W + "val");
                if (title == null || !seen.Add(title) || !expected.ContainsKey(title) || (string)props.Element(W + "tag")?.Attribute(W + "val") != title ||
                    props.Element(W + "text") == null || content.Descendants(W + "instrText").Any() || content.Descendants(W + "fldChar").Any()) Deny();
                var paragraphs = content.Descendants(W + "p").ToArray();
                var actual = string.Join("\n", paragraphs.Select(p => string.Concat(p.Descendants().Select(e =>
                    e.Name == W + "t" ? e.Value : e.Name == W + "br" || e.Name == W + "cr" ? "\n" : e.Name == W + "tab" ? "\t" : ""))));
                if (actual != expected[title]) Deny();
            }
            if (doc.Descendants(W + "instrText").Any() || doc.Descendants(W + "fldChar").Any() ||
                string.Concat(doc.Descendants(W + "t").Where(t => !t.Ancestors(W + "sdt").Any()).Select(t => t.Value)) != StaticDocumentText) Deny();
        }

        private static void VerifyStoryGrammar(string part, XDocument doc)
        {
            var root = part == "word/document.xml" ? "document" : part == "word/header1.xml" ? "hdr" : "ftr";
            if (doc.Root == null || doc.Root.Name != W + root || doc.Root.Elements().Count() != 1 ||
                doc.Nodes().Any(n => !(n is XElement) && (!(n is XText) || !string.IsNullOrWhiteSpace(((XText)n).Value)))) Deny();
            foreach (var e in doc.Root.DescendantsAndSelf())
            {
                string[] allowed;
                if (e.Name.Namespace != W || !StoryChildren.TryGetValue(e.Name.LocalName, out allowed) ||
                    e.Elements().Any(c => c.Name.Namespace != W || !allowed.Contains(c.Name.LocalName, StringComparer.Ordinal)) ||
                    e.Nodes().Any(n => !(n is XElement) && (!(n is XText) ||
                        (e.Name != W + "t" && e.Name != W + "instrText" && !string.IsNullOrWhiteSpace(((XText)n).Value))))) Deny();
                if ((e.Name == W + "p" && e.Elements(W + "pPr").Count() > 1) ||
                    (e.Name == W + "r" && e.Elements(W + "rPr").Count() > 1) ||
                    (e.Name == W + "body" && (e.Elements(W + "sectPr").Count() != 1 || e.Elements().Last().Name != W + "sectPr")) ||
                    (e.Name == W + "sdtPr" && new[] { "alias", "id", "tag", "text" }.Any(n => e.Elements(W + n).Count() != 1))) Deny();
            }
        }

        private static XDocument Xml(ZipArchiveEntry entry)
        {
            using (var stream = entry.Open())
            using (var reader = XmlReader.Create(stream, new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null,
                MaxCharactersInDocument = 2 * 1024 * 1024, MaxCharactersFromEntities = 0 }))
                return XDocument.Load(reader, LoadOptions.PreserveWhitespace);
        }
        private static void Deny() { throw new BoundaryException("PROVIDER_DOCUMENT_BINDING_MISMATCH"); }
    }
}
