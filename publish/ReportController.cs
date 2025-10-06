using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using TITLE.Data;
using TITLE.Services;
using System.Text;
using System.Text.RegularExpressions;

namespace TITLE.Controllers
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
            _ctx = ctx;
            _env = env;
            _docService = docService;
        }

        [HttpGet("{documentId}")]
        public async Task<IActionResult> Get(int documentId)
        {
            var doc = await _ctx.Documents
                .Include(d => d.User)
                .Include(d => d.LandRecord)
                .FirstOrDefaultAsync(d => d.DocumentID == documentId);

            if (doc == null) return NotFound("Document not found.");

            // Extract extended fields
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
                    extName ??= ex.Name;
                    extLandId ??= ex.LandId;
                    father = ex.FatherName;
                    mobile = ex.Mobile;
                    aadhaar = ex.Aadhaar;
                }
            }
            catch
            {
                // ignore errors
            }

            var land = doc.LandRecord;
            var ownerNameDb = land?.OwnerName ?? "Unknown";
            var nameFromDoc = extName ?? "Unknown";

            var forbidden = new[] { "Forest", "Military", "Government" };
            var landType = land?.LandType ?? "";
            bool typeApproved = !forbidden.Contains(landType, StringComparer.OrdinalIgnoreCase);

            // ---------- RULES ----------
            // 1. Name match
            string c1 = (land != null &&
                         !string.IsNullOrWhiteSpace(nameFromDoc) &&
                         NormalizeName(ownerNameDb) == NormalizeName(nameFromDoc))
                        ? "Green" : "Red";

            // 2. Sibling approval must be true
            string c2 = (land?.SiblingApproval == true) ? "Green" : "Red";

            // 3. Loan must NOT exist
            string c3 = (land?.HasOngoingLoan == true) ? "Red" : "Green";

            // 4. Dispute must NOT exist
            string c4 = (land?.HasDispute == true) ? "Red" : "Green";

            // 5. Land type must be approved
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
                    RestrictedType = land?.RestrictedType,
                    PanNumber = land?.PanNumber,
                    AadhaarNumber = land?.AadhaarNumber
                    
                },

                ConditionResults = new Dictionary<string, string>
                {
                    { "ownerNameMatch", c1 },
                    { "siblingApproval", c2 },
                    { "ongoingLoan", c3 },
                    { "anyDisputes", c4 },
                    { "typeApproved", c5 }

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

        /// <summary>
        /// Normalize names for comparison
        /// </summary>
        private static string NormalizeName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return string.Empty;

            var normalized = name
                .Trim()
                .ToLowerInvariant()
                .Normalize(NormalizationForm.FormC);

            normalized = Regex.Replace(normalized, @"\s+", " ");
            normalized = Regex.Replace(normalized, @"[^\p{L}\p{N}\s]", "");

            return normalized;
        }
    }
}
