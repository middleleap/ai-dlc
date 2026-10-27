using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Xrm.Sdk;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    // No member of this request is exposed as a Custom API parameter. The worker builds it
    // from persisted, authorized rows and the protected target-local configuration.
    internal interface IExactFileProvider { ProviderRead Read(ProviderRequest request); }

    internal sealed class ProviderRequest
    {
        internal string FileId, Version, ETag, StorageKey, InputHash;
        internal Guid CaseId, CaseOwnerId, CallerEntraObjectId;
        internal IDictionary<string, string> ExpectedControls;
        internal Action RecheckSourceAccess;
    }

    internal sealed class SharePointProviderConfiguration
    {
        internal Uri Site;
        internal string LibraryRoot;
        internal Guid LibraryId, OwnerDataverseId, OwnerEntraObjectId, WorkerEntraObjectId;
        internal int OwnerPrincipalId, OwnerRoleDefinitionId, WorkerPrincipalId, WorkerRoleDefinitionId;
        internal string OwnerLoginName, WorkerLoginName;

        internal static SharePointProviderConfiguration Parse(string json)
        {
            using (var d = StrictJson.Parse(json, 4096))
            {
                var r = d.RootElement;
                StrictJson.Shape(r, new[] { "policy", "enabled", "siteUrl", "libraryId", "libraryRoot", "ownerDataverseId",
                    "ownerEntraObjectId", "ownerPrincipalId", "ownerLoginName", "ownerRoleDefinitionId", "workerEntraObjectId",
                    "workerPrincipalId", "workerLoginName", "workerRoleDefinitionId" });
                if (StrictJson.Text(r, "policy") != "LAB_SHAREPOINT_EXACT_FILE_V1" || r.GetProperty("enabled").ValueKind != JsonValueKind.True)
                    throw new BoundaryException("PROVIDER_POLICY_DISABLED");
                var p = new SharePointProviderConfiguration {
                    LibraryId = StrictJson.Id(r, "libraryId"), OwnerDataverseId = StrictJson.Id(r, "ownerDataverseId"),
                    OwnerEntraObjectId = StrictJson.Id(r, "ownerEntraObjectId"), WorkerEntraObjectId = StrictJson.Id(r, "workerEntraObjectId"),
                    LibraryRoot = StrictJson.Text(r, "libraryRoot"), OwnerPrincipalId = StrictJson.Int(r, "ownerPrincipalId"),
                    WorkerPrincipalId = StrictJson.Int(r, "workerPrincipalId"), OwnerRoleDefinitionId = StrictJson.Int(r, "ownerRoleDefinitionId"),
                    WorkerRoleDefinitionId = StrictJson.Int(r, "workerRoleDefinitionId"), OwnerLoginName = StrictJson.Text(r, "ownerLoginName"),
                    WorkerLoginName = StrictJson.Text(r, "workerLoginName") };
                var siteText = StrictJson.Text(r, "siteUrl");
                if (!Uri.TryCreate(siteText, UriKind.Absolute, out p.Site) || p.Site.Scheme != "https" || p.Site.Port != 443 ||
                    !Regex.IsMatch(p.Site.Host, @"^[a-z0-9][a-z0-9-]{0,61}\.sharepoint\.com$") ||
                    !Regex.IsMatch(p.Site.AbsolutePath, @"^/(sites|teams)/[A-Za-z0-9_-]+$") ||
                    p.Site.UserInfo != "" || p.Site.Query != "" || p.Site.Fragment != "" || siteText != p.Site.AbsoluteUri ||
                    !p.LibraryRoot.StartsWith(p.Site.AbsolutePath + "/", StringComparison.Ordinal) ||
                    !Regex.IsMatch(p.LibraryRoot, @"^/[A-Za-z0-9_ /-]{1,240}$") || p.LibraryRoot.EndsWith("/", StringComparison.Ordinal) ||
                    p.LibraryRoot.Contains("//")) throw new BoundaryException("PROVIDER_CONFIGURATION_INVALID");
                foreach (var login in new[] { p.OwnerLoginName, p.WorkerLoginName })
                    if (login.Length > 250 || !Regex.IsMatch(login, @"^i:0#\.f\|membership\|[^\s|@]+@[^\s|@]+$"))
                        throw new BoundaryException("PROVIDER_CONFIGURATION_INVALID");
                // Only direct named users; group expansion, guest/sharing links and broad inherited ACLs are unsupported.
                var same = p.OwnerPrincipalId == p.WorkerPrincipalId;
                if ((p.OwnerEntraObjectId == p.WorkerEntraObjectId) != same || (p.OwnerLoginName == p.WorkerLoginName) != same ||
                    (same && p.OwnerRoleDefinitionId != p.WorkerRoleDefinitionId)) throw new BoundaryException("PROVIDER_CONFIGURATION_INVALID");
                return p;
            }
        }
    }

    internal static class SharePointExactFileProviderFactory
    {
        internal static IExactFileProvider Create(IServiceProvider services, string secureConfiguration)
        {
            if (string.IsNullOrEmpty(secureConfiguration)) return null;
            var configuration = SharePointProviderConfiguration.Parse(secureConfiguration);
            var identity = services?.GetService(typeof(IManagedIdentityService)) as IManagedIdentityService;
            if (identity == null) throw new BoundaryException("PROVIDER_MANAGED_IDENTITY_UNAVAILABLE");
            return new SharePointExactFileProvider(configuration, new SharePointHttpTransport(configuration.Site,
                () => identity.AcquireToken(new[] { configuration.Site.GetLeftPart(UriPartial.Authority) + "/.default" })), () => DateTime.UtcNow);
        }
    }
}
