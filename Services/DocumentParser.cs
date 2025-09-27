using System.Drawing;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;
using UglyToad.PdfPig;

namespace TitleVerification.Api.Services
{
    public class DocumentService : IDocumentService
    {
        // FIXED: regex should look for LAND-<digits>
        private static readonly Regex LandIdRegex = new Regex(@"LAND-\d+", RegexOptions.Compiled | RegexOptions.IgnoreCase);

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
            string text;

            if (contentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
                text = ExtractFromPdf(fileBytes);
            else if (contentType.Contains("text", StringComparison.OrdinalIgnoreCase))
                text = Encoding.UTF8.GetString(fileBytes);
            else
                throw new NotSupportedException($"Unsupported content type: {contentType}");

            if (string.IsNullOrWhiteSpace(text))
                return "NOT_FOUND";

            var match = LandIdRegex.Match(text);
            return match.Success ? match.Value : "NOT_FOUND";
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

            if (sb.Length > 0)
                return sb.ToString();

            // fallback OCR
            return ExtractFromPdfWithOcr(fileBytes);
        }

        private string ExtractFromPdfWithOcr(byte[] fileBytes)
        {
            var sb = new StringBuilder();

            using var engine = new TesseractEngine(_tessDataPath, _tessLang, EngineMode.Default);
            using var ms = new MemoryStream(fileBytes);
            using var pdf = PdfDocument.Open(ms);

            foreach (var page in pdf.GetPages())
            {
                var images = page.GetImages();
                foreach (var img in images)
                {
                    if (!img.TryGetPng(out var png)) continue;

                    using var imgStream = new MemoryStream(png.ToArray());
                    using var bmp = new Bitmap(imgStream);

                    using var pix = BitmapToPix(bmp);

                    using var ocrPage = engine.Process(pix);
                    sb.AppendLine(ocrPage.GetText());
                }
            }

            return sb.ToString();
        }

        private Pix BitmapToPix(Bitmap bitmap)
        {
            using var ms = new MemoryStream();
            bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            ms.Position = 0;
            return Pix.LoadFromMemory(ms.ToArray());
        }
    }
}


