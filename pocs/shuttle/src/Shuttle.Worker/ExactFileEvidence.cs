using System;
using System.Security.Cryptography;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    // Produced only by the internal provider after authenticated exact-version reads.
    // These types are not parameters of any Custom API.
    internal sealed class ProviderRead
    {
        internal string FileId { get; set; }
        internal string Version { get; set; }
        internal string ETag { get; set; }
        internal string StorageKey { get; set; }
        internal string InputHash { get; set; }
        internal bool ConfiguredLibraryVerified { get; set; }
        internal bool CaseFileAccessRechecked { get; set; }
        internal bool SourceAccessRechecked { get; set; }
        internal DateTime ReadAtUtc { get; set; }
        internal byte[] ExactVersionBytes { get; set; }
    }

    internal sealed class ExactFileEvidence
    {
        internal string FileId { get; private set; }
        internal string Version { get; private set; }
        internal string ETag { get; private set; }
        internal string StorageKey { get; private set; }
        internal string InputHash { get; private set; }
        internal string Sha256 { get; private set; }
        internal long ByteLength { get; private set; }
        private ExactFileEvidence() { }

        // The provider must return the bytes of this precise version with
        // read-time storage/ACL checks. No caller-supplied digest is accepted here.
        internal static ExactFileEvidence FromProviderRead(ProviderRead read, string expectedFileId, string expectedVersion,
            string expectedETag, string expectedStorageKey, DateTime serverNowUtc, string expectedInputHash = null)
        {
            if (read == null) throw new BoundaryException("PROVIDER_VERIFIER_NOT_INSTALLED");
            WorkerExecution.Bounded(expectedFileId, 500); WorkerExecution.Bounded(expectedVersion, 200);
            WorkerExecution.Bounded(expectedETag, 500); WorkerExecution.Bounded(expectedStorageKey, 450);
            if (read.FileId != expectedFileId || read.Version != expectedVersion || read.ETag != expectedETag || read.StorageKey != expectedStorageKey)
                throw new BoundaryException("PROVIDER_FILE_BINDING_MISMATCH");
            if (expectedInputHash != null && read.InputHash != expectedInputHash) throw new BoundaryException("PROVIDER_INPUT_BINDING_MISMATCH");
            if (!read.ConfiguredLibraryVerified || !read.CaseFileAccessRechecked || !read.SourceAccessRechecked)
                throw new BoundaryException("PROVIDER_ACCESS_PROOF_REQUIRED");
            if (serverNowUtc.Kind != DateTimeKind.Utc || read.ReadAtUtc.Kind != DateTimeKind.Utc || read.ReadAtUtc > serverNowUtc ||
                serverNowUtc - read.ReadAtUtc > TimeSpan.FromSeconds(30)) throw new BoundaryException("PROVIDER_EVIDENCE_EXPIRED");
            if (read.ExactVersionBytes == null || read.ExactVersionBytes.Length == 0 || read.ExactVersionBytes.Length > 10 * 1024 * 1024)
                throw new BoundaryException("PROVIDER_BYTES_REQUIRED");
            var bytes = (byte[])read.ExactVersionBytes.Clone();
            using (var sha = SHA256.Create())
            {
                return new ExactFileEvidence { FileId = read.FileId, Version = read.Version, ETag = read.ETag, StorageKey = read.StorageKey,
                    InputHash = read.InputHash, ByteLength = bytes.LongLength, Sha256 = BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant() };
            }
        }
    }
}
