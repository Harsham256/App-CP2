using TitleVerification.Api.DTOs.Loan;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Services
{
    public class LoanSanctionService : ILoanSanctionService
    {
        public LoanResponse EvaluateLoan(LoanRequest request, LandRecord landRecord, User user)
        {
            var reasons = new List<string>();

            if (!string.Equals(request.OwnerName, landRecord.OwnerName, StringComparison.OrdinalIgnoreCase))
                reasons.Add("Owner name mismatch");

            if (landRecord.OwnershipType.Equals("Inherited", StringComparison.OrdinalIgnoreCase) &&
                !request.HasSiblingApproval)
                reasons.Add("Sibling approval required for inherited land");

            if (landRecord.HasOngoingLoan)
                reasons.Add("Land has ongoing loan");

            var unauthorizedTypes = new[] { "Forest", "Military", "Government" };
            if (unauthorizedTypes.Contains(landRecord.LandType))
                reasons.Add($"Land type '{landRecord.LandType}' is unauthorized");

            if (landRecord.HasDispute)
                reasons.Add("Land has legal disputes/encumbrances");

            string decision = reasons.Count == 0 ? "Approved" : "Rejected";

            return new LoanResponse
            {
                Status = decision,
                Reason = reasons.Count == 0 ? "All checks passed" : string.Join("; ", reasons)
            };
        }
    }
}
