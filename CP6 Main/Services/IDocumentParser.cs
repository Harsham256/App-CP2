// TitleVerification.Api/Services/IDocumentService.cs
namespace TitleVerification.Api.Services
{
    public record ExtractedFields(string? Name, string? LandId, string RawText);
    public record ExtractedFieldsExtended(string? Name, string? LandId, string? FatherName, string? Mobile, string? Aadhaar, string RawText);

    public interface IDocumentService
    {
        // Existing signatures (kept for compatibility)
        string ExtractLandId(byte[] fileBytes, string contentType);
        ExtractedFields ExtractFields(byte[] fileBytes, string contentType);

        // NEW: extended extraction for displaying Fathername/Mobile/Aadhaar (not used for checks)
        ExtractedFieldsExtended ExtractFieldsExtended(byte[] fileBytes, string contentType);
    }
}