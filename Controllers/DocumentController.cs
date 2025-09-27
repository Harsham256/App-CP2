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

        // GET /api/document/view/{id}
        [HttpGet("view/{id}")]
        public async Task<IActionResult> ViewDocument(int id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentID == id);
            if (document == null) return NotFound("Document not found");

            var downloadUrl = $"/api/document/download/{id}";
            var fileUrl = $"/api/document/inline/{id}";
            var approveUrl = $"/api/admin/documents/{id}/approve";
            var rejectUrl = $"/api/admin/documents/{id}/reject";

            var html = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Document Viewer</title>
    <style>
        body, html {{
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            font-family: Arial, sans-serif;
        }}
        iframe {{
            width: 100%;
            height: calc(100% - 50px);
            border: none;
        }}
        .toolbar {{
            height: 50px;
            background-color: #222;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 15px;
        }}
        .toolbar button {{
            margin-right: 10px;
            padding: 8px 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }}
        .toolbar button.download {{ background-color: #007bff; color: white; }}
        .toolbar button.download:hover {{ background-color: #0056b3; }}
        .toolbar button.approve {{ background-color: #28a745; color: white; }}
        .toolbar button.approve:hover {{ background-color: #1e7e34; }}
        .toolbar button.reject {{ background-color: #dc3545; color: white; }}
        .toolbar button.reject:hover {{ background-color: #b21f2d; }}
    </style>
</head>
<body>
    <div class='toolbar'>
        <button class='download' onclick=""window.location.href='{downloadUrl}'"">⬇ Download</button>
        <button class='approve' onclick='approveDoc()'>✔ Approve</button>
        <button class='reject' onclick='rejectDoc()'>✖ Reject</button>
    </div>
    <iframe src='{fileUrl}'></iframe>
    <script>
        async function approveDoc() {{
            if (!confirm('Approve this document?')) return;
            const res = await fetch('{approveUrl}', {{ method: 'POST' }});
            alert(await res.text());
        }}
        async function rejectDoc() {{
            if (!confirm('Reject this document?')) return;
            const res = await fetch('{rejectUrl}', {{ method: 'POST' }});
            alert(await res.text());
        }}
    </script>
</body>
</html>";

            return Content(html, "text/html");
        }

        // GET /api/document/inline/{id} (for iframe)
        [HttpGet("inline/{id}")]
        public async Task<IActionResult> InlineDocument(int id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentID == id);
            if (document == null) return NotFound("Document not found");

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(rootPath, "Uploads", document.FilePath);

            if (!System.IO.File.Exists(filePath)) return NotFound("File not found");

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
                contentType = "application/octet-stream";

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType);
        }

        // GET /api/document/download/{id}
        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentID == id);
            if (document == null) return NotFound("Document not found");

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(rootPath, "Uploads", document.FilePath);

            if (!System.IO.File.Exists(filePath)) return NotFound("File not found");

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
                contentType = "application/octet-stream";

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType, document.FilePath); // forces download
        }
    }
}

