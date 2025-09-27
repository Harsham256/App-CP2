namespace TitleVerification.Api.Models
{
    public class LoanApplication
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string LandId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string DecisionReason { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
    }
}
