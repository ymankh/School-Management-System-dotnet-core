namespace SchoolSystemTask.Modules.School.DTOs;

public sealed record UserManagementDto(
    int Id,
    string FullName,
    string Email,
    string Role,
    int? StudentId,
    DateTime CreatedAtUtc);

public sealed record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role);

public sealed record UpdateUserRequest(
    string FullName,
    string Email);

public sealed record UpdateUserRoleRequest(string Role);
