
using TitleVerification.Api.Models;

public class Document
{
    public int DocumentID { get; set; }
    public int UserId { get; set; }

    public string FilePath { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? ExtractedLandId { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}
