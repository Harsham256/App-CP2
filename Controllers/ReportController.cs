using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound();

            var user = await _context.Users.FindAsync(doc.UserId);
            var land = await _context.LandRecords.FirstOrDefaultAsync(l => l.LandId == doc.ExtractedLandId);

            var report = new
            {
                name = user?.Name ?? "Unknown",
                landId = doc.ExtractedLandId ?? "Unknown",
                address = user?.Address ?? "Unknown",
                trafficLightStatus = doc.Status,
                conditionResults = new
                {
                    ownerMatch = (land != null && string.Equals(land.OwnerName, user?.Name, StringComparison.OrdinalIgnoreCase)) ? "Green" : "Red",
                    ongoingLoan = land != null && land.HasOngoingLoan ? "Red" : "Green",
                    dispute = land != null && land.HasDispute ? "Red" : "Green"
                },
                latitude = land != null ? 0.0 : 0.0,
                longitude = land != null ? 0.0 : 0.0
            };

            return Ok(report);
        }
    }
}
