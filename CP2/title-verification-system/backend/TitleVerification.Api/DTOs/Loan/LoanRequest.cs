namespace TitleVerification.Api.DTOs.Loan
{
    public class LoanRequest
    {
        public string LandId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public bool HasSiblingApproval { get; set; }
        public int UserId { get; set; }
    }
}
