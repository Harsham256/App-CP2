using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public DocumentController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // 📌 GET /api/document/view/{id}
        [HttpGet("view/{id}")]
        public async Task<IActionResult> ViewDocument(int id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentID == id);
            if (document == null)
                return NotFound();

            var filePath = Path.Combine(_env.ContentRootPath, "Uploads", document.FilePath);
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var ext = Path.GetExtension(filePath).ToLower();
            string contentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType);
        }
    }
}
