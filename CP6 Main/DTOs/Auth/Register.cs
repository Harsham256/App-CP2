namespace TitleVerification.Api.DTOs.Auth
{
    public class Register
    {
        public required string Name { get; set; }
        public required string Username { get; set; }
        // Email is optional in this flow; frontend does not send it.
        public string? Email { get; set; }
        public required string Password { get; set; }
        public required string AadhaarNumber { get; set; }
        public required string Address { get; set; }
    }
}
