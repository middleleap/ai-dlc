using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using Shuttle.Dataverse;

namespace Shuttle.Worker
{
    internal sealed class ProviderHttpResponse
    {
        internal byte[] Body;
        internal string ETag;
    }

    internal interface ISharePointTransport
    {
        ProviderHttpResponse Get(Uri address, string ifMatch, int maxBytes, TimeSpan remaining);
        ProviderHttpResponse QueryPermissions(Uri address, int maxBytes, TimeSpan remaining);
    }

    internal sealed class SharePointHttpTransport : ISharePointTransport
    {
        private readonly Uri site;
        private readonly Func<string> acquireToken;
        internal SharePointHttpTransport(Uri site, Func<string> acquireToken) { this.site = site; this.acquireToken = acquireToken; }

        public ProviderHttpResponse Get(Uri address, string ifMatch, int maxBytes, TimeSpan remaining) => Send(address, HttpMethod.Get, ifMatch, maxBytes, remaining);
        public ProviderHttpResponse QueryPermissions(Uri address, int maxBytes, TimeSpan remaining)
        {
            // This documented POST is a read-only permission query, never an arbitrary
            // SharePoint mutation, grant, sharing operation or caller-selected endpoint.
            if (!address.AbsolutePath.EndsWith("/GetUserEffectivePermissions(@user)", StringComparison.Ordinal))
                throw new BoundaryException("PROVIDER_ADDRESS_DENIED");
            return Send(address, HttpMethod.Post, null, maxBytes, remaining);
        }

        private ProviderHttpResponse Send(Uri address, HttpMethod method, string ifMatch, int maxBytes, TimeSpan remaining)
        {
            if (address.Scheme != "https" || address.Host != site.Host || address.Port != 443 || address.UserInfo != "" ||
                !address.AbsolutePath.StartsWith(site.AbsolutePath + "/_api/", StringComparison.Ordinal) || address.Fragment != "")
                throw new BoundaryException("PROVIDER_ADDRESS_DENIED");
            if (remaining <= TimeSpan.Zero) throw new BoundaryException("PROVIDER_READ_TIMEOUT");
            var token = acquireToken();
            if (string.IsNullOrEmpty(token) || token.Length > 16384 || token.IndexOfAny(new[] { '\r', '\n', ' ' }) >= 0)
                throw new BoundaryException("PROVIDER_MANAGED_IDENTITY_UNAVAILABLE");
            try
            {
                using (var handler = new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false,
                    AutomaticDecompression = DecompressionMethods.None, UseDefaultCredentials = false, Credentials = null })
                using (var client = new HttpClient(handler))
                using (var cancellation = new CancellationTokenSource(remaining < TimeSpan.FromSeconds(8) ? remaining : TimeSpan.FromSeconds(8)))
                using (var request = new HttpRequestMessage(method, address))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    request.Headers.TryAddWithoutValidation("Accept", "application/json;odata=nometadata");
                    request.Headers.ConnectionClose = true;
                    if (method == HttpMethod.Post)
                    {
                        request.Content = new ByteArrayContent(new byte[0]);
                        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    }
                    if (ifMatch != null) request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
                    using (var response = client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellation.Token).GetAwaiter().GetResult())
                    {
                        // Includes every redirect: no token or credential can reach another host.
                        if (response.StatusCode != HttpStatusCode.OK) throw new BoundaryException("PROVIDER_HTTP_READ_FAILED");
                        if (response.Content == null || response.Content.Headers.ContentEncoding.Count != 0 ||
                            response.Content.Headers.ContentLength > maxBytes) throw new BoundaryException("PROVIDER_SIZE_LIMIT");
                        using (var stream = response.Content.ReadAsStreamAsync().GetAwaiter().GetResult())
                        using (var bytes = new MemoryStream())
                        {
                            var buffer = new byte[8192];
                            int read;
                            while ((read = stream.ReadAsync(buffer, 0, buffer.Length, cancellation.Token).GetAwaiter().GetResult()) > 0)
                            {
                                if (bytes.Length + read > maxBytes) throw new BoundaryException("PROVIDER_SIZE_LIMIT");
                                bytes.Write(buffer, 0, read);
                            }
                            return new ProviderHttpResponse { Body = bytes.ToArray(), ETag = response.Headers.ETag?.ToString() };
                        }
                    }
                }
            }
            catch (OperationCanceledException) { throw new BoundaryException("PROVIDER_READ_TIMEOUT"); }
            catch (HttpRequestException) { throw new BoundaryException("PROVIDER_HTTP_READ_FAILED"); }
            catch (IOException) { throw new BoundaryException("PROVIDER_HTTP_READ_FAILED"); }
        }
    }
}
