namespace TitleVerification.Api.Services
{
    public interface IDocumentService
    {
        string ExtractLandId(byte[] fileBytes, string contentType);
    }
}