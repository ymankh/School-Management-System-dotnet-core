namespace SchoolSystemTask.Modules.Auth.Domain;

public static class AuthRoles
{
    public const string Admin = "admin";
    public const string Principal = "principal";
    public const string Teacher = "teacher";
    public const string Student = "student";
    public const string Parent = "parent";
    public const string PublicRegistrationRole = Student;

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Admin,
        Principal,
        Teacher,
        Student,
        Parent
    };

    public static bool IsValid(string role)
    {
        return All.Contains(role.Trim());
    }
}
