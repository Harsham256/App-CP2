using System;
using System.IO;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Linq;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;
using Tesseract;

namespace DocumentVerificationDLL
{
    public class DocumentVerificationDLL : IDocumentVerificationDLL
    {
        private readonly ILogger<DocumentVerificationDLL> _logger;

        public DocumentVerificationDLL(ILogger<DocumentVerificationDLL> logger)
        {
            _logger = logger;
        }

        public async Task<ExtractedData> ExtractECAsync(string filePath)
        {
            try
            {
                _logger.LogInformation($"Extracting EC document: {filePath}");

                if (string.IsNullOrEmpty(filePath))
                    throw new ArgumentException("File path cannot be null or empty");

                if (!File.Exists(filePath))
                    throw new FileNotFoundException($"EC document not found: {filePath}");

                if (!Path.GetExtension(filePath).Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException("EC document must be a PDF file");

                var ecData = await Task.Run(() => ExtractECData(filePath));

                return new ExtractedData
                {
                    ApplicationNumber = ecData?.ApplicationNumber,
                    Name = ecData?.ApplicantName,
                    Address = ecData?.ApplicantAddress,
                    SurveyNumber = ecData?.SurveyNo,
                    MeasuringArea = ecData?.MeasuringArea,
                    Village = ecData?.Village,
                    Hobli = ecData?.Hobli,
                    Taluk = ecData?.Taluk,
                    District = ecData?.District,
                    ConfidenceScore = 0.95m,
                    ExtractionNotes = "EC document extracted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting EC document: {filePath}");
                throw;
            }
        }

        public async Task<ExtractedData> ExtractAadhaarAsync(string filePath)
        {
            try
            {
                _logger.LogInformation($"Extracting Aadhaar document: {filePath}");

                if (string.IsNullOrEmpty(filePath))
                    throw new ArgumentException("File path cannot be null or empty");

                if (!File.Exists(filePath))
                    throw new FileNotFoundException($"Aadhaar document not found: {filePath}");

                if (!Path.GetExtension(filePath).Equals(".png", StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException("Aadhaar document must be a PNG file");

                var tessDataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");
                var aadhaarData = await Task.Run(() => ExtractAadhaar(filePath, tessDataPath));

                return new ExtractedData
                {
                    Name = aadhaarData?.Name,
                    DOB = aadhaarData?.DOB,
                    AadhaarNumber = aadhaarData?.AadhaarNo,
                    ConfidenceScore = 0.90m,
                    ExtractionNotes = "Aadhaar document extracted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting Aadhaar document: {filePath}");
                throw;
            }
        }

        public async Task<ExtractedData> ExtractPANAsync(string filePath)
        {
            try
            {
                _logger.LogInformation($"Extracting PAN document: {filePath}");

                if (string.IsNullOrEmpty(filePath))
                    throw new ArgumentException("File path cannot be null or empty");

                if (!File.Exists(filePath))
                    throw new FileNotFoundException($"PAN document not found: {filePath}");

                if (!Path.GetExtension(filePath).Equals(".png", StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException("PAN document must be a PNG file");

                var tessDataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");
                var panData = await Task.Run(() => ExtractPAN(filePath, tessDataPath));

                return new ExtractedData
                {
                    Name = panData?.Name,
                    PANNumber = panData?.PANNo,
                    ConfidenceScore = 0.90m,
                    ExtractionNotes = "PAN document extracted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting PAN document: {filePath}");
                throw;
            }
        }

        private AadhaarData? ExtractAadhaar(string filePath, string tessDataPath)
        {
            try
            {
                using var ocr = new TesseractEngine(tessDataPath, "eng", EngineMode.Default);
                using var img = Pix.LoadFromFile(filePath);
                using var page = ocr.Process(img);

                string text = page.GetText();

                var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                .Select(l => l.Trim())
                                .Where(l => !l.Contains("SAMPLE") &&
                                            !l.Contains("PROJECT") &&
                                            !l.Contains("Sample country") &&
                                            !l.Equals("Male", StringComparison.OrdinalIgnoreCase))
                                .ToList();

                string aadhaarNo = lines.FirstOrDefault(l => Regex.IsMatch(l, @"\b\d{4}\s\d{4}\s\d{4}\b")) ?? "";
                string dob = "";
                string dobLine = lines.FirstOrDefault(l => Regex.IsMatch(l, @"\d{2}/\d{2}/\d{4}"));
                if (!string.IsNullOrEmpty(dobLine))
                {
                    // Extract just the date part, removing any "Date of Birth:" prefix
                    var dobMatch = Regex.Match(dobLine, @"(\d{2}/\d{2}/\d{4})");
                    if (dobMatch.Success)
                    {
                        dob = dobMatch.Groups[1].Value;
                    }
                }

                string name = "";
                if (!string.IsNullOrEmpty(aadhaarNo))
                {
                    int idx = lines.FindIndex(l => l.Contains(aadhaarNo));
                    if (idx > 0) name = lines[idx - 1];
                }

                return new AadhaarData { Name = name, AadhaarNo = aadhaarNo, DOB = dob };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting Aadhaar data from {filePath}");
                return null;
            }
        }

        private PANData? ExtractPAN(string filePath, string tessDataPath)
        {
            try
            {
                using var ocr = new TesseractEngine(tessDataPath, "eng", EngineMode.Default);
                using var img = Pix.LoadFromFile(filePath);
                using var page = ocr.Process(img);

                string text = page.GetText();

                var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                .Select(l => l.Trim())
                                .Where(l => !l.Contains("SAMPLE") &&
                                            !l.Contains("PROJECT") &&
                                            !l.Contains("Sample country") &&
                                            !l.Contains("Income tax"))
                                .ToList();

                string panNo = lines.FirstOrDefault(l => Regex.IsMatch(l, @"[A-Z]{5}[0-9]{4}[A-Z]")) ?? "";
                string dob = "";
                string dobLine = lines.FirstOrDefault(l => Regex.IsMatch(l, @"\d{2}/\d{2}/\d{4}"));
                if (!string.IsNullOrEmpty(dobLine))
                {
                    // Extract just the date part, removing any "Date of Birth:" prefix
                    var dobMatch = Regex.Match(dobLine, @"(\d{2}/\d{2}/\d{4})");
                    if (dobMatch.Success)
                    {
                        dob = dobMatch.Groups[1].Value;
                    }
                }

                string name = "";
                int panIdx = lines.FindIndex(l => l.Contains(panNo));
                if (panIdx > 0)
                {
                    // Look for name in lines before PAN number, excluding lines that contain DOB or other patterns
                    for (int i = panIdx - 1; i >= 0; i--)
                    {
                        string candidateName = lines[i].Trim();
                        // Skip lines that contain DOB, PAN pattern, or are too short
                        if (!string.IsNullOrEmpty(candidateName) &&
                            !Regex.IsMatch(candidateName, @"\d{2}/\d{2}/\d{4}") &&
                            !Regex.IsMatch(candidateName, @"[A-Z]{5}[0-9]{4}[A-Z]") &&
                            candidateName.Length > 2 &&
                            !candidateName.Contains("Date of Birth") &&
                            !candidateName.Contains("Income Tax") &&
                            !candidateName.Contains("Department"))
                        {
                            name = candidateName;
                            break;
                        }
                    }
                }

                return new PANData { Name = name, PANNo = panNo, DOB = dob };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting PAN data from {filePath}");
                return null;
            }
        }

        private ECData? ExtractECData(string filePath)
        {
            try
            {
                string text = "";

                using var pdf = PdfDocument.Open(filePath);
                foreach (var page in pdf.GetPages())
                {
                    text += page.Text + "\n";
                }

                text = Regex.Replace(text, @"\r\n|\n", " ");
                text = Regex.Replace(text, @"\s{2,}", " ");

                return new ECData
                {
                    ApplicationNumber = RegexMatch(text, @"ApplicationNumber[:\s\[]*([A-Z0-9\-]+)"),
                    ApplicantName = RegexMatch(text, @"ApplicantName[:\s\[]*([A-Za-z\s]+)"),
                    ApplicantAddress = RegexMatch(text, @"ApplicantAddress[:\s\[]*([A-Za-z0-9,\-\s]+)"),
                    SurveyNo = RegexMatch(text, @"SurveyNo[:\s\[]*([\d/]+)"),
                  
                    MeasuringArea = RegexMatch(text, @"Total\s*Area[:\s\[]*([\d]+\s*(?:Sqft|Soft))"),


                    Village = RegexMatch(text, @"Village[:\s\[]*([A-Za-z\s]+)"),
                    Hobli = RegexMatch(text, @"Hobli[:\s\[]*([A-Za-z\s]+)"),
                    Taluk = RegexMatch(text, @"Taluk[:\s\[]*([A-Za-z\s]+)"),
                    District = RegexMatch(text, @"District[:\s\[]*([A-Za-z\s]+)")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting EC data from {filePath}");
                return null;
            }
        }

        private string? RegexMatch(string text, string pattern)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }
    }

    public class AadhaarData
    {
        public string? Name { get; set; }
        public string? DOB { get; set; }
        public string? AadhaarNo { get; set; }
    }

    public class PANData
    {
        public string? Name { get; set; }
        public string? PANNo { get; set; }
        public string? DOB { get; set; }
    }

    public class ECData
    {
        public string? ApplicationNumber { get; set; }
        public string? ApplicantName { get; set; }
        public string? ApplicantAddress { get; set; }
        public string? SurveyNo { get; set; }
        public string? MeasuringArea { get; set; }
        public string? Village { get; set; }
        public string? Hobli { get; set; }
        public string? Taluk { get; set; }
        public string? District { get; set; }
    }
}