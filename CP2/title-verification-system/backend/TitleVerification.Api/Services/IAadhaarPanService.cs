namespace TitleVerification.Api.Services
{
    public interface IAadhaarPanService
    {
        bool ValidateAadhaar(string aadhaar);
        bool ValidatePan(string pan);
    }

}