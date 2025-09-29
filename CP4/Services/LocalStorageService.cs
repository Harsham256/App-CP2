namespace TitleVerification.Api.Services
{
    public class LocalStorageService : IStorageService
    {
        private readonly string _uploadsRoot;

        public string Name => "Local";

        public LocalStorageService(IWebHostEnvironment env)
        {
            _uploadsRoot = Path.Combine(env.ContentRootPath, "wwwroot", "Uploads");
            if (!Directory.Exists(_uploadsRoot)) Directory.CreateDirectory(_uploadsRoot);
        }

        public async Task<string> UploadAsync(IFormFile file)
        {
            var safeName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var path = Path.Combine(_uploadsRoot, safeName);

            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            return safeName;
        }

        public async Task<(byte[] Content, string ContentType)> DownloadAsync(string blobName)
        {
            var localPath = Path.Combine(_uploadsRoot, blobName);
            if (!File.Exists(localPath))
                throw new FileNotFoundException($"Local file not found: {blobName}");

            var bytes = await File.ReadAllBytesAsync(localPath);
            var ext = Path.GetExtension(localPath).ToLowerInvariant();
            var type = ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };

            return (bytes, type);
        }
    }
}