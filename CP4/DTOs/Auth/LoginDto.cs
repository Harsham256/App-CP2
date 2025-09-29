namespace TitleVerification.Api.DTOs.Auth
{
    public class LoginDto
    {
        // Changed to Username (not Email)
        public required string Username { get; set; }
        public required string Password { get; set; }
    }
}
