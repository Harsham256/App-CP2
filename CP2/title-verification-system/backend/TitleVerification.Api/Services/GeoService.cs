using TitleVerification.Api.Helpers;

namespace TitleVerification.Api.Services
{
    public class GeoLocationService : IGeoLocationService
    {
        private readonly GeoApiClient _client;

        public GeoLocationService(GeoApiClient client)
        {
            _client = client;
        }

        public bool ValidateLandCoordinates(double latitude, double longitude)
        {
            return _client.ValidateLocation(latitude, longitude);
        }
    }
}
