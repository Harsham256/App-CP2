using System;
using System.Threading.Tasks;

namespace DocumentVerificationDLL
{
    public interface IDocumentVerificationDLL
    {
        /// <summary>
        /// Extract data from EC (Encumbrance Certificate) document
        /// </summary>
        Task<ExtractedData> ExtractECAsync(string filePath);

        /// <summary>
        /// Extract data from Aadhaar document
        /// </summary>
        Task<ExtractedData> ExtractAadhaarAsync(string filePath);

        /// <summary>
        /// Extract data from PAN document
        /// </summary>
        Task<ExtractedData> ExtractPANAsync(string filePath);
    }

    public class ExtractedData
    {
        // Common fields
        public string? Name { get; set; }
        public string? DOB { get; set; }
        public string? Address { get; set; }
        public string? SurveyNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? AadhaarNumber { get; set; }

        // Optional extra metadata
        public string? FatherName { get; set; }
        public string? MotherName { get; set; }
        public string? ECNumber { get; set; }
        public string? PropertyDetails { get; set; }

        // EC-specific fields
        public string? ApplicationNumber { get; set; }
        public string? MeasuringArea { get; set; }
        public string? Village { get; set; }
        public string? Hobli { get; set; }
        public string? Taluk { get; set; }
        public string? District { get; set; }

        // Confidence & notes
        public decimal ConfidenceScore { get; set; }
        public string? ExtractionNotes { get; set; }
    }
}