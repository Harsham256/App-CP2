using TitleVer.Helpers;

namespace TitleVer.Services
{
    public class GeoService : IGeoService
    {
        private readonly GeoApiClient _client;

        public GeoService(GeoApiClient client)
        {
            _client = client;
        }

        public bool ValidateLandCoordinates(double latitude, double longitude)
        {
            return _client.ValidateLocation(latitude, longitude);
        }
    }
}
