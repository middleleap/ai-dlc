using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Shuttle.Guards
{
    public static class CanonicalProposal
    {
        public const string EncodingVersion = "shuttle-canonical-v1";

        // Versioned, ordered, length-prefixed binary encoding. No JSON serialization,
        // culture-dependent formatting, Unicode normalization or delimiter concatenation.
        public static string Hash(Proposal proposal)
        {
            var error = ProposalGuard.ValidateShape(proposal);
            if (error != null) throw new ArgumentException(error, nameof(proposal));
            using (var stream = new MemoryStream())
            {
                WriteText(stream, EncodingVersion);
                WriteText(stream, proposal.SchemaVersion);
                WriteText(stream, proposal.Kind == ProposalKind.PackDraft ? "PackDraft" : "InspectionComment");
                WriteText(stream, proposal.CaseId.ToString("D"));
                WriteInt64(stream, proposal.ExpectedContentRevision);
                WriteText(stream, proposal.RequestKey.ToString("D"));
                if (proposal.Kind == ProposalKind.PackDraft)
                {
                    var payload = proposal.PackDraft;
                    WriteText(stream, payload.TemplateRelease); WriteText(stream, payload.SkillRelease);
                    WriteInt32(stream, payload.Sections.Count);
                    foreach (var section in payload.Sections)
                    {
                        WriteText(stream, section.Key); WriteText(stream, section.Title); WriteText(stream, section.Text);
                        WriteInt32(stream, section.SourceIds.Count);
                        foreach (var id in section.SourceIds) WriteText(stream, id);
                        WriteOptionalText(stream, section.OwedOwner);
                    }
                }
                else
                {
                    var payload = proposal.InspectionComment;
                    WriteText(stream, payload.ArtifactVersionId.ToString("D"));
                    WriteText(stream, payload.ArtifactHash); WriteText(stream, payload.Text);
                    WriteOptionalText(stream, payload.RelatedCommentId?.ToString("D"));
                }
                using (var sha = SHA256.Create())
                {
                    var digest = sha.ComputeHash(stream.ToArray());
                    var result = new StringBuilder(64);
                    foreach (var value in digest) result.Append(value.ToString("x2"));
                    return result.ToString();
                }
            }
        }
        private static void WriteOptionalText(Stream stream, string value)
        { stream.WriteByte(value == null ? (byte)0 : (byte)1); if (value != null) WriteText(stream, value); }
        private static void WriteText(Stream stream, string value)
        {
            var bytes = new UTF8Encoding(false, true).GetBytes(value);
            WriteInt32(stream, bytes.Length); stream.Write(bytes, 0, bytes.Length);
        }
        private static void WriteInt32(Stream stream, int value)
        { for (var shift = 24; shift >= 0; shift -= 8) stream.WriteByte((byte)(value >> shift)); }
        private static void WriteInt64(Stream stream, long value)
        { for (var shift = 56; shift >= 0; shift -= 8) stream.WriteByte((byte)(value >> shift)); }
    }
}
