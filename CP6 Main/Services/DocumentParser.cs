// TitleVerification.Api/Services/DocumentService.cs
using System.Drawing;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;
using UglyToad.PdfPig;

namespace TitleVerification.Api.Services
{
    public class DocumentService : IDocumentService
    {
        // LandId patterns
        private static readonly Regex LandIdRegexInline = new(@"LAND-\d+", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex LandIdRegexLabel = new(@"\bLand\s*Id\s*[-:]\s*([A-Za-z0-9\-_]+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // Name(#)
        private static readonly Regex NameHashRegex = new(@"\bName\s*#\s*[:\-]?\s*(.+)$", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

        // Additional fields to EXTRACT (for display only)
        private static readonly Regex FatherNameRegex = new(@"\bFather\s*name\s*[:\-]?\s*(.+)$", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);
        private static readonly Regex MobileRegex = new(@"\b(Mobile|Phone|Mobile\s*Number)\s*[:\-]?\s*([0-9]{10,})\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex AadhaarRegex = new(@"\b([0-9]{4}\s?[0-9]{4}\s?[0-9]{4})\b", RegexOptions.Compiled); // basic 12-digit match

        private readonly string _tessDataPath;
        private readonly string _tessLang;

        public DocumentService() : this(Path.Combine(AppContext.BaseDirectory, "tessdata"), "eng") { }
        public DocumentService(string tessDataPath, string tessLang)
        {
            _tessDataPath = tessDataPath;
            _tessLang = tessLang;
        }

        public string ExtractLandId(byte[] fileBytes, string contentType)
        {
            var text = GetText(fileBytes, contentType);
            if (string.IsNullOrWhiteSpace(text)) return "NOT_FOUND";
            var m1 = LandIdRegexInline.Match(text); if (m1.Success) return m1.Value;
            var m2 = LandIdRegexLabel.Match(text); if (m2.Success) return m2.Groups[1].Value;
            return "NOT_FOUND";
        }

        public ExtractedFields ExtractFields(byte[] fileBytes, string contentType)
        {
            var x = ExtractFieldsExtended(fileBytes, contentType);
            return new ExtractedFields(x.Name, x.LandId, x.RawText);
        }

        public ExtractedFieldsExtended ExtractFieldsExtended(byte[] fileBytes, string contentType)
        {
            var text = GetText(fileBytes, contentType) ?? "";
            string? name = null, landId = null, father = null, mobile = null, aadhaar = null;

            if (!string.IsNullOrWhiteSpace(text))
            {
                // LandId
                var m1 = LandIdRegexInline.Match(text);
                landId = m1.Success ? m1.Value : null;
                if (landId == null)
                {
                    var m2 = LandIdRegexLabel.Match(text);
                    if (m2.Success) landId = m2.Groups[1].Value;
                }

                // Name(#)
                var nm = NameHashRegex.Match(text);
                if (nm.Success)
                {
                    name = nm.Groups[1].Value.Trim();
                    name = Regex.Replace(name, @"[\r\n]+.*$", string.Empty).Trim();
                }

                // Fathername / Mobile / Aadhaar (optional display only)
                var f = FatherNameRegex.Match(text);
                if (f.Success) { father = f.Groups[1].Value.Trim(); father = Regex.Replace(father, @"[\r\n]+.*$", ""); }
                var mb = MobileRegex.Match(text);
                if (mb.Success) mobile = mb.Groups[2].Value.Replace(" ", "");
                var ad = AadhaarRegex.Match(text);
                if (ad.Success) aadhaar = ad.Groups[1].Value.Replace(" ", "");
            }

            return new ExtractedFieldsExtended(name, landId, father, mobile, aadhaar, text);
        }

        private string GetText(byte[] fileBytes, string contentType)
        {
            if (contentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
                return ExtractFromPdf(fileBytes);
            if (contentType.Contains("text", StringComparison.OrdinalIgnoreCase))
                return Encoding.UTF8.GetString(fileBytes);
            if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return ExtractFromImageWithOcr(fileBytes);

            // Fallback: try OCR path
            return ExtractFromImageWithOcr(fileBytes);
        }

        private string ExtractFromPdf(byte[] fileBytes)
        {
            var sb = new StringBuilder();
            using var ms = new MemoryStream(fileBytes);
            using var pdf = PdfDocument.Open(ms);
            foreach (var page in pdf.GetPages())
            {
                if (!string.IsNullOrWhiteSpace(page.Text))
                    sb.AppendLine(page.Text);
            }
            return sb.Length > 0 ? sb.ToString() : ExtractFromPdfWithOcr(fileBytes);
        }

        private string ExtractFromPdfWithOcr(byte[] fileBytes)
        {
            var sb = new StringBuilder();
            using var engine = new TesseractEngine(_tessDataPath, _tessLang, EngineMode.Default);
            using var ms = new MemoryStream(fileBytes);
            using var pdf = PdfDocument.Open(ms);
            foreach (var page in pdf.GetPages())
            {
                foreach (var img in page.GetImages())
                {
                    if (!img.TryGetPng(out var png)) continue;
                    using var ims = new MemoryStream(png.ToArray());
                    using var bmp = new Bitmap(ims);
                    using var pix = Pix.LoadFromMemory(EncodePng(bmp));
                    using var ocr = engine.Process(pix);
                    sb.AppendLine(ocr.GetText());
                }
            }
            return sb.ToString();
        }

        private string ExtractFromImageWithOcr(byte[] fileBytes)
        {
            using var engine = new TesseractEngine(_tessDataPath, _tessLang, EngineMode.Default);
            using var ms = new MemoryStream(fileBytes);
            using var bmp = new Bitmap(ms);
            using var pix = Pix.LoadFromMemory(EncodePng(bmp));
            using var ocr = engine.Process(pix);
            return ocr.GetText();
        }

        private byte[] EncodePng(Bitmap bmp)
        {
            using var ms = new MemoryStream();
            bmp.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            return ms.ToArray();
        }
    }
}