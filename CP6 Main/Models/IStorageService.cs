
namespace TitleVerification.Api.Services
{
    public interface IStorageService
    {
        string Name { get; } // e.g., "Supabase" or "Local"
        Task<string> UploadAsync(IFormFile file);
        Task<(byte[] Content, string ContentType)> DownloadAsync(string path);
    }
}