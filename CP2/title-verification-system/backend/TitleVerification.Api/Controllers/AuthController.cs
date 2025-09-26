using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Data;
using TitleVerification.Api.DTOs.Auth;
using TitleVerification.Api.Helpers;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtSettings _jwt;

        public AuthController(ApplicationDbContext context, JwtSettings jwt)
        {
            _context = context;
            _jwt = jwt ?? throw new ArgumentNullException(nameof(jwt));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Register request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid request data." });

            var exists = await _context.Users.AnyAsync(u => u.Username == request.Username);
            if (exists)
                return BadRequest(new { message = "Username already taken." });

            // TODO: hash password before production
            var user = new User
            {
                Name = request.Name,
                Username = request.Username,
                Email = request.Email ?? string.Empty,
                PasswordHash = request.Password,
                AadhaarNumber = request.AadhaarNumber,
                Address = request.Address,
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = JwtHelpers.GenerateToken(user.Id, user.Username, _jwt);

            return Ok(new { token, role = "user", userId = user.Id, username = user.Username });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Invalid request data." });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.PasswordHash == request.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid credentials." });

            var token = JwtHelpers.GenerateToken(user.Id, user.Username, _jwt);

            return Ok(new { token, role = user.Role.ToString().ToLower(), userId = user.Id, username = user.Username });
        }
    }
}
