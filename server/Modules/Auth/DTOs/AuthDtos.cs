namespace SchoolSystemTask.Modules.Auth.DTOs;

public sealed record AuthUserDto(
    string Id,
    string FullName,
    string Email,
    string Role,
    int? StudentId);

public sealed record LoginRequest(string Email, string Password);

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string? Role = null);
