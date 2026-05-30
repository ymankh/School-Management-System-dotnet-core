using Microsoft.AspNetCore.Mvc;
using SchoolSystemTask.Data;
using SchoolSystemTask.Helpers;
using SchoolSystemTask.Modules.Auth.Domain;
using SchoolSystemTask.Modules.School.DTOs;

namespace SchoolSystemTask.Modules.School.Api;

[ApiController]
[Route("api/users")]
public sealed class UsersController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult GetUsers(string? role = null, string? search = null)
    {
        var users = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            var normalizedRole = role.Trim().ToLowerInvariant();
            users = users.Where(user => user.Role == normalizedRole);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            users = users.Where(user =>
                user.FullName.ToLower().Contains(normalizedSearch) ||
                user.Email.ToLower().Contains(normalizedSearch));
        }

        return Ok(users
            .OrderBy(user => user.FullName)
            .AsEnumerable()
            .Select(ToDto)
            .ToList());
    }

    [HttpGet("{id:int}")]
    public IActionResult GetUser(int id)
    {
        var user = db.Users.FirstOrDefault(item => item.Id == id);
        return user is null ? NotFound(new { error = "User was not found." }) : Ok(ToDto(user));
    }

    [HttpPost]
    public IActionResult CreateUser(CreateUserRequest request)
    {
        var validation = ValidateUserInput(request.FullName, request.Email, request.Role, request.Password);
        if (validation is not null)
        {
            return BadRequest(new { error = validation });
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (db.Users.Any(user => user.Email == email))
        {
            return Conflict(new { error = "An account with this email already exists." });
        }

        var role = request.Role.Trim().ToLowerInvariant();
        var salt = SaltHelper.GenerateSalt(16);
        var user = new AuthUser
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = HashHelper.HashPassword(request.Password, salt),
            PasswordSalt = salt,
            Role = role,
            StudentId = role == AuthRoles.Student ? GetNextStudentId() : null,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Users.Add(user);
        db.SaveChanges();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, ToDto(user));
    }

    [HttpPut("{id:int}")]
    public IActionResult UpdateUser(int id, UpdateUserRequest request)
    {
        var user = db.Users.FirstOrDefault(item => item.Id == id);
        if (user is null)
        {
            return NotFound(new { error = "User was not found." });
        }

        var fullName = request.FullName.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        if (fullName.Length < 2)
        {
            return BadRequest(new { error = "Enter the user's full name." });
        }

        if (!IsValidEmail(email))
        {
            return BadRequest(new { error = "Enter a valid email address." });
        }

        if (db.Users.Any(item => item.Id != id && item.Email == email))
        {
            return Conflict(new { error = "An account with this email already exists." });
        }

        user.FullName = fullName;
        user.Email = email;
        db.SaveChanges();

        return Ok(ToDto(user));
    }

    [HttpPut("{id:int}/role")]
    public IActionResult UpdateUserRole(int id, UpdateUserRoleRequest request)
    {
        var user = db.Users.FirstOrDefault(item => item.Id == id);
        if (user is null)
        {
            return NotFound(new { error = "User was not found." });
        }

        var role = request.Role.Trim().ToLowerInvariant();
        if (!AuthRoles.IsValid(role))
        {
            return BadRequest(new { error = "Choose a valid role." });
        }

        user.Role = role;
        user.StudentId = role == AuthRoles.Student ? user.StudentId ?? GetNextStudentId() : null;
        db.SaveChanges();

        return Ok(ToDto(user));
    }

    [HttpDelete("{id:int}")]
    public IActionResult DeleteUser(int id)
    {
        var user = db.Users.FirstOrDefault(item => item.Id == id);
        if (user is null)
        {
            return NotFound(new { error = "User was not found." });
        }

        if (user.Role == AuthRoles.Admin && db.Users.Count(item => item.Role == AuthRoles.Admin) == 1)
        {
            return Conflict(new { error = "You cannot delete the only admin account." });
        }

        db.Users.Remove(user);
        db.SaveChanges();
        return NoContent();
    }

    private int GetNextStudentId()
    {
        return (db.Users.Max(user => user.StudentId) ?? 0) + 1;
    }

    private static string? ValidateUserInput(string fullName, string email, string role, string password)
    {
        if (fullName.Trim().Length < 2)
        {
            return "Enter the user's full name.";
        }

        if (!IsValidEmail(email.Trim()))
        {
            return "Enter a valid email address.";
        }

        if (password.Length < 8)
        {
            return "Password must be at least 8 characters.";
        }

        return AuthRoles.IsValid(role) ? null : "Choose a valid role.";
    }

    private static bool IsValidEmail(string email)
    {
        return email.Contains('@') && email.Contains('.');
    }

    private static UserManagementDto ToDto(AuthUser user)
    {
        return new UserManagementDto(user.Id, user.FullName, user.Email, user.Role, user.StudentId, user.CreatedAtUtc);
    }
}
