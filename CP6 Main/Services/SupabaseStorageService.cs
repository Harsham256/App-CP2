


using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;

namespace TitleVerification.Api.Services
{
    public class SupabaseStorageService : IStorageService
    {
        private readonly HttpClient _http;
        private readonly string _url;
        private readonly string _serviceKey;
        private readonly string _bucket;

        public string Name => "Supabase";

        public SupabaseStorageService(IConfiguration config)
        {
            _url = config["Supabase:Url"] ?? throw new ArgumentNullException("Supabase Url missing");
            _serviceKey = config["Supabase:ServiceKey"] ?? throw new ArgumentNullException("Supabase ServiceKey missing");
            _bucket = config["Supabase:Bucket"] ?? "documents";

            _http = new HttpClient();
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);
        }

        public async Task<string> UploadAsync(IFormFile file)
        {
            var blobName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var endpoint = $"{_url}/storage/v1/object/{_bucket}/{blobName}";

            using var content = new StreamContent(file.OpenReadStream());
            content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

            var res = await _http.PutAsync(endpoint, content);

            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                throw new Exception($"Supabase upload failed: {(int)res.StatusCode} {res.ReasonPhrase} ({body})");
            }

            return blobName;
        }

        public async Task<(byte[] Content, string ContentType)> DownloadAsync(string blobName)
        {
            var endpoint = $"{_url}/storage/v1/object/{_bucket}/{blobName}";
            var res = await _http.GetAsync(endpoint);

            if (!res.IsSuccessStatusCode)
                throw new FileNotFoundException($"Supabase file not found: {blobName}");

            var bytes = await res.Content.ReadAsByteArrayAsync();
            var type = res.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            return (bytes, type);
        }
    }
}
