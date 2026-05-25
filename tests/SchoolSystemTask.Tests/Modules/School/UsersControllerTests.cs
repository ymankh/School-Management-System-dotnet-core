using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.Auth.Domain;
using SchoolSystemTask.Modules.School.Api;
using SchoolSystemTask.Modules.School.DTOs;

namespace SchoolSystemTask.Tests.Modules.School;

public class UsersControllerTests
{
    [Fact]
    public void CreateUser_CreatesFoundationRoleUser()
    {
        using var database = CreateDatabase();
        var controller = new UsersController(database.Context);

        var result = controller.CreateUser(new CreateUserRequest(
            "Principal User",
            "principal@example.com",
            "password-123",
            AuthRoles.Principal));

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<UserManagementDto>(created.Value);
        Assert.Equal(AuthRoles.Principal, dto.Role);
        Assert.Null(dto.StudentId);
    }

    [Fact]
    public void CreateUser_RejectsInvalidRole()
    {
        using var database = CreateDatabase();
        var controller = new UsersController(database.Context);

        var result = controller.CreateUser(new CreateUserRequest(
            "Invalid Role",
            "invalid@example.com",
            "password-123",
            "guardian"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void UpdateUserRole_AssignsStudentIdForStudentRole()
    {
        using var database = CreateDatabase();
        var user = new AuthUser
        {
            FullName = "Teacher User",
            Email = "teacher@example.com",
            PasswordHash = "hash",
            PasswordSalt = "salt",
            Role = AuthRoles.Teacher,
            CreatedAtUtc = DateTime.UtcNow
        };
        database.Context.Users.Add(user);
        database.Context.SaveChanges();
        var controller = new UsersController(database.Context);

        var result = controller.UpdateUserRole(user.Id, new UpdateUserRoleRequest(AuthRoles.Student));

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<UserManagementDto>(ok.Value);
        Assert.Equal(AuthRoles.Student, dto.Role);
        Assert.Equal(1, dto.StudentId);
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
