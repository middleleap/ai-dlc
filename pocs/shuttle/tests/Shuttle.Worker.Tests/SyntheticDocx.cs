using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using Shuttle.Dataverse;
using Shuttle.Worker;

// Created solely from public text and explicit package rules. This is a parser
// fixture, not a Word connector output, stored template or tenant capture.
internal static class SyntheticDocx
{
    private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    private static readonly string[] Names = { "SH_CaseKey", "SH_CaseTitle", "SH_CaseId", "SH_ContentRevision", "SH_ProposalId", "SH_WorkId",
        "SH_ProposalHash", "SH_GeneratedUtc", "SH_TemplateRelease", "SH_SkillRelease", "SH_DecisionBrief", "SH_ScopeAndFacts", "SH_ReadinessGaps",
        "SH_Inheritance", "SH_Provenance", "SH_Inspection", "SH_SourceRegister" };
    private static readonly string[] Labels = { "Case", "Case title", "Case ID", "Decision-basis revision", "Proposal ID", "Render work ID",
        "Canonical proposal SHA-256", "Generated at (UTC)", "Template release", "Recorded skill release", "Decision brief", "Scope and seven facts",
        "Readiness gaps and next actions", "Inheritance and evidence", "Provenance and limits", "Inspection and outstanding decisions", "Source register" };

    internal static IDictionary<string, string> Controls(DateTime? committed = null) => RenderControls.Build(
        StrictWireDecoder.Decode(Program.Pack), File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures/case-alpha.json")),
        Program.ProposalId, Program.WorkId, committed ?? new DateTime(2026, 10, 25, 0, 0, 0, DateTimeKind.Utc));

    internal static byte[] Create(IDictionary<string, string> controls)
    {
        var body = new XElement(W + "body",
            Paragraph("Shuttle Readiness and Gaps Pack"), Paragraph("SYNTHETIC POC · DRAFT · NOT APPROVED"),
            Paragraph("This pack identifies missing inputs and next actions. It does not grant bank readiness, launch permission or approval."),
            Paragraph("Inspect the generated contents against their sources. A saved document is a draft, not an approval or an accepted readiness decision."));
        for (var i = 0; i < Names.Length; i++)
        {
            body.Add(Paragraph(Labels[i]));
            body.Add(new XElement(W + "sdt", new XElement(W + "sdtPr", new XElement(W + "alias", new XAttribute(W + "val", Names[i])),
                new XElement(W + "id", new XAttribute(W + "val", i + 1)), new XElement(W + "tag", new XAttribute(W + "val", Names[i])), new XElement(W + "text")),
                new XElement(W + "sdtContent", controls[Names[i]].Split('\n').Select(Paragraph))));
        }
        body.Add(new XElement(W + "sectPr"));
        using var memory = new MemoryStream();
        using (var zip = new ZipArchive(memory, ZipArchiveMode.Create, true))
        {
            Add(zip, "word/document.xml", new XElement(W + "document", body));
            Add(zip, "word/header1.xml", new XElement(W + "hdr", Paragraph("SHUTTLE · SYNTHETIC LAB")));
            Add(zip, "word/footer1.xml", new XElement(W + "ftr", Paragraph("Draft — no approval  |  ")));
            foreach (var part in new[] { "styles", "footnotes", "endnotes", "settings", "comments", "fontTable" })
                Add(zip, "word/" + part + ".xml", new XElement(W + part));
            AddText(zip, "word/numbering.xml", "<w:numbering xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" />");
            foreach (var part in new[] { "core", "custom", "app" }) Add(zip, "docProps/" + part + ".xml", new XElement("Properties"));
            Add(zip, "_rels/.rels", Relationships(new[] { Pair("officeDocument", "word/document.xml"),
                new KeyValuePair<string, string>("http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"),
                Pair("extended-properties", "docProps/app.xml"), Pair("custom-properties", "docProps/custom.xml") }));
            Add(zip, "word/_rels/document.xml.rels", Relationships(new[] { "styles", "numbering", "footnotes", "endnotes", "settings", "comments", "fontTable", "header", "footer" }
                .Select(p => Pair(p, p == "header" ? "header1.xml" : p == "footer" ? "footer1.xml" : p + ".xml"))));
            Add(zip, "[Content_Types].xml", ContentTypes());
        }
        return memory.ToArray();
    }

    private static XElement Paragraph(string text) => new XElement(W + "p", new XElement(W + "r", new XElement(W + "t", new XAttribute(XNamespace.Xml + "space", "preserve"), text)));
    private static KeyValuePair<string, string> Pair(string type, string target) => new KeyValuePair<string, string>("http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + type, target);
    private static XElement Relationships(IEnumerable<KeyValuePair<string, string>> pairs)
    {
        XNamespace ns = "http://schemas.openxmlformats.org/package/2006/relationships";
        return new XElement(ns + "Relationships", pairs.Select((p, i) => new XElement(ns + "Relationship", new XAttribute("Id", "rId" + i), new XAttribute("Type", p.Key), new XAttribute("Target", p.Value))));
    }
    private static XElement ContentTypes()
    {
        XNamespace ns = "http://schemas.openxmlformats.org/package/2006/content-types";
        const string word = "application/vnd.openxmlformats-officedocument.wordprocessingml.";
        var types = new Dictionary<string, string> {
            ["/word/document.xml"] = word + "document.main+xml", ["/docProps/core.xml"] = "application/vnd.openxmlformats-package.core-properties+xml",
            ["/docProps/custom.xml"] = "application/vnd.openxmlformats-officedocument.custom-properties+xml", ["/docProps/app.xml"] = "application/vnd.openxmlformats-officedocument.extended-properties+xml" };
        foreach (var name in new[] { "styles", "numbering", "footnotes", "endnotes", "settings", "comments", "fontTable", "header", "footer" })
            types.Add("/word/" + (name == "header" ? "header1" : name == "footer" ? "footer1" : name) + ".xml", word + name + "+xml");
        return new XElement(ns + "Types", new XElement(ns + "Default", new XAttribute("Extension", "rels"), new XAttribute("ContentType", "application/vnd.openxmlformats-package.relationships+xml")),
            new XElement(ns + "Default", new XAttribute("Extension", "xml"), new XAttribute("ContentType", "application/xml")),
            types.Select(t => new XElement(ns + "Override", new XAttribute("PartName", t.Key), new XAttribute("ContentType", t.Value))));
    }
    private static void Add(ZipArchive zip, string name, XElement xml) => AddText(zip, name, xml.ToString(SaveOptions.DisableFormatting));
    private static void AddText(ZipArchive zip, string name, string value)
    {
        var entry = zip.CreateEntry(name);
        entry.LastWriteTime = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false, true)); writer.Write(value);
    }
}
