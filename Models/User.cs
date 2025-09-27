namespace TitleVerification.Api.Models
{
    public enum UserRole
    {
        Admin,
        User
    }

    public class User
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string AadhaarNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.User;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ✅ Documents navigation
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}
