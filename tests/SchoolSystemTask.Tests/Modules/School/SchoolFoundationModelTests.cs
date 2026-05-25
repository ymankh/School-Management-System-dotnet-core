using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.Auth.Domain;
using SchoolSystemTask.Modules.School.Domain;

namespace SchoolSystemTask.Tests.Modules.School;

public class SchoolFoundationModelTests
{
    [Fact]
    public void Subjects_RequireUniqueCodes()
    {
        using var database = CreateDatabase();
        database.Context.Subjects.AddRange(
            new Subject { Name = "Mathematics", Code = "MATH" },
            new Subject { Name = "Advanced Mathematics", Code = "MATH" });

        Assert.Throws<DbUpdateException>(() => database.Context.SaveChanges());
    }

    [Fact]
    public void Classes_RequireUniqueNamePerAcademicYear()
    {
        using var database = CreateDatabase();
        database.Context.SchoolClasses.AddRange(
            new SchoolClass { Name = "Grade 10 - A", GradeLevel = "10", AcademicYear = "2026" },
            new SchoolClass { Name = "Grade 10 - A", GradeLevel = "10", AcademicYear = "2026" });

        Assert.Throws<DbUpdateException>(() => database.Context.SaveChanges());
    }

    [Fact]
    public void StudentEnrollment_AllowsOneClassPerAcademicYear()
    {
        using var database = CreateDatabase();
        var student = AddUser(database.Context, "student@example.com", AuthRoles.Student);
        var profile = new StudentProfile { User = student, StudentNumber = "S-001" };
        var firstClass = new SchoolClass { Name = "Grade 10 - A", GradeLevel = "10", AcademicYear = "2026" };
        var secondClass = new SchoolClass { Name = "Grade 10 - B", GradeLevel = "10", AcademicYear = "2026" };
        database.Context.StudentClassEnrollments.AddRange(
            new StudentClassEnrollment { StudentProfile = profile, SchoolClass = firstClass, AcademicYear = "2026" },
            new StudentClassEnrollment { StudentProfile = profile, SchoolClass = secondClass, AcademicYear = "2026" });

        Assert.Throws<DbUpdateException>(() => database.Context.SaveChanges());
    }

    [Fact]
    public void TeacherAssignments_RejectDuplicateClassSubjectAssignments()
    {
        using var database = CreateDatabase();
        var teacher = new TeacherProfile
        {
            User = AddUser(database.Context, "teacher@example.com", AuthRoles.Teacher),
            EmployeeNumber = "T-001"
        };
        var classSubject = new ClassSubject
        {
            SchoolClass = new SchoolClass { Name = "Grade 11 - A", GradeLevel = "11", AcademicYear = "2026" },
            Subject = new Subject { Name = "Physics", Code = "PHY" }
        };
        database.Context.TeacherClassAssignments.AddRange(
            new TeacherClassAssignment { TeacherProfile = teacher, ClassSubject = classSubject },
            new TeacherClassAssignment { TeacherProfile = teacher, ClassSubject = classSubject });

        Assert.Throws<DbUpdateException>(() => database.Context.SaveChanges());
    }

    [Fact]
    public void ParentStudentLinks_RejectDuplicates()
    {
        using var database = CreateDatabase();
        var parent = new ParentProfile
        {
            User = AddUser(database.Context, "parent@example.com", AuthRoles.Parent),
            Phone = "555-0100"
        };
        var student = new StudentProfile
        {
            User = AddUser(database.Context, "linked-student@example.com", AuthRoles.Student),
            StudentNumber = "S-002"
        };
        database.Context.ParentStudentLinks.AddRange(
            new ParentStudentLink { ParentProfile = parent, StudentProfile = student, Relationship = "Mother" },
            new ParentStudentLink { ParentProfile = parent, StudentProfile = student, Relationship = "Mother" });

        Assert.Throws<DbUpdateException>(() => database.Context.SaveChanges());
    }

    private static AuthUser AddUser(ApplicationDbContext context, string email, string role)
    {
        return new AuthUser
        {
            FullName = email,
            Email = email,
            PasswordHash = "hash",
            PasswordSalt = "salt",
            Role = role,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    private static TestDatabase CreateDatabase()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return new TestDatabase(connection, context);
    }

    private sealed class TestDatabase(SqliteConnection connection, ApplicationDbContext context) : IDisposable
    {
        public ApplicationDbContext Context { get; } = context;

        public void Dispose()
        {
            Context.Dispose();
            connection.Dispose();
        }
    }
}
