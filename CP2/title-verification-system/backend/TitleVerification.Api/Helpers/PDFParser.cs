using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace TitleVerification.Api.Helpers
{
    public class PDFParser
    {
        public string ExtractText(byte[] pdfBytes)
        {
            using var memoryStream = new MemoryStream(pdfBytes);
            using var document = PdfDocument.Open(memoryStream);

            var text = new StringBuilder();

            foreach (Page page in document.GetPages())
            {
                text.AppendLine(page.Text);
            }

            return text.ToString();
        }
    }
}
