


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    userID = u.Id,
                    name = u.Name,
                    username = u.Username,
                    aadhaarNumber = u.AadhaarNumber,
                    address = u.Address
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("documents")]
        public async Task<IActionResult> GetDocuments()
        {
            try
            {
                var docs = await _context.Documents
                    .Include(d => d.User)
                    .Select(d => new
                    {
                        documentID = d.DocumentID,
                        userID = d.UserId,
                        userName = d.User != null ? d.User.Name : "Unknown",
                        status = d.Status,
                        uploadedAt = d.UploadedAt,
                        viewUrl = $"/api/document/view/{d.DocumentID}"
                    })
                    .OrderByDescending(d => d.uploadedAt)
                    .ToListAsync();

                return Ok(docs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching documents for admin");
                return StatusCode(500, "Internal Server Error");
            }
        }

        [HttpPost("documents/{id}/approve")]
        public async Task<IActionResult> ApproveDocument(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound();

            doc.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok("✅ Document approved");
        }

        [HttpPost("documents/{id}/reject")]
        public async Task<IActionResult> RejectDocument(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound();

            doc.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok("❌ Document rejected");
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User removed" });
        }
    }
}


