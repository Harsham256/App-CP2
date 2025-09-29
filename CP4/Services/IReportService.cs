using TitleVerification.Api.DTOs.Loan;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Services
{
    public interface ILoanSanctionService
    {
        LoanResponse EvaluateLoan(LoanRequest request, LandRecord landRecord, User user);
    }
}
