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

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
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
            var docs = await _context.Documents
                .Select(d => new
                {
                    documentID = d.DocumentID,
                    userID = d.UserId,
                    filePath = d.FilePath,
                    status = d.Status,
                    uploadedAt = d.UploadedAt
                })
                .ToListAsync();

            return Ok(docs);
        }

        [HttpPost("documents/{id}/approve")]
        public async Task<IActionResult> ApproveDocument(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound();

            doc.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Approved" });
        }

        [HttpPost("documents/{id}/reject")]
        public async Task<IActionResult> RejectDocument(int id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return NotFound();

            doc.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rejected" });
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
