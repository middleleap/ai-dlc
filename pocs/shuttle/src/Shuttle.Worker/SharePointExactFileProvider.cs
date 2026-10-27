using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    internal sealed class SharePointExactFileProvider : IExactFileProvider
    {
        private const int MaxBytes = 10 * 1024 * 1024;
        private readonly SharePointProviderConfiguration config;
        private readonly ISharePointTransport transport;
        private readonly Func<DateTime> utcNow;
        internal SharePointExactFileProvider(SharePointProviderConfiguration config, ISharePointTransport transport, Func<DateTime> utcNow)
        { this.config = config; this.transport = transport; this.utcNow = utcNow; }

        public ProviderRead Read(ProviderRequest request)
        {
            if (request == null || request.CaseId == Guid.Empty || request.CaseOwnerId != config.OwnerDataverseId ||
                request.CallerEntraObjectId != config.OwnerEntraObjectId || request.RecheckSourceAccess == null ||
                request.ExpectedControls == null || request.ExpectedControls.Count != 17 ||
                !Regex.IsMatch(request.InputHash ?? "", "^[a-f0-9]{64}$")) throw new BoundaryException("PROVIDER_CASE_ACCESS_DENIED");
            Guid fileId, requestId;
            var prefix = request.CaseId.ToString("D") + "/";
            // Fixed stage/field codes diagnose a rejected comparison without
            // logging caller values, response headers, tokens or document data.
            // All identity and ETag comparisons remain exact and ordinal.
            if (!Guid.TryParseExact(request.FileId, "D", out fileId) || fileId == Guid.Empty || request.FileId != fileId.ToString("D"))
                throw new BoundaryException("PROVIDER_REQUEST_FILE_ID_INVALID");
            if (request.StorageKey == null || !request.StorageKey.StartsWith(prefix, StringComparison.Ordinal) ||
                request.StorageKey.Length != prefix.Length + 36 + 5 ||
                !request.StorageKey.EndsWith(".docx", StringComparison.Ordinal) ||
                !Guid.TryParseExact(request.StorageKey.Substring(prefix.Length, request.StorageKey.Length - prefix.Length - 5), "D", out requestId) ||
                requestId == Guid.Empty || request.StorageKey != prefix + requestId.ToString("D") + ".docx")
                throw new BoundaryException("PROVIDER_REQUEST_STORAGE_KEY_INVALID");
            if (!Regex.IsMatch(request.Version ?? "", @"^[0-9]{1,6}\.[0-9]{1,6}$"))
                throw new BoundaryException("PROVIDER_REQUEST_VERSION_INVALID");
            if (string.IsNullOrEmpty(request.ETag) || request.ETag.Length > 500 || request.ETag.IndexOfAny(new[] { '\r', '\n' }) >= 0)
                throw new BoundaryException("PROVIDER_REQUEST_ETAG_INVALID");
            var watch = Stopwatch.StartNew();
            var path = config.LibraryRoot + "/" + request.StorageKey;
            var file = Resource("GetFileByServerRelativeUrl", path);
            var folder = Resource("GetFolderByServerRelativeUrl", config.LibraryRoot + "/" + request.CaseId.ToString("D"));
            request.RecheckSourceAccess();
            var length = Metadata(file, request, path, watch, false);
            PrivateAcl(file + "/ListItemAllFields", watch);
            PrivateAcl(folder + "/ListItemAllFields", watch);
            var bytes = Get(file + "/$value", request.ETag, MaxBytes, watch);
            if (bytes.Body == null) throw new BoundaryException("PROVIDER_BYTES_REQUIRED");
            if (bytes.Body.Length != length) throw new BoundaryException("PROVIDER_BYTES_LENGTH_MISMATCH");
            if (bytes.ETag != request.ETag) throw new BoundaryException("PROVIDER_BYTES_ETAG_MISMATCH");
            DocxControlBinding.Verify(bytes.Body, request.ExpectedControls);
            // The current exact version is deliberately required. We never substitute another
            // version, download URI, caller bytes, digest, or a path-selected external host.
            if (Metadata(file, request, path, watch, true) != length) throw new BoundaryException("PROVIDER_POSTREAD_LENGTH_CHANGED");
            PrivateAcl(file + "/ListItemAllFields", watch);
            PrivateAcl(folder + "/ListItemAllFields", watch);
            request.RecheckSourceAccess();
            if (watch.Elapsed > TimeSpan.FromSeconds(45)) throw new BoundaryException("PROVIDER_READ_TIMEOUT");
            return new ProviderRead { FileId = request.FileId, Version = request.Version, ETag = request.ETag, StorageKey = request.StorageKey,
                InputHash = request.InputHash, ConfiguredLibraryVerified = true, CaseFileAccessRechecked = true, SourceAccessRechecked = true,
                ExactVersionBytes = bytes.Body, ReadAtUtc = utcNow() };
        }

        private long Metadata(string file, ProviderRequest request, string path, Stopwatch watch, bool afterBytes)
        {
            using (var d = Json(file + "?$select=UniqueId,ETag,UIVersionLabel,Length,ServerRelativeUrl,ListItemAllFields/ParentList/Id&$expand=ListItemAllFields/ParentList", watch))
            {
                var r = d.RootElement;
                long length;
                var l = r.GetProperty("Length");
                if (l.ValueKind == JsonValueKind.String) { if (!long.TryParse(l.GetString(), NumberStyles.None, CultureInfo.InvariantCulture, out length)) length = -1; }
                else if (!l.TryGetInt64(out length)) length = -1;
                var stage = afterBytes ? "PROVIDER_POSTREAD" : "PROVIDER_METADATA";
                if (Text(r, "UniqueId") != request.FileId) throw new BoundaryException(stage + "_FILE_ID_MISMATCH");
                if (Text(r, "ETag") != request.ETag) throw new BoundaryException(stage + "_ETAG_MISMATCH");
                if (Text(r, "UIVersionLabel") != request.Version) throw new BoundaryException(stage + "_VERSION_MISMATCH");
                if (Text(r, "ServerRelativeUrl") != path) throw new BoundaryException(stage + "_PATH_MISMATCH");
                if (Text(r.GetProperty("ListItemAllFields").GetProperty("ParentList"), "Id") != config.LibraryId.ToString("D"))
                    throw new BoundaryException(stage + "_LIBRARY_MISMATCH");
                if (length < 1 || length > MaxBytes) throw new BoundaryException(stage + "_LENGTH_INVALID");
                return length;
            }
        }

        private void PrivateAcl(string item, Stopwatch watch)
        {
            using (var d = Json(item + "?$select=HasUniqueRoleAssignments,ParentList/Id&$expand=ParentList", watch))
                if (d.RootElement.GetProperty("HasUniqueRoleAssignments").ValueKind != JsonValueKind.True ||
                    Text(d.RootElement.GetProperty("ParentList"), "Id") != config.LibraryId.ToString("D"))
                    throw new BoundaryException("PROVIDER_PRIVATE_ACL_REQUIRED");
            using (var d = Json(item + "/RoleAssignments?$select=PrincipalId,Member/Id,Member/PrincipalType,RoleDefinitionBindings/Id&$expand=Member,RoleDefinitionBindings", watch))
            {
                var r = d.RootElement;
                JsonElement ignored;
                if (r.TryGetProperty("odata.nextLink", out ignored) || r.TryGetProperty("@odata.nextLink", out ignored) ||
                    r.TryGetProperty("__next", out ignored)) throw new BoundaryException("PROVIDER_PRIVATE_ACL_REQUIRED");
                var expected = config.OwnerPrincipalId == config.WorkerPrincipalId ? 1 : 2;
                var rows = r.GetProperty("value");
                if (rows.ValueKind != JsonValueKind.Array || rows.GetArrayLength() != expected) throw new BoundaryException("PROVIDER_PRIVATE_ACL_REQUIRED");
                var seen = new HashSet<int>();
                foreach (var row in rows.EnumerateArray())
                {
                    var id = row.GetProperty("PrincipalId").GetInt32();
                    var member = row.GetProperty("Member");
                    var roles = row.GetProperty("RoleDefinitionBindings");
                    if (!seen.Add(id) || (id != config.OwnerPrincipalId && id != config.WorkerPrincipalId) ||
                        member.GetProperty("Id").GetInt32() != id || member.GetProperty("PrincipalType").GetInt32() != 1 ||
                        roles.ValueKind != JsonValueKind.Array || roles.GetArrayLength() != 1 ||
                        roles[0].GetProperty("Id").GetInt32() != (id == config.OwnerPrincipalId ? config.OwnerRoleDefinitionId : config.WorkerRoleDefinitionId))
                        throw new BoundaryException("PROVIDER_PRIVATE_ACL_REQUIRED");
                    UserIdentity(id, watch);
                }
            }
            EffectiveOwnerRead(item, watch);
        }

        private void EffectiveOwnerRead(string item, Stopwatch watch)
        {
            var uri = new Uri(item + "/GetUserEffectivePermissions(@user)?@user='" + Uri.EscapeDataString(config.OwnerLoginName.Replace("'", "''")) + "'");
            var response = transport.QueryPermissions(uri, 16 * 1024, TimeSpan.FromSeconds(45) - watch.Elapsed);
            using (var d = ResponseJson(response, 16 * 1024))
            {
                var r = d.RootElement;
                JsonElement wrapped;
                // SharePoint's no-metadata function responses may retain the function name.
                if (r.TryGetProperty("GetUserEffectivePermissions", out wrapped)) r = wrapped;
                uint low, high;
                if (!PermissionWord(r, "Low", out low) || !PermissionWord(r, "High", out high) ||
                    (low & 0x00030061U) != 0x00030061U) throw new BoundaryException("PROVIDER_OWNER_FILE_READ_DENIED");
                // Low mask: ViewListItems 0x1, OpenItems 0x20, ViewVersions 0x40,
                // Open 0x10000 and ViewPages 0x20000 (MS-WSSFO3 rights mask).
                // This is the named owner query, not the app's EffectiveBasePermissions.
            }
        }

        private static bool PermissionWord(JsonElement r, string name, out uint word)
        {
            word = 0;
            JsonElement value;
            if (!r.TryGetProperty(name, out value)) return false;
            if (value.ValueKind == JsonValueKind.Number) return value.TryGetUInt32(out word);
            return value.ValueKind == JsonValueKind.String && uint.TryParse(value.GetString(), NumberStyles.None, CultureInfo.InvariantCulture, out word);
        }

        private void UserIdentity(int id, Stopwatch watch)
        {
            using (var d = Json(config.Site.AbsoluteUri + "/_api/web/GetUserById(" + id.ToString(CultureInfo.InvariantCulture) + ")?$select=Id,LoginName,AadObjectId,IsSiteAdmin", watch))
            {
                var r = d.RootElement;
                var owner = id == config.OwnerPrincipalId;
                var expectedId = owner ? config.OwnerEntraObjectId : config.WorkerEntraObjectId;
                if (r.GetProperty("Id").GetInt32() != id || Text(r, "LoginName") != (owner ? config.OwnerLoginName : config.WorkerLoginName) ||
                    Text(r.GetProperty("AadObjectId"), "NameId") != expectedId.ToString("D"))
                    throw new BoundaryException("PROVIDER_PRIVATE_ACL_REQUIRED");
                // Site-admin bypass is not inferred from the item ACL. The approved owner may
                // be an admin in DEV, but this reader never promotes anyone or expands groups.
            }
        }

        private string Resource(string method, string path) => config.Site.AbsoluteUri + "/_api/web/" + method + "('" + Uri.EscapeDataString(path) + "')";
        private ProviderHttpResponse Get(string uri, string etag, int limit, Stopwatch watch) =>
            transport.Get(new Uri(uri), etag, limit, TimeSpan.FromSeconds(45) - watch.Elapsed);
        private JsonDocument Json(string uri, Stopwatch watch)
        {
            var response = Get(uri, null, 256 * 1024, watch);
            return ResponseJson(response, 256 * 1024);
        }
        private static JsonDocument ResponseJson(ProviderHttpResponse response, int limit)
        {
            if (response?.Body == null || response.Body.Length > limit) throw new BoundaryException("PROVIDER_SIZE_LIMIT");
            return StrictJson.Parse(new UTF8Encoding(false, true).GetString(response.Body), limit);
        }
        private static string Text(JsonElement value, string name) => StrictJson.Text(value, name);
    }
}
