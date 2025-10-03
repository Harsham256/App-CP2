namespace TitleVer.Services
{
    public interface IGeoService
    {
        bool ValidateLandCoordinates(double latitude, double longitude);
    }
}
