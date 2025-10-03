using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles;
using TitleVer.Data;
using TitleVer.Models;
using TitleVer.Services;

namespace TitleVer.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDocumentService _docService;
        private readonly IWebHostEnvironment _env;

        public AdminController(ApplicationDbContext context, IDocumentService docService, IWebHostEnvironment env)
        {
            _context = context;
            _docService = docService;
            _env = env;
        }

        // --- Users ---

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

        // Matches your AddUser.jsx: POST /api/admin/users
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid user payload" });

            var exists = await _context.Users.AnyAsync(x => x.Username == dto.Username);
            if (exists) return BadRequest(new { message = "Username already taken." });

            // NOTE: hash password for production
            var user = new User
            {
                Name = dto.Name,
                Username = dto.Username,
                Email = dto.Email ?? string.Empty,
                PasswordHash = dto.Password,
                AadhaarNumber = dto.AadhaarNumber,
                Address = dto.Address ?? string.Empty,
                Role = dto.Role?.Equals("admin", StringComparison.OrdinalIgnoreCase) == true ? UserRole.Admin : UserRole.User,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created", userID = user.Id, name = user.Name, username = user.Username });
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

        // --- Documents ---

        [HttpGet("documents")]
        public async Task<IActionResult> GetDocuments()
        {
            var docs = await _context.Documents
                .Include(d => d.User)
                .Select(d => new
                {
                    documentID = d.DocumentID,
                    userID = d.UserId,
                    userName = d.User.Name,
                    filePath = d.FilePath,
                    fileUrl = $"/api/document/inline/{d.DocumentID}",
                    status = d.Status,
                    uploadedAt = d.UploadedAt
                })
                .ToListAsync();

            return Ok(docs);
        }

        [HttpPost("documents/{id}/approve")]
        public async Task<IActionResult> ApproveDocument(int id)
        {
            var doc = await _context.Documents.Include(d => d.User).FirstOrDefaultAsync(d => d.DocumentID == id);
            if (doc == null) return NotFound();

            await ExtractAndLinkAsync(doc);

            doc.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Approved" });
        }

        [HttpPost("documents/{id}/reject")]
        public async Task<IActionResult> RejectDocument(int id)
        {
            var doc = await _context.Documents.Include(d => d.User).FirstOrDefaultAsync(d => d.DocumentID == id);
            if (doc == null) return NotFound();

            await ExtractAndLinkAsync(doc);

            doc.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rejected" });
        }

        /// <summary>
        /// Reads the uploaded file, extracts Name(#) + LandId(-), stores them on Document,
        /// and links the matching LandRecord if found.
        /// </summary>
        private async Task ExtractAndLinkAsync(Document doc)
        {
            var root = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var path = Path.Combine(root, "Uploads", doc.FilePath);
            if (!System.IO.File.Exists(path)) return;

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(path, out var contentType))
                contentType = "application/octet-stream";

            var bytes = await System.IO.File.ReadAllBytesAsync(path);
            var extracted = _docService.ExtractFields(bytes, contentType);

            if (!string.IsNullOrWhiteSpace(extracted.Name))
                doc.ExtractedName = extracted.Name;

            if (!string.IsNullOrWhiteSpace(extracted.LandId))
                doc.ExtractedLandId = extracted.LandId;

            if (!string.IsNullOrWhiteSpace(doc.ExtractedLandId))
            {
                var land = await _context.LandRecords.FirstOrDefaultAsync(l => l.LandId == doc.ExtractedLandId);
                if (land != null)
                    doc.LandRecordId = land.Id;
            }
        }
    }

    // DTOs
    public class CreateUserDto
    {
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Password { get; set; } = string.Empty;
        public string AadhaarNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Role { get; set; } // "Admin" or "User"
    }
}