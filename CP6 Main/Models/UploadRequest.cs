namespace TitleVerification.Api.Models
{
    public class UploadRequest
    {
        public IFormFile File { get; set; }
        public int? UserId { get; set; }
    }
}