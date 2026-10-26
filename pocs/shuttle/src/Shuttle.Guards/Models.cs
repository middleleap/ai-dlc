using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace Shuttle.Guards
{
    public enum ProposalKind { PackDraft = 1, InspectionComment = 2 }
    public enum DecisionKind { Reject = 0, AcceptPlan = 1, ReplayReceipt = 2 }

    // Closed wire decoding is a separate boundary. These typed values are not authentication.
    public sealed class Proposal
    {
        public string SchemaVersion { get; }
        public ProposalKind Kind { get; }
        public Guid CaseId { get; }
        public long ExpectedContentRevision { get; }
        public Guid RequestKey { get; }
        public PackDraftPayload PackDraft { get; }
        public InspectionCommentPayload InspectionComment { get; }
        public Proposal(string schemaVersion, ProposalKind kind, Guid caseId, long expectedContentRevision,
            Guid requestKey, PackDraftPayload packDraft = null, InspectionCommentPayload inspectionComment = null)
        {
            SchemaVersion = schemaVersion; Kind = kind; CaseId = caseId;
            ExpectedContentRevision = expectedContentRevision; RequestKey = requestKey;
            PackDraft = packDraft; InspectionComment = inspectionComment;
        }
    }

    public sealed class PackDraftPayload
    {
        public string TemplateRelease { get; }
        public string SkillRelease { get; }
        public IReadOnlyList<PackSection> Sections { get; }
        public PackDraftPayload(string templateRelease, string skillRelease, IEnumerable<PackSection> sections)
        {
            TemplateRelease = templateRelease; SkillRelease = skillRelease;
            Sections = sections == null ? null : new ReadOnlyCollection<PackSection>(new List<PackSection>(sections));
        }
    }
    public sealed class PackSection
    {
        public string Key { get; }
        public string Title { get; }
        public string Text { get; }
        public IReadOnlyList<string> SourceIds { get; }
        public string OwedOwner { get; }
        public PackSection(string key, string title, string text, IEnumerable<string> sourceIds, string owedOwner = null)
        {
            Key = key; Title = title; Text = text; OwedOwner = owedOwner;
            SourceIds = sourceIds == null ? null : new ReadOnlyCollection<string>(new List<string>(sourceIds));
        }
    }
    public sealed class InspectionCommentPayload
    {
        public Guid ArtifactVersionId { get; }
        public string ArtifactHash { get; }
        public string Text { get; }
        public Guid? RelatedCommentId { get; }
        public InspectionCommentPayload(Guid artifactVersionId, string artifactHash, string text, Guid? relatedCommentId = null)
        { ArtifactVersionId = artifactVersionId; ArtifactHash = artifactHash; Text = text; RelatedCommentId = relatedCommentId; }
    }
    public sealed class ArtifactSnapshot
    {
        public Guid Id { get; }
        public Guid CaseId { get; }
        public long ContentRevision { get; }
        public string Hash { get; }
        public bool IsRegisteredAndCurrent { get; }
        public ArtifactSnapshot(Guid id, Guid caseId, long contentRevision, string hash, bool isRegisteredAndCurrent)
        { Id = id; CaseId = caseId; ContentRevision = contentRevision; Hash = hash; IsRegisteredAndCurrent = isRegisteredAndCurrent; }
    }
    public sealed class RelatedCommentSnapshot
    {
        public Guid Id { get; }
        public Guid CaseId { get; }
        public Guid ArtifactVersionId { get; }
        public RelatedCommentSnapshot(Guid id, Guid caseId, Guid artifactVersionId)
        { Id = id; CaseId = caseId; ArtifactVersionId = artifactVersionId; }
    }

    // Only the future authenticated Dataverse adapter may assemble this snapshot in production.
    // Local fixtures prove no effective tenant permission.
    public sealed class TrustedContext
    {
        public Guid InitiatingUserId { get; }
        public Guid EffectiveUserId { get; }
        public Guid CaseId { get; }
        public long ContentRevision { get; }
        public string RowVersion { get; }
        public long GuardSequence { get; }
        public bool CanReadCase { get; }
        public bool CanReadProposals { get; }
        public bool CanCreatePackDraft { get; }
        public bool CanCreateInspectionComment { get; }
        public ArtifactSnapshot CurrentArtifact { get; }
        public RelatedCommentSnapshot RelatedComment { get; }
        private readonly HashSet<string> sourceIds;
        private readonly HashSet<Guid> artifactIds;
        private readonly HashSet<Guid> commentIds;
        public TrustedContext(Guid initiatingUserId, Guid effectiveUserId, Guid caseId, long contentRevision,
            string rowVersion, long guardSequence, bool canReadCase, bool canReadProposals,
            bool canCreatePackDraft, bool canCreateInspectionComment, IEnumerable<string> permittedSourceIds,
            IEnumerable<Guid> readableArtifactIds, IEnumerable<Guid> readableCommentIds,
            ArtifactSnapshot currentArtifact = null, RelatedCommentSnapshot relatedComment = null)
        {
            InitiatingUserId = initiatingUserId; EffectiveUserId = effectiveUserId; CaseId = caseId;
            ContentRevision = contentRevision; RowVersion = rowVersion; GuardSequence = guardSequence;
            CanReadCase = canReadCase; CanReadProposals = canReadProposals;
            CanCreatePackDraft = canCreatePackDraft; CanCreateInspectionComment = canCreateInspectionComment;
            CurrentArtifact = currentArtifact; RelatedComment = relatedComment;
            sourceIds = new HashSet<string>(permittedSourceIds ?? new string[0], StringComparer.Ordinal);
            artifactIds = new HashSet<Guid>(readableArtifactIds ?? new Guid[0]);
            commentIds = new HashSet<Guid>(readableCommentIds ?? new Guid[0]);
        }
        public bool CanReadSource(string id) => sourceIds.Contains(id);
        public bool CanReadArtifact(Guid id) => artifactIds.Contains(id);
        public bool CanReadComment(Guid id) => commentIds.Contains(id);
    }
    public sealed class CommittedReceipt
    {
        public Guid ProposalId { get; }
        public Guid CaseId { get; }
        public Guid RequestKey { get; }
        public string CanonicalHash { get; }
        public string HistoricalState { get; }
        public Guid? ArtifactVersionId { get; }
        public CommittedReceipt(Guid proposalId, Guid caseId, Guid requestKey, string canonicalHash,
            string historicalState, Guid? artifactVersionId = null)
        { ProposalId = proposalId; CaseId = caseId; RequestKey = requestKey; CanonicalHash = canonicalHash;
            HistoricalState = historicalState; ArtifactVersionId = artifactVersionId; }
    }
    public interface IReceiptLookup
    {
        // Called only after current access and shape checks. The future adapter scopes this read.
        CommittedReceipt Find(Guid caseId, Guid requestKey);
    }
    public sealed class MutationPlan
    {
        public Guid CaseId { get; }
        public Guid RequestKey { get; }
        public string CanonicalHash { get; }
        public Guid InitiatingUserId { get; }
        public Guid EffectiveUserId { get; }
        public int ProposalCreates => 1;
        public int BusinessEventCreates => 1;
        public int ExternalWorkCreates { get; }
        public bool RequiresCaseCompareAndSwap { get; }
        public string ExpectedRowVersion { get; }
        public long? NextGuardSequence { get; }
        public bool ChangesContentRevision => false;
        public bool GrantsApproval => false;
        public bool ClaimsArtifactSaved => false;
        internal MutationPlan(Proposal proposal, TrustedContext context, string hash)
        {
            CaseId = proposal.CaseId; RequestKey = proposal.RequestKey; CanonicalHash = hash;
            InitiatingUserId = context.InitiatingUserId; EffectiveUserId = context.EffectiveUserId;
            ExternalWorkCreates = proposal.Kind == ProposalKind.PackDraft ? 1 : 0;
            RequiresCaseCompareAndSwap = proposal.Kind == ProposalKind.InspectionComment;
            ExpectedRowVersion = RequiresCaseCompareAndSwap ? context.RowVersion : null;
            NextGuardSequence = RequiresCaseCompareAndSwap ? (long?)checked(context.GuardSequence + 1) : null;
        }
    }
    public sealed class GuardDecision
    {
        public DecisionKind Kind { get; }
        public string Code { get; }
        public MutationPlan Plan { get; }
        public CommittedReceipt Receipt { get; }
        public bool ClaimsCurrentAcceptance => false;
        private GuardDecision(DecisionKind kind, string code, MutationPlan plan, CommittedReceipt receipt)
        { Kind = kind; Code = code; Plan = plan; Receipt = receipt; }
        internal static GuardDecision Reject(string code) => new GuardDecision(DecisionKind.Reject, code, null, null);
        internal static GuardDecision Accept(MutationPlan plan) => new GuardDecision(DecisionKind.AcceptPlan, "ACCEPT_PLAN", plan, null);
        internal static GuardDecision Replay(CommittedReceipt receipt) => new GuardDecision(DecisionKind.ReplayReceipt, "HISTORICAL_RECEIPT", null, receipt);
    }
}
