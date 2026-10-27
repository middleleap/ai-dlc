using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Shuttle.Dataverse
{
    // These names were observed in this DEV's stage-20 Create Target before Shuttle
    // executed. This is compatibility validation, never a source of business authority.
    internal static class PlatformCreateFields
    {
        internal static readonly ISet<string> ObservedNames = new HashSet<string>(new[] {
            "createdby", "createdon", "modifiedby", "modifiedon", "modifiedonbehalfby",
            "ownerid", "owningbusinessunit", "owninguser", "statecode", "statuscode"
        }, StringComparer.Ordinal);

        internal static void Validate(Entity target, IPluginExecutionContext context, IOrganizationService writer)
        {
            foreach (var name in new[] { "createdby", "modifiedby" })
                if (target.Contains(name)) ContextPrincipal(target[name], context, false);
            if (target.Contains("modifiedonbehalfby")) ContextPrincipal(target["modifiedonbehalfby"], context, true);
            foreach (var name in new[] { "createdon", "modifiedon" })
                if (target.Contains(name) && (!(target[name] is DateTime time) || time.Year < 1753)) Invalid();
            // A stage-20 Target cannot prove whether a matching default owner was supplied
            // explicitly or injected by Dataverse. Only the initiating principal is accepted;
            // the actual business owner is subsequently stamped from the authorized Case.
            foreach (var name in new[] { "ownerid", "owninguser" })
                if (target.Contains(name) && Reference(target[name], "systemuser").Id != context.InitiatingUserId) Invalid();
            if (target.Contains("owningbusinessunit"))
            {
                var supplied = Reference(target["owningbusinessunit"], "businessunit");
                var actor = writer.Retrieve("systemuser", context.InitiatingUserId, new ColumnSet("businessunitid"));
                if (actor == null || actor.Id != context.InitiatingUserId || actor.LogicalName != "systemuser" ||
                    !actor.Contains("businessunitid") || Reference(actor["businessunitid"], "businessunit").Id != supplied.Id) Invalid();
            }
            if (target.Contains("statecode") && (!(target["statecode"] is OptionSetValue state) || state.Value != 0)) Invalid();
            if (target.Contains("statuscode") && (!(target["statuscode"] is OptionSetValue status) || status.Value != 1)) Invalid();
        }

        private static void ContextPrincipal(object value, IPluginExecutionContext context, bool nullable)
        {
            if (nullable && value == null) return;
            var principal = Reference(value, "systemuser");
            // The two context IDs are authoritative. Arbitrary delegate identities are
            // unsupported; a new impersonation shape must be reviewed rather than guessed.
            if (principal.Id != context.InitiatingUserId && principal.Id != context.UserId) Invalid();
        }

        private static EntityReference Reference(object value, string logicalName)
        {
            var reference = value as EntityReference;
            if (reference == null || reference.LogicalName != logicalName || reference.Id == Guid.Empty || reference.KeyAttributes.Count != 0) Invalid();
            return reference;
        }
        private static void Invalid() { throw new BoundaryException("PLATFORM_ATTRIBUTE_INVALID"); }
    }
}
