namespace TitleVerification.Api.Models
{
    public class LandRecord
    {
        public int Id { get; set; }
        public string LandId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string OwnershipType { get; set; } = string.Empty;
        public string LandType { get; set; } = string.Empty;
        public bool HasOngoingLoan { get; set; }
        public bool HasDispute { get; set; }
    }
}
