namespace SchoolSystemTask.Modules.Auth.Domain;

public sealed class AuthUser
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? StudentId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
