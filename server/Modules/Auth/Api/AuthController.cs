using Microsoft.AspNetCore.Mvc;
using SchoolSystemTask.Data;
using SchoolSystemTask.Helpers;
using SchoolSystemTask.Modules.Auth.Domain;
using SchoolSystemTask.Modules.Auth.DTOs;

namespace SchoolSystemTask.Modules.Auth.Api;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(ApplicationDbContext db) : ControllerBase
{
    private static readonly HashSet<string> Roles = ["admin", "teacher", "student"];

    [HttpGet("session/{id:int}")]
    public IActionResult GetSession(int id)
    {
        var user = db.Users.FirstOrDefault(item => item.Id == id);
        return user is null ? NotFound(new { error = "Session user was not found." }) : Ok(ToDto(user));
    }

    [HttpPost("login")]
    public IActionResult Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = db.Users.FirstOrDefault(item => item.Email == email);

        if (user is null || user.PasswordHash != HashHelper.HashPassword(request.Password, user.PasswordSalt))
        {
            return Unauthorized(new { error = "Email or password is incorrect." });
        }

        return Ok(ToDto(user));
    }

    [HttpPost("register")]
    public IActionResult Register(RegisterRequest request)
    {
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var role = request.Role.Trim().ToLowerInvariant();

        if (fullName.Length < 2)
        {
            return BadRequest(new { error = "Enter your full name." });
        }

        if (!email.Contains('@') || !email.Contains('.'))
        {
            return BadRequest(new { error = "Enter a valid email address." });
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(new { error = "Password must be at least 8 characters." });
        }

        if (!Roles.Contains(role))
        {
            return BadRequest(new { error = "Choose a valid role." });
        }

        if (db.Users.Any(item => item.Email == email))
        {
            return Conflict(new { error = "An account with this email already exists." });
        }

        var salt = SaltHelper.GenerateSalt(16);
        var nextStudentId = (db.Users.Max(item => item.StudentId) ?? 0) + 1;

        var user = new AuthUser
        {
            FullName = fullName,
            Email = email,
            PasswordHash = HashHelper.HashPassword(request.Password, salt),
            PasswordSalt = salt,
            Role = role,
            StudentId = role == "student" ? nextStudentId : null,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Users.Add(user);
        db.SaveChanges();

        return CreatedAtAction(nameof(GetSession), new { id = user.Id }, ToDto(user));
    }

    private static AuthUserDto ToDto(AuthUser user)
    {
        return new AuthUserDto(user.Id.ToString(), user.FullName, user.Email, user.Role, user.StudentId);
    }
}
