namespace TitleVer.Models
{
    public class LandRecord
    {
        public int Id { get; set; }

        // ✅ Required for linking with Document
        public ICollection<Document> Documents { get; set; } = new List<Document>();

        // ✅ Fields required for report generation
        public string LandId { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int YearOfExistence { get; set; }
        public string Ownership { get; set; } = string.Empty;
        public bool SiblingApproval { get; set; }
        public bool HasOngoingLoan { get; set; }
        public bool HasDispute { get; set; }
        public string RestrictedType { get; set; } = string.Empty;

        // Optional: Owner details
        public string OwnerName { get; set; } = string.Empty;
        public string OwnershipType { get; set; } = string.Empty;
        public string LandType { get; set; } = string.Empty;
    }
}