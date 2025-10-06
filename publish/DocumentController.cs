// File: TITLE/Controllers/DocumentController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using TITLE.Data;
using TITLE.Models;

namespace TITLE.Controllers
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

        // GET /api/document/my?userId={userId}
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

        // POST /api/document/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] int userId)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "Uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // 🔁 Changed "_" to "-" as you requested
            var originalName = Path.GetFileName(file.FileName);
            var safeFileName = $"{Guid.NewGuid()}-{originalName}";
            var filePath = Path.Combine(uploadsFolder, safeFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                UserId = userId,
                FilePath = safeFileName,
                UploadedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Document uploaded successfully", documentId = document.DocumentID });
        }

        // GET /api/document/inline/{id}
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

        // GET /api/document/view/{id} -> simple HTML viewer
        [HttpGet("view/{id}")]
        public async Task<IActionResult> ViewDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound("Document not found");

            var fileUrl = $"/api/document/inline/{id}";
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8' />
  <title>Document Viewer</title>
  <meta name='viewport' content='width=device-width, initial-scale=1' />
  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 16px; }}
    .wrap {{ max-width: 1100px; margin: 0 auto; }}
    iframe {{ width: 100%; height: 80vh; border: 1px solid #e5e7eb; border-radius: 8px; }}
    a.btn {{ display: inline-block; margin-top: 12px; padding: 8px 12px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }}
  </style>
</head>
<body>
  <div class='wrap'>
    <h3>Document Viewer</h3>
    {fileUrl}</iframe>
    <br />
    {fileUrl}Download</a>
  </div>
</body>
</html>";

            return Content(html, "text/html");
        }
    }
}