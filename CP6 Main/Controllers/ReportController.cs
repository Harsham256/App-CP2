// TitleVerification.Api/Controllers/ReportController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;
using TitleVerification.Api.Services;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IWebHostEnvironment _env;
        private readonly IDocumentService _docService;

        public ReportController(ApplicationDbContext ctx, IWebHostEnvironment env, IDocumentService docService)
        {
            _ctx = ctx; _env = env; _docService = docService;
        }

        [HttpGet("{documentId}")]
        public async Task<IActionResult> Get(int documentId)
        {
            var doc = await _ctx.Documents
                .Include(d => d.User)
                .Include(d => d.LandRecord)
                .FirstOrDefaultAsync(d => d.DocumentID == documentId);

            if (doc == null) return NotFound("Document not found.");

            // Re-extract extended fields for display (no DB schema changes)
            string? extName = doc.ExtractedName, extLandId = doc.ExtractedLandId, father = null, mobile = null, aadhaar = null;
            try
            {
                var root = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var path = Path.Combine(root, "Uploads", doc.FilePath);
                var provider = new FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(path, out var contentType))
                    contentType = "application/octet-stream";
                if (System.IO.File.Exists(path))
                {
                    var bytes = await System.IO.File.ReadAllBytesAsync(path);
                    var ex = _docService.ExtractFieldsExtended(bytes, contentType);
                    extName = extName ?? ex.Name;
                    extLandId = extLandId ?? ex.LandId;
                    father = ex.FatherName; mobile = ex.Mobile; aadhaar = ex.Aadhaar;
                }
            }
            catch { /* non-fatal */ }

            var land = doc.LandRecord;
            var ownerNameDb = land?.OwnerName ?? "Unknown";
            var nameFromDoc = extName ?? "Unknown";
            var forbidden = new[] { "Forest", "Military", "Government" };
            var landType = land?.LandType ?? "";
            bool typeApproved = !forbidden.Contains(landType, StringComparer.OrdinalIgnoreCase);

            // --------- YOUR EXACT RULES (as in 3.0txt.txt) ---------
            string c1 = (land != null &&
                         !string.IsNullOrWhiteSpace(nameFromDoc) &&
                         string.Equals(ownerNameDb, nameFromDoc, StringComparison.OrdinalIgnoreCase)) ? "Green" : "Red";
            string c2 = (land?.SiblingApproval ?? false) ? "Green" : "Red";
            string c3 = (land?.HasOngoingLoan ?? false) ? "Green" : "Red"; // Note: your inverted rule
            string c4 = (land?.HasDispute ?? false) ? "Green" : "Red";     // Note: your inverted rule
            string c5 = typeApproved ? "Green" : "Red";

            var allGreen = new[] { c1, c2, c3, c4, c5 }.All(x => x == "Green");

            var result = new
            {
                DocumentID = doc.DocumentID,
                Summary = allGreen
                    ? "Approved – All verification checks passed."
                    : "Rejected – Some checks failed. Please verify all details and try again.",
                TrafficLightStatus = allGreen ? "Green" : "Red",

                Extracted = new
                {
                    NameFromDocument = nameFromDoc,
                    LandIdFromDocument = extLandId ?? "Unknown",
                    FatherName = father,
                    Mobile = mobile,
                    Aadhaar = aadhaar
                },

                MatchedLand = new
                {
                    Found = land != null,
                    LandId = land?.LandId ?? "Unknown",
                    OwnerNameDb = ownerNameDb,
                    Address = land?.Address ?? "Unknown",
                    Coordinates = new { Latitude = land?.Latitude ?? 0.0, Longitude = land?.Longitude ?? 0.0 },
                    YearOfExistence = land?.YearOfExistence,
                    Ownership = land?.Ownership,
                    SiblingApproval = land?.SiblingApproval,
                    HasOngoingLoan = land?.HasOngoingLoan,
                    HasAnyDisputes = land?.HasDispute,
                    LandType = land?.LandType,
                    RestrictedType = land?.RestrictedType
                },

                ConditionResults = new Dictionary<string, string>
                {
                    { "OwnerNameMatch", c1 },
                    { "SiblingApproval", c2 },
                    { "OngoingLoan", c3 },
                    { "AnyDisputes", c4 },
                    { "TypeApproved", c5 }
                },

                Map = new
                {
                    PolygonColor = typeApproved ? "#16a34a" : "#dc2626",
                    Latitude = land?.Latitude ?? 0.0,
                    Longitude = land?.Longitude ?? 0.0
                }
            };

            return Ok(result);
        }
    }
}