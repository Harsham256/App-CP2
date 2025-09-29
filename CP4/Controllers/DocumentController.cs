using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/document")]
    public class DocumentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<DocumentController> _logger;

        public DocumentController(ApplicationDbContext context, IWebHostEnvironment env, ILogger<DocumentController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        // ✅ GET /api/document/my?userId={userId}
        [HttpGet("my")]
        public async Task<IActionResult> GetUserDocuments([FromQuery] int userId)
        {
            var documents = await _context.Documents
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            if (documents == null || documents.Count == 0)
                return NotFound("No documents found for this user.");

            return Ok(documents);
        }

        // ✅ GET /api/document/report/{id}
        [HttpGet("report/{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var document = await _context.Documents
                .Include(d => d.User)
                .Include(d => d.LandRecord)
                .FirstOrDefaultAsync(d => d.DocumentID == id);

            if (document == null)
                return NotFound("Document not found.");

            var report = new
            {
                DocumentID = document.DocumentID,
                UserName = document.User?.Name,
                UploadedAt = document.UploadedAt,
                Status = document.Status,
                LandID = document.LandRecord?.LandId,
                Address = document.LandRecord?.Address,
                Coordinates = new
                {
                    Latitude = document.LandRecord?.Latitude,
                    Longitude = document.LandRecord?.Longitude
                },
                YearOfExistence = document.LandRecord?.YearOfExistence,
                Ownership = document.LandRecord?.Ownership,
                SiblingApproval = document.LandRecord?.SiblingApproval,
                LoanOrDispute = document.LandRecord?.HasDispute,
                RestrictedType = document.LandRecord?.RestrictedType
            };

            return Ok(report);
        }

        // ✅ POST /api/document/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] int userId)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "Uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                UserId = userId,
                FilePath = fileName,
                UploadedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Document uploaded successfully", documentId = document.DocumentID });
        }
        [HttpGet("inline/{id}")]
        public async Task<IActionResult> InlineDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound("Document not found");

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(rootPath, "Uploads", document.FilePath);

            if (!System.IO.File.Exists(filePath))
                return NotFound("File not found on server.");

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
                contentType = "application/octet-stream";

            return PhysicalFile(filePath, contentType);
        }

        [HttpGet("view/{id}")]
        public async Task<IActionResult> ViewDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound("Document not found");

            var fileUrl = $"/api/document/inline/{id}";
            var html = $@"
        <h3>Document Viewer</h3>
        {fileUrl}</iframe>
        <br/>
        {fileUrl}Download</a>
    ";

            return Content(html, "text/html");
        }
    }
}