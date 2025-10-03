namespace TitleVer.Services
{
    public interface IAadhaarPanService
    {
        bool ValidateAadhaar(string aadhaar);
        bool ValidatePan(string pan);
    }

}