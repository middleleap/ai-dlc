using System;
using System.Text.Json;
using Microsoft.Xrm.Sdk;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    internal enum WorkState { Pending = 1, Leased = 2, FileSaved = 3, Registered = 4, Complete = 5, RetryDue = 6, Failed = 7, Superseded = 8 }

    internal static class Fields
    {
        internal const string State = "shuttle_workstate", Attempts = "shuttle_attempts", InputHash = "shuttle_inputhash";
        internal const string Proposal = "shuttle_proposal", Template = "shuttle_templaterelease", Skill = "shuttle_skillrelease";
        internal const string StorageKey = "shuttle_outputstoragekey", Token = "shuttle_leasetoken", Expires = "shuttle_leaseexpiresat";
        // Required metadata field; no deployed schema is implied by this public scaffold.
        internal const string Worker = "shuttle_leaseworker";
        internal const string FileId = "shuttle_fileid", Version = "shuttle_fileversion", ETag = "shuttle_fileetag", Error = "shuttle_lasterror";
        internal const string FileHash = "shuttle_filesha256", FileBytes = "shuttle_filebytes", FileInputHash = "shuttle_fileinputhash";
    }

    internal sealed class WorkerPolicy
    {
        internal Guid WorkerId, WriterId, OrganisationId;
        internal int LeaseSeconds, MaxAttempts;
        internal EmbeddedSourcePolicy Sources;
        internal string ProviderConfiguration;
        internal static WorkerPolicy Parse(string secure)
        {
            using (var doc = StrictJson.Parse(secure, 4096))
            {
                var r = doc.RootElement;
                var names = new[] { "policy", "enabled", "workerId", "writerId", "organisationId", "leaseSeconds", "maxAttempts" };
                // Existing claim/failure-only configurations remain disabled for provider actions.
                StrictJson.Shape(r, r.TryGetProperty("provider", out var provider) ? new[] { "policy", "enabled", "workerId", "writerId", "organisationId", "leaseSeconds", "maxAttempts", "provider" } : names);
                if (StrictJson.Text(r, "policy") != "LAB_EMBEDDED_WORKER_V1" || r.GetProperty("enabled").ValueKind != JsonValueKind.True)
                    throw new BoundaryException("WORKER_POLICY_DISABLED");
                var p = new WorkerPolicy { WorkerId = StrictJson.Id(r, "workerId"), WriterId = StrictJson.Id(r, "writerId"),
                    OrganisationId = StrictJson.Id(r, "organisationId"), LeaseSeconds = StrictJson.Int(r, "leaseSeconds"), MaxAttempts = StrictJson.Int(r, "maxAttempts") };
                if (p.LeaseSeconds < 120 || p.LeaseSeconds > 1800 || p.MaxAttempts > 5)
                    throw new BoundaryException("WORKER_POLICY_BOUNDS");
                if (provider.ValueKind != JsonValueKind.Undefined)
                {
                    if (provider.ValueKind != JsonValueKind.Object) throw new BoundaryException("WORKER_PROVIDER_CONFIGURATION");
                    p.ProviderConfiguration = provider.GetRawText();
                }
                p.Sources = EmbeddedSourcePolicy.FromSecureConfiguration("{\"policy\":\"LAB_EMBEDDED_SOURCES\",\"enabled\":true}");
                return p;
            }
        }
        internal void Authorize(IPluginExecutionContext c)
        {
            if (c.InitiatingUserId != WorkerId || c.UserId != WriterId || c.OrganizationId != OrganisationId)
                throw new BoundaryException("WORKER_IDENTITY_DENIED");
        }
    }
}
