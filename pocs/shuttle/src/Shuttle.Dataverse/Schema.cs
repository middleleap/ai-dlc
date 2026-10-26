namespace Shuttle.Dataverse
{
    public static class Schema
    {
        public const string Case = "shuttle_case", Proposal = "shuttle_draftproposal", Event = "shuttle_businessevent", Work = "shuttle_externalwork";
        public const string CaseLookup = "shuttle_case", Kind = "shuttle_kind", SchemaVersion = "shuttle_schemaversion", Revision = "shuttle_expectedcontentrevision", RequestKey = "shuttle_requestkey", Payload = "shuttle_payloadjson";
        public const string ContentRevision = "shuttle_contentrevision", GuardSequence = "shuttle_guardsequence", SourceBindings = "shuttle_sourcebindingsjson";
        public const string Hash = "shuttle_canonicalhash", Actor = "shuttle_initiatingactor", Writer = "shuttle_effectivewriter", CommittedAt = "shuttle_committedat";
        public const string TemplateRelease = "readiness-gaps-public-v0.1", SkillRelease = "shuttle-public-v0.1";
        public const string SharedValidated = "Shuttle.Validated.v1", SharedActor = "Shuttle.Actor.v1", SharedWriter = "Shuttle.Writer.v1", SharedHash = "Shuttle.Hash.v1", SharedOwner = "Shuttle.Owner.v1", SharedTime = "Shuttle.Time.v1";
    }
}
