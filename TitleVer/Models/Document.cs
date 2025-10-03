// File: TitleVerification.Api/Models/Document.cs
using TitleVer.Models;

public class Document
{
    public int DocumentID { get; set; }
    public int UserId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Extracted values from the uploaded file
    public string? ExtractedLandId { get; set; }
    public string? ExtractedName { get; set; }   // ✅ NEW

    // Navigation properties
    public User User { get; set; } = null!;
    public int? LandRecordId { get; set; }       // Foreign key
    public LandRecord? LandRecord { get; set; }
}
