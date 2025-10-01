namespace TitleVerification.Api.Models
{
    public class Report
    {
        public int ReportID { get; set; }
        public int? LandRecordId { get; set; } // references LandRecord if matched
        public string ConditionResults { get; set; } = "{}"; // JSON describing each condition and result
        public string TrafficLightStatus { get; set; } = "Yellow"; // Green / Yellow / Red
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
