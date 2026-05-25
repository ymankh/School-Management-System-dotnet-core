using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.School.Api;
using SchoolSystemTask.Modules.School.DTOs;

namespace SchoolSystemTask.Tests.Modules.School;

public class SubjectsControllerTests
{
    [Fact]
    public void CreateSubject_CreatesActiveSubject()
    {
        using var database = CreateDatabase();
        var controller = new SubjectsController(database.Context);

        var result = controller.CreateSubject(new CreateSubjectRequest("Mathematics", "math", "Core math"));

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<SubjectDto>(created.Value);
        Assert.Equal("MATH", dto.Code);
        Assert.True(dto.IsActive);
    }

    [Fact]
    public void CreateSubject_RejectsDuplicateCode()
    {
        using var database = CreateDatabase();
        var controller = new SubjectsController(database.Context);
        controller.CreateSubject(new CreateSubjectRequest("Mathematics", "MATH"));

        var result = controller.CreateSubject(new CreateSubjectRequest("Advanced Mathematics", "MATH"));

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public void DeleteSubject_DeactivatesSubject()
    {
        using var database = CreateDatabase();
        var controller = new SubjectsController(database.Context);
        var created = Assert.IsType<CreatedAtActionResult>(controller.CreateSubject(new CreateSubjectRequest("Physics", "PHY")));
        var subject = Assert.IsType<SubjectDto>(created.Value);

        var result = controller.DeleteSubject(subject.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.False(database.Context.Subjects.Single().IsActive);
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
