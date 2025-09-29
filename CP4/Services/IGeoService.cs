namespace TitleVerification.Api.Services
{
    public interface IGeoLocationService
    {
        bool ValidateLandCoordinates(double latitude, double longitude);
    }
}
