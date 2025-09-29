using TitleVerification.Api.Services;

public class AadhaarPanService : IAadhaarPanService
{
    public bool ValidateAadhaar(string aadhaar)
    {
        return !string.IsNullOrEmpty(aadhaar) && aadhaar.Length == 12;
    }

    public bool ValidatePan(string pan)
    {
        return !string.IsNullOrEmpty(pan) && pan.Length == 10;
    }
}