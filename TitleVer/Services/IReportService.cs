using TitleVer.DTOs.Loan;
using TitleVer.Models;

namespace TitleVer.Services
{
    public interface ILoanSanctionService
    {
        LoanResponse EvaluateLoan(LoanRequest request, LandRecord landRecord, User user);
    }
}
