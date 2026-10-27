using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Shuttle.Dataverse;
using Shuttle.Worker;

internal static class ProviderBoundaryTests
{
    private static int checks;
    internal static void Run()
    {
        var f = new ProviderFixture();
        Check(f.Request.ExpectedControls.Count == 17, "all released public controls are bound");
        var read = f.Read();
        Check(read.InputHash == f.Request.InputHash && read.ExactVersionBytes.SequenceEqual(f.Bytes), "trusted bytes + input returned");
        Check(f.Rechecks == 2 && f.Transport.MetadataReads == 2 && f.Transport.AclReads == 4 && f.Transport.PermissionReads == 4, "metadata, private ACLs, named-owner read permissions and source access rechecked after bytes");
        var evidence = ExactFileEvidence.FromProviderRead(read, f.Request.FileId, f.Request.Version, f.Request.ETag, f.Request.StorageKey,
            f.Now, f.Request.InputHash);
        Check(evidence.ByteLength == f.Bytes.Length && evidence.Sha256.Length == 64, "hash derived from fetched bytes");
        Reject(x => x.Request.StorageKey = "../escape.docx", "PROVIDER_REQUEST_STORAGE_KEY_INVALID");
        Reject(x => x.Request.StorageKey = x.Request.CaseId.ToString("D") + "/.docx", "PROVIDER_REQUEST_STORAGE_KEY_INVALID");
        Reject(x => x.Request.FileId = "https://example.com/file", "PROVIDER_REQUEST_FILE_ID_INVALID");
        Reject(x => x.Request.FileId = x.Request.FileId.ToUpperInvariant(), "PROVIDER_REQUEST_FILE_ID_INVALID");
        Reject(x => x.Request.Version = "historical", "PROVIDER_REQUEST_VERSION_INVALID");
        Reject(x => x.Request.ETag = "", "PROVIDER_REQUEST_ETAG_INVALID");
        Reject(x => x.Request.ETag = "private-value\r\n", "PROVIDER_REQUEST_ETAG_INVALID");
        Reject(x => x.Request.CaseOwnerId = Guid.NewGuid(), "PROVIDER_CASE_ACCESS_DENIED");
        Reject(x => x.Request.CallerEntraObjectId = Guid.NewGuid(), "PROVIDER_CASE_ACCESS_DENIED");
        Reject(x => x.Request.ExpectedControls["SH_CaseTitle"] = "different persisted proposal", "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Transport.MutateMetadataAfterRead = true, "PROVIDER_POSTREAD_VERSION_MISMATCH");
        Reject(x => x.Transport.WrongLibrary = true, "PROVIDER_METADATA_LIBRARY_MISMATCH");
        foreach (var stage in new[] { 1, 2 })
            foreach (var fault in new[] { "FILE_ID", "ETAG", "VERSION", "PATH", "LIBRARY", "LENGTH" })
            {
                var expectedCode = (stage == 1 ? "PROVIDER_METADATA_" : "PROVIDER_POSTREAD_") + fault + (fault == "LENGTH" ? "_INVALID" : "_MISMATCH");
                Reject(x => { x.Transport.MetadataFault = fault; x.Transport.MetadataFaultRead = stage; }, expectedCode);
            }
        Reject(x => { x.Transport.MetadataFault = "LENGTH_CHANGED"; x.Transport.MetadataFaultRead = 2; }, "PROVIDER_POSTREAD_LENGTH_CHANGED");
        Reject(x => x.Transport.MissingContentBytes = true, "PROVIDER_BYTES_REQUIRED");
        Reject(x => x.Transport.ShortContentBytes = true, "PROVIDER_BYTES_LENGTH_MISMATCH");
        Reject(x => x.Transport.Inherited = true, "PROVIDER_PRIVATE_ACL_REQUIRED");
        Reject(x => x.Transport.Group = true, "PROVIDER_PRIVATE_ACL_REQUIRED");
        Reject(x => x.Transport.ExtraPrincipal = true, "PROVIDER_PRIVATE_ACL_REQUIRED");
        Reject(x => x.Transport.NextPage = true, "PROVIDER_PRIVATE_ACL_REQUIRED");
        Reject(x => x.Transport.WrongEntra = true, "PROVIDER_PRIVATE_ACL_REQUIRED");
        Reject(x => x.Transport.MissingOwnerReadBeforeBytes = true, "PROVIDER_OWNER_FILE_READ_DENIED");
        Reject(x => x.Transport.MissingOwnerReadAfterBytes = true, "PROVIDER_OWNER_FILE_READ_DENIED");
        Reject(x => x.Transport.AppPermissionsInsteadOfOwner = true, "PROVIDER_OWNER_FILE_READ_DENIED");
        foreach (var bit in new uint[] { 0x1, 0x20, 0x40, 0x10000, 0x20000 })
            Reject(x => x.Transport.MissingPermissionBit = bit, "PROVIDER_OWNER_FILE_READ_DENIED");
        Reject(x => x.Transport.WrongContentETag = true, "PROVIDER_BYTES_ETAG_MISMATCH");
        Reject(x => x.Transport.ContentETagOverride = "W/" + x.Request.ETag, "PROVIDER_BYTES_ETAG_MISMATCH");
        Reject(x => x.Transport.ContentETagOverride = x.Request.ETag.ToUpperInvariant(), "PROVIDER_BYTES_ETAG_MISMATCH");
        Reject(x => x.Transport.ContentETagOverride = "DO_NOT_PRINT_PRIVATE_HEADER", "PROVIDER_BYTES_ETAG_MISMATCH");
        Reject(x => x.Request.RecheckSourceAccess = () => { throw new BoundaryException("SOURCE_REVOKED"); }, "SOURCE_REVOKED");
        Reject(x => x.Request.RecheckSourceAccess = () => { if (++x.Rechecks == 2) throw new BoundaryException("SOURCE_REVOKED"); }, "SOURCE_REVOKED");
        Reject(x => x.Bytes = new byte[] { 1, 2, 3 }, "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = Encoding.UTF8.GetBytes(Encoding.UTF8.GetString(x.Bytes)), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = SyntheticDocx.Create(new Dictionary<string, string>(x.Request.ExpectedControls) { ["SH_CaseTitle"] = "unbound sample" }), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditZip(x.Bytes, z => { using (var w = new StreamWriter(z.CreateEntry("word/evil.xml").Open())) w.Write("<!DOCTYPE x [<!ENTITY e SYSTEM 'file:///tmp/no'>]><x>&e;</x>"); }), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditZip(x.Bytes, z => { using (var w = new StreamWriter(z.CreateEntry("word/_rels/evil.xml.rels").Open())) w.Write("<Relationships><Relationship TargetMode='External' Target='https://example.com'/></Relationships>"); }), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditStory(x.Bytes, "word/document.xml", doc => doc.Descendants(W + "sdtPr").First().Add(new XElement(W + "dataBinding", new XAttribute(W + "xpath", "/attacker")))), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditStory(x.Bytes, "word/header1.xml", doc => doc.Root.Add(new XElement(W + "instrText", "INCLUDETEXT https://example.com"))), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditZip(x.Bytes, z => { using var w = new StreamWriter(z.CreateEntry("customXml/item1.xml").Open()); w.Write("<attacker/>"); }), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditStory(x.Bytes, "_rels/.rels", doc => doc.Descendants().Single(e => ((string)e.Attribute("Type") ?? "").EndsWith("/officeDocument", StringComparison.Ordinal)).SetAttributeValue("Target", "word/styles.xml")), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditStory(EditZip(x.Bytes, z => { using var writer = new StreamWriter(z.CreateEntry("evil/document.xml").Open()); writer.Write("<w:document xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'><w:body><w:p><w:r><w:t>Unverified visible proposal</w:t></w:r></w:p></w:body></w:document>"); }), "_rels/.rels", doc => doc.Descendants().Single(e => ((string)e.Attribute("Type") ?? "").EndsWith("/officeDocument", StringComparison.Ordinal)).SetAttributeValue("Target", "evil/document.xml")), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Reject(x => x.Bytes = EditStory(x.Bytes, "[Content_Types].xml", doc => doc.Descendants().Single(e => (string)e.Attribute("PartName") == "/word/document.xml").SetAttributeValue("ContentType", "application/vnd.ms-word.document.macroEnabled.main+xml")), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Check(SharePointExactFileProviderFactory.Create(null, null) == null, "unconfigured provider disabled");
        Expect(() => SharePointExactFileProviderFactory.Create(null, f.Configuration), "PROVIDER_MANAGED_IDENTITY_UNAVAILABLE");
        Expect(() => SharePointProviderConfiguration.Parse(f.Configuration.Replace("shuttle-example.sharepoint.com", "evil.example.com")), "PROVIDER_CONFIGURATION_INVALID");
        Expect(() => SharePointProviderConfiguration.Parse(f.Configuration.Replace("/sites/SyntheticLab/Private", "/sites/SyntheticLab/../Private")), "PROVIDER_CONFIGURATION_INVALID");
        var tokenCalls = 0;
        var http = new SharePointHttpTransport(new Uri("https://shuttle-example.sharepoint.com/sites/SyntheticLab"), () => { tokenCalls++; return "unused"; });
        Expect(() => http.Get(new Uri("https://evil.example.com/_api/file"), null, 100, TimeSpan.FromSeconds(1)), "PROVIDER_ADDRESS_DENIED");
        Expect(() => http.QueryPermissions(new Uri("https://shuttle-example.sharepoint.com/sites/SyntheticLab/_api/web/BreakRoleInheritance"), 100, TimeSpan.FromSeconds(1)), "PROVIDER_ADDRESS_DENIED");
        Expect(() => http.QueryPermissions(new Uri("https://shuttle-example.sharepoint.com/sites/SyntheticLab/_api/web/lists(guid'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')/items(1)/GetUserEffectivePermissions(@user)?@user='i%3A0%23.f%7Cmembership%7Csynthetic%40example.com'"), 100, TimeSpan.Zero), "PROVIDER_READ_TIMEOUT");
        Check(tokenCalls == 0, "deny address before acquiring token");
        TestSyntheticPackage();
        Console.WriteLine("Provider boundary: " + checks + " local checks passed; fake HTTP only, no tenant/managed-identity/SharePoint qualification.");
    }

    private static void TestSyntheticPackage()
    {
        var fields = SyntheticDocx.Controls();
        var actual = SyntheticDocx.Create(fields);
        DocxControlBinding.Verify(actual, fields); checks++;
        var wrong = new Dictionary<string, string>(fields) { ["SH_CaseTitle"] = "different proposal" };
        Expect(() => DocxControlBinding.Verify(actual, wrong), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => doc.Descendants(W + "sdtPr").First().Add(new XElement(W + "dataBinding", new XAttribute(W + "xpath", "/refresh")))), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "_rels/.rels", doc => doc.Root.Elements().First().SetAttributeValue("Target", "/customXml/item1.xml")), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/_rels/document.xml.rels", doc => doc.Root.Elements().First().SetAttributeValue("TargetMode", "External")), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "[Content_Types].xml", doc => doc.Root.Elements().Single(e => (string)e.Attribute("Extension") == "xml").SetAttributeValue("ContentType", "application/vnd.ms-word.document.macroEnabled.main+xml")), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        foreach (var part in new[] { "customXml/item1.xml", "customXml/itemProps1.xml", "customXml/_rels/item1.xml.rels" })
            Expect(() => DocxControlBinding.Verify(EditZip(actual, zip => { using var writer = new StreamWriter(zip.CreateEntry(part).Open()); writer.Write("<unreviewed/>"); }), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        // Visible Word text also comes from attributes and special run elements.
        // Keeping every w:t unchanged must not allow a different rendered meaning.
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/numbering.xml", doc => doc.Root.Add(new XElement(W + "lvlText", new XAttribute(W + "val", "APPROVED FOR BANK LAUNCH")))), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => doc.Root.Element(W + "body").AddFirst(new XElement(W + "p", new XElement(W + "pPr", new XElement(W + "numPr", new XElement(W + "ilvl", new XAttribute(W + "val", "0")), new XElement(W + "numId", new XAttribute(W + "val", "1"))))))), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        foreach (var element in new[] { "noBreakHyphen", "softHyphen", "delText", "delInstrText" })
            Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => doc.Descendants(W + "t").First(t => t.Value == fields["SH_CaseTitle"]).AddAfterSelf(new XElement(W + element, element.EndsWith("Text", StringComparison.Ordinal) ? "unverified" : null))), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => { var text = doc.Descendants(W + "t").First(t => t.Value == fields["SH_CaseTitle"]); var run = text.Parent; text.Remove(); run.AddBeforeSelf(new XElement(W + "pPr", text)); }), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => doc.Root.Name = W + "styles"), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => {
            var first = doc.Descendants(W + "sdt").Single(s => (string)s.Element(W + "sdtPr").Element(W + "alias").Attribute(W + "val") == "SH_DecisionBrief");
            var second = doc.Descendants(W + "sdt").Single(s => (string)s.Element(W + "sdtPr").Element(W + "alias").Attribute(W + "val") == "SH_ReadinessGaps");
            var saved = new XElement(first); first.ReplaceWith(new XElement(second)); second.ReplaceWith(saved);
        }), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditStory(actual, "word/document.xml", doc => {
            var first = doc.Descendants(W + "sdt").First(); var label = first.PreviousNode; first.Remove(); label.AddBeforeSelf(first);
        }), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        foreach (var name in new[] { "arbitrary-nonempty-entry/", "word/" })
            Expect(() => DocxControlBinding.Verify(EditZip(actual, zip => { using var writer = new StreamWriter(zip.CreateEntry(name).Open()); writer.Write("unreviewed payload"); }), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        Expect(() => DocxControlBinding.Verify(EditZip(actual, zip => zip.CreateEntry("arbitrary-empty-entry/")), fields), "PROVIDER_DOCUMENT_BINDING_MISMATCH");
        var unicodeFields = new Dictionary<string, string>(fields, StringComparer.Ordinal) {
            ["SH_CaseTitle"] = "Æø漢字 <tag> & text\nline\twith tab\nlast"
        };
        var unicode = EditStory(actual, "word/document.xml", doc => {
            var title = doc.Descendants(W + "sdt").Single(s => (string)s.Element(W + "sdtPr").Element(W + "alias").Attribute(W + "val") == "SH_CaseTitle");
            title.Element(W + "sdtContent").ReplaceNodes(new XElement(W + "p", new XElement(W + "r",
                new XElement(W + "t", "Æø漢字 <tag> & text"), new XElement(W + "br"), new XElement(W + "t", "line"),
                new XElement(W + "tab"), new XElement(W + "t", "with tab"), new XElement(W + "cr"), new XElement(W + "t", "last"))));
        });
        DocxControlBinding.Verify(unicode, unicodeFields); checks++;
        DocxControlBinding.Verify(EditZip(actual, zip => zip.CreateEntry("word/")), fields); checks++;
    }

    private static void Reject(Action<ProviderFixture> change, string code) { var f = new ProviderFixture(); change(f); Expect(() => f.Read(), code); }
    private static void Expect(Action action, string code)
    {
        try { action(); } catch (BoundaryException e) { if (e.Code == code) { checks++; return; } throw new Exception("Expected " + code + ", got " + e.Code); }
        throw new Exception("Expected " + code);
    }
    private static void Check(bool condition, string label) { if (!condition) throw new Exception(label); checks++; }
    private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    private static byte[] EditStory(byte[] bytes, string name, Action<XDocument> edit) => EditZip(bytes, zip => {
        var entry = zip.GetEntry(name);
        XDocument doc;
        using (var input = entry.Open()) doc = XDocument.Load(input);
        edit(doc); entry.Delete();
        using var output = zip.CreateEntry(name).Open(); doc.Save(output);
    });
    private static byte[] EditZip(byte[] bytes, Action<ZipArchive> edit)
    {
        using var memory = new MemoryStream(); memory.Write(bytes, 0, bytes.Length);
        using (var zip = new ZipArchive(memory, ZipArchiveMode.Update, true)) edit(zip);
        return memory.ToArray();
    }

    private sealed class ProviderFixture
    {
        internal readonly DateTime Now = new DateTime(2026, 10, 25, 0, 0, 0, DateTimeKind.Utc);
        internal readonly string Configuration;
        internal readonly ProviderRequest Request;
        internal readonly FakeTransport Transport;
        internal byte[] Bytes;
        internal int Rechecks;
        internal ProviderFixture()
        {
            var controls = SyntheticDocx.Controls(Now);
            Bytes = SyntheticDocx.Create(controls);
            var owner = Guid.Parse("99999999-9999-4999-8999-999999999999");
            var entra = Guid.Parse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
            Configuration = JsonSerializer.Serialize(new { policy = "LAB_SHAREPOINT_EXACT_FILE_V1", enabled = true,
                siteUrl = "https://shuttle-example.sharepoint.com/sites/SyntheticLab", libraryId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                libraryRoot = "/sites/SyntheticLab/Private", ownerDataverseId = owner.ToString("D"), ownerEntraObjectId = entra.ToString("D"),
                ownerPrincipalId = 7, ownerLoginName = "i:0#.f|membership|synthetic@example.com", ownerRoleDefinitionId = 1073741826,
                workerEntraObjectId = entra.ToString("D"), workerPrincipalId = 7,
                workerLoginName = "i:0#.f|membership|synthetic@example.com", workerRoleDefinitionId = 1073741826 });
            Request = new ProviderRequest { CaseId = Guid.Parse(controls["SH_CaseId"]), CaseOwnerId = owner, CallerEntraObjectId = entra,
                FileId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc", Version = "1.0", ETag = "\"synthetic,1\"",
                StorageKey = controls["SH_CaseId"] + "/dddddddd-dddd-4ddd-8ddd-dddddddddddd.docx", InputHash = controls["SH_ProposalHash"],
                ExpectedControls = controls, RecheckSourceAccess = () => Rechecks++ };
            Transport = new FakeTransport(this);
        }
        internal ProviderRead Read() => new SharePointExactFileProvider(SharePointProviderConfiguration.Parse(Configuration), Transport, () => Now).Read(Request);
    }

    private sealed class FakeTransport : ISharePointTransport
    {
        private readonly ProviderFixture f;
        internal int MetadataReads, AclReads, PermissionReads;
        internal bool MutateMetadataAfterRead, WrongLibrary, Inherited, Group, ExtraPrincipal, NextPage, WrongEntra, WrongContentETag;
        internal bool MissingContentBytes, ShortContentBytes;
        internal string MetadataFault, ContentETagOverride;
        internal int MetadataFaultRead = 1;
        internal bool MissingOwnerReadBeforeBytes, MissingOwnerReadAfterBytes, AppPermissionsInsteadOfOwner;
        internal uint MissingPermissionBit;
        internal FakeTransport(ProviderFixture f) { this.f = f; }
        public ProviderHttpResponse Get(Uri uri, string ifMatch, int maxBytes, TimeSpan remaining)
        {
            if (remaining <= TimeSpan.Zero) throw new Exception("missing total timeout");
            var address = Uri.UnescapeDataString(uri.AbsoluteUri);
            var library = WrongLibrary ? Guid.Empty.ToString("D") : "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
            object result;
            if (address.EndsWith("/$value", StringComparison.Ordinal))
            {
                if (ifMatch != f.Request.ETag || maxBytes != 10 * 1024 * 1024) throw new Exception("unbound bytes request");
                return new ProviderHttpResponse { Body = MissingContentBytes ? null : ShortContentBytes ? f.Bytes.Take(f.Bytes.Length - 1).ToArray() : f.Bytes,
                    ETag = ContentETagOverride ?? (WrongContentETag ? "changed" : f.Request.ETag) };
            }
            if (address.Contains("/RoleAssignments?"))
            {
                AclReads++;
                var row = new { PrincipalId = 7, Member = new { Id = 7, PrincipalType = Group ? 4 : 1 }, RoleDefinitionBindings = new[] { new { Id = 1073741826 } } };
                var dict = new Dictionary<string, object> { { "value", ExtraPrincipal ? new[] { row, row } : new[] { row } } };
                if (NextPage) dict["odata.nextLink"] = "https://evil.example.com/next";
                result = dict;
            }
            else if (address.Contains("/GetUserById(")) result = new { Id = 7, LoginName = "i:0#.f|membership|synthetic@example.com", IsSiteAdmin = false,
                AadObjectId = new { NameId = WrongEntra ? Guid.Empty.ToString("D") : f.Request.CallerEntraObjectId.ToString("D") } };
            else if (address.Contains("HasUniqueRoleAssignments")) result = new { HasUniqueRoleAssignments = !Inherited, ParentList = new { Id = library } };
            else
            {
                MetadataReads++;
                var metadata = new Dictionary<string, object> {
                    { "UniqueId", f.Request.FileId }, { "ETag", f.Request.ETag },
                    { "UIVersionLabel", MutateMetadataAfterRead && MetadataReads > 1 ? "2.0" : f.Request.Version },
                    { "Length", f.Bytes.LongLength.ToString() }, { "ServerRelativeUrl", "/sites/SyntheticLab/Private/" + f.Request.StorageKey },
                    { "ListItemAllFields", new { ParentList = new { Id = library } } }
                };
                if (MetadataReads == MetadataFaultRead)
                    switch (MetadataFault)
                    {
                        case "FILE_ID": metadata["UniqueId"] = Guid.Empty.ToString("D"); break;
                        case "ETAG": metadata["ETag"] = "DO_NOT_PRINT_PRIVATE_METADATA"; break;
                        case "VERSION": metadata["UIVersionLabel"] = "2.0"; break;
                        case "PATH": metadata["ServerRelativeUrl"] = "/another/file.docx"; break;
                        case "LIBRARY": metadata["ListItemAllFields"] = new { ParentList = new { Id = Guid.Empty.ToString("D") } }; break;
                        case "LENGTH": metadata["Length"] = "0"; break;
                        case "LENGTH_CHANGED": metadata["Length"] = (f.Bytes.LongLength + 1).ToString(); break;
                    }
                result = metadata;
            }
            return new ProviderHttpResponse { Body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(result)) };
        }
        public ProviderHttpResponse QueryPermissions(Uri uri, int maxBytes, TimeSpan remaining)
        {
            PermissionReads++;
            var address = Uri.UnescapeDataString(uri.AbsoluteUri);
            if (!address.Contains("/GetUserEffectivePermissions(@user)?@user='i:0#.f|membership|synthetic@example.com'") ||
                maxBytes != 16 * 1024 || remaining <= TimeSpan.Zero) throw new Exception("permission query must target exact configured owner");
            var mask = (0x00030061U & ~MissingPermissionBit);
            if (MissingOwnerReadBeforeBytes || (MissingOwnerReadAfterBytes && MetadataReads > 1)) mask = 0;
            object result = AppPermissionsInsteadOfOwner ? (object)new { EffectiveBasePermissions = new { Low = "196705", High = "0" } } :
                new { GetUserEffectivePermissions = new { Low = mask.ToString(), High = "0" } };
            return new ProviderHttpResponse { Body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(result)) };
        }
    }
}
