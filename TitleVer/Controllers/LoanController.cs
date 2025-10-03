using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TitleVer.Data;
using TitleVer.DTOs.Loan;
using TitleVer.Models;
using TitleVer.Services;

namespace TitleVer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoanSanctionService _loanService;

        public LoanController(ApplicationDbContext context, ILoanSanctionService loanService)
        {
            _context = context;
            _loanService = loanService;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyLoan([FromBody] LoanRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
            if (user == null) return BadRequest(new { message = "User not found" });

            var land = await _context.LandRecords.FirstOrDefaultAsync(l => l.LandId == request.LandId);
            if (land == null) return BadRequest(new { message = "Land record not found" });

            var result = _loanService.EvaluateLoan(request, land, user);

            var loanApp = new LoanApplication
            {
                UserId = user.Id,
                LandId = land.LandId,
                Status = result.Status,
                DecisionReason = result.Reason,
                AppliedAt = DateTime.UtcNow
            };

            _context.LoanApplications.Add(loanApp);
            await _context.SaveChangesAsync();

            return Ok(result);
        }
    }
}