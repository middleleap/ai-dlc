using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Shuttle.Guards
{
    public static class ProposalGuard
    {
        public const string SchemaVersion = "shuttle.proposal.v0.1";
        private static readonly Regex SectionKey = new Regex(@"\A[a-z][a-z0-9-]{0,63}\z", RegexOptions.CultureInvariant);
        private static readonly Regex SourceId = new Regex(@"\AS[0-9]{2}\z", RegexOptions.CultureInvariant);
        private static readonly Regex Sha256 = new Regex(@"\A[a-f0-9]{64}\z", RegexOptions.CultureInvariant);

        public static GuardDecision Evaluate(Proposal proposal, TrustedContext context, IReceiptLookup receiptLookup)
        {
            // Do not even invoke the receipt reader before checking the current caller/case/operation.
            if (proposal == null || context == null || context.InitiatingUserId == Guid.Empty ||
                context.EffectiveUserId == Guid.Empty || proposal.CaseId != context.CaseId ||
                !context.CanReadCase || !context.CanReadProposals)
                return GuardDecision.Reject("ACCESS_DENIED");
            if (proposal.Kind == ProposalKind.PackDraft ? !context.CanCreatePackDraft :
                proposal.Kind == ProposalKind.InspectionComment ? !context.CanCreateInspectionComment : true)
                return GuardDecision.Reject("OPERATION_DENIED");

            var error = ValidateShape(proposal);
            if (error != null) return GuardDecision.Reject(error);
            if (proposal.Kind == ProposalKind.PackDraft)
            {
                foreach (var section in proposal.PackDraft.Sections)
                    foreach (var id in section.SourceIds)
                        if (!context.CanReadSource(id)) return GuardDecision.Reject("SOURCE_ACCESS_DENIED");
            }
            else
            {
                var comment = proposal.InspectionComment;
                if (!context.CanReadArtifact(comment.ArtifactVersionId)) return GuardDecision.Reject("ARTIFACT_ACCESS_DENIED");
                if (comment.RelatedCommentId.HasValue && !context.CanReadComment(comment.RelatedCommentId.Value))
                    return GuardDecision.Reject("COMMENT_ACCESS_DENIED");
            }

            if (receiptLookup == null) return GuardDecision.Reject("RECEIPT_LOOKUP_REQUIRED");
            var hash = CanonicalProposal.Hash(proposal);
            var prior = receiptLookup.Find(proposal.CaseId, proposal.RequestKey);
            if (prior != null)
            {
                if (prior.ProposalId == Guid.Empty || prior.CaseId != proposal.CaseId || prior.RequestKey != proposal.RequestKey ||
                    prior.CanonicalHash == null || !Sha256.IsMatch(prior.CanonicalHash))
                    return GuardDecision.Reject("RECEIPT_INTEGRITY");
                if (!string.Equals(prior.CanonicalHash, hash, StringComparison.Ordinal))
                    return GuardDecision.Reject("REQUEST_KEY_CONFLICT");
                if (prior.ArtifactVersionId.HasValue && !context.CanReadArtifact(prior.ArtifactVersionId.Value))
                    return GuardDecision.Reject("ARTIFACT_ACCESS_DENIED");
                // Intentionally before current revision/current-artifact checks: this returns old history,
                // not a new mutation, a render retry, a current artifact or an approval.
                return GuardDecision.Replay(prior);
            }

            if (context.ContentRevision < 1 || context.ContentRevision > int.MaxValue || proposal.ExpectedContentRevision != context.ContentRevision)
                return GuardDecision.Reject("STALE_CONTENT_REVISION");
            if (proposal.Kind == ProposalKind.InspectionComment)
            {
                var comment = proposal.InspectionComment;
                var artifact = context.CurrentArtifact;
                if (artifact == null || !artifact.IsRegisteredAndCurrent || artifact.CaseId != proposal.CaseId ||
                    artifact.Id != comment.ArtifactVersionId || artifact.ContentRevision != context.ContentRevision ||
                    !string.Equals(artifact.Hash, comment.ArtifactHash, StringComparison.Ordinal))
                    return GuardDecision.Reject("STALE_ARTIFACT_BINDING");
                if (comment.RelatedCommentId.HasValue)
                {
                    var related = context.RelatedComment;
                    if (related == null || related.Id != comment.RelatedCommentId.Value ||
                        related.CaseId != proposal.CaseId || related.ArtifactVersionId != comment.ArtifactVersionId)
                        return GuardDecision.Reject("INVALID_RELATED_COMMENT");
                }
                if (string.IsNullOrWhiteSpace(context.RowVersion) || context.GuardSequence < 0 || context.GuardSequence == long.MaxValue)
                    return GuardDecision.Reject("CONCURRENCY_CONTEXT_REQUIRED");
            }
            return GuardDecision.Accept(new MutationPlan(proposal, context, hash));
        }

        // A null result means typed payload shape is valid. Unknown JSON properties must be rejected
        // by the wire decoder before constructing these objects; deserializers must not silently drop them.
        public static string ValidateShape(Proposal proposal)
        {
            if (proposal == null || proposal.SchemaVersion != SchemaVersion || proposal.CaseId == Guid.Empty ||
                proposal.RequestKey == Guid.Empty || proposal.ExpectedContentRevision < 1 || proposal.ExpectedContentRevision > int.MaxValue)
                return "INVALID_ENVELOPE";
            if (proposal.Kind == ProposalKind.PackDraft)
            {
                var pack = proposal.PackDraft;
                if (pack == null || proposal.InspectionComment != null || !Text(pack.TemplateRelease, 100) ||
                    !Text(pack.SkillRelease, 100) || pack.Sections == null || pack.Sections.Count < 1 || pack.Sections.Count > 12)
                    return "INVALID_PACK_PAYLOAD";
                var keys = new HashSet<string>(StringComparer.Ordinal);
                foreach (var section in pack.Sections)
                {
                    if (section == null || section.Key == null || !SectionKey.IsMatch(section.Key) || !keys.Add(section.Key) ||
                        !Text(section.Title, 200) || !Text(section.Text, 8000) || section.SourceIds == null || section.SourceIds.Count > 32 ||
                        (section.OwedOwner != null && !Text(section.OwedOwner, 200)) ||
                        (section.SourceIds.Count == 0 && section.OwedOwner == null))
                        return "INVALID_PACK_SECTION";
                    var sources = new HashSet<string>(StringComparer.Ordinal);
                    foreach (var id in section.SourceIds)
                        if (id == null || !SourceId.IsMatch(id) || !sources.Add(id)) return "INVALID_SOURCE_REFERENCE";
                }
            }
            else if (proposal.Kind == ProposalKind.InspectionComment)
            {
                var comment = proposal.InspectionComment;
                if (comment == null || proposal.PackDraft != null || comment.ArtifactVersionId == Guid.Empty ||
                    comment.ArtifactHash == null || !Sha256.IsMatch(comment.ArtifactHash) || !Text(comment.Text, 2000) ||
                    comment.RelatedCommentId == Guid.Empty)
                    return "INVALID_COMMENT_PAYLOAD";
            }
            else return "INVALID_KIND";
            return null;
        }

        private static bool Text(string value, int maximumScalars)
        {
            if (string.IsNullOrWhiteSpace(value)) return false;
            var scalars = 0;
            for (var i = 0; i < value.Length; i++)
            {
                var c = value[i];
                if (char.IsControl(c) && c != '\t' && c != '\r' && c != '\n') return false;
                if (char.IsHighSurrogate(c))
                { if (i + 1 >= value.Length || !char.IsLowSurrogate(value[++i])) return false; }
                else if (char.IsLowSurrogate(c)) return false;
                if (++scalars > maximumScalars) return false;
            }
            return scalars > 0;
        }
    }
}
