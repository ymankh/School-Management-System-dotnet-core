using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.Exams.Application;
using SchoolSystemTask.Modules.Exams.Domain;
using SchoolSystemTask.Modules.Exams.DTOs;

namespace SchoolSystemTask.Tests.Modules.Exams;

public class ExamEngineStoreTests
{
    [Fact]
    public void GetDashboard_AppliesTeacherDashboardFilters()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var tomorrow = DateTime.UtcNow.Date.AddDays(1).AddHours(9);
        var created = store.CreateExam(new CreateExamRequest(
            "Physics Paper Assessment",
            20,
            "Physics",
            "Grade 11 - B",
            "Dr. Faraday",
            ExamMode.Paper,
            tomorrow,
            tomorrow.AddHours(2),
            100,
            50,
            "Paper instructions"));

        store.PublishExam(created.Id);

        var physics = store.GetDashboard(
            className: "Grade 11 - B",
            subject: "Physics",
            date: "upcoming",
            mode: "Paper");

        var empty = store.GetDashboard(
            className: "Grade 10 - A",
            subject: "Physics",
            date: "upcoming",
            mode: "Paper");
        var teacherSearch = store.GetDashboard(search: "Dr. Faraday");

        var exam = Assert.Single(physics.Exams);
        Assert.Equal(created.Id, exam.Id);
        Assert.Empty(empty.Exams);
        Assert.Contains(teacherSearch.Exams, item => item.Id == created.Id);
    }

    [Fact]
    public void UpdateExam_PersistsSubmittedQuestionDrafts()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = store.CreateExam(new CreateExamRequest(
            "Algebra Quiz",
            10,
            "Mathematics",
            "Grade 10 - A",
            "Dr. Noether",
            ExamMode.Online,
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(2),
            10,
            5,
            "Instructions"));
        var group = store.AddGroup(exam.Id, new CreateQuestionGroupRequest(
            "Core Skills",
            "Group instructions",
            "show-all",
            null,
            true))!;
        var originalQuestion = store.AddQuestion(group.Id, new CreateQuestionRequest(
            QuestionType.MultipleChoice,
            "Original question",
            string.Empty,
            1,
            true,
            "Easy",
            ["algebra"],
            "auto",
            true,
            [new QuestionOptionDto(0, "A", true, 1)],
            [],
            [],
            [],
            null))!;
        exam = store.GetExam(exam.Id)!;
        group = exam.Groups[0];
        var updatedBody = "Updated question with $x^2 + 5x + 6$";
        var newBody = "New teacher-authored question with $y = 2x$";

        var submittedGroup = new QuestionGroup
        {
            Id = group.Id,
            ExamId = exam.Id,
            Title = group.Title,
            InstructionsMarkdown = group.InstructionsMarkdown,
            AuthoringOrder = group.AuthoringOrder,
            SelectionPolicy = group.SelectionPolicy,
            QuestionsToShow = group.QuestionsToShow,
            ShuffleQuestions = group.ShuffleQuestions,
            Questions =
            [
                new ExamQuestion
                {
                    Id = originalQuestion.Id,
                    GroupId = group.Id,
                    Type = originalQuestion.Type,
                    BodyMarkdown = updatedBody,
                    ReferenceMarkdown = originalQuestion.ReferenceMarkdown,
                    Mark = originalQuestion.Mark,
                    AuthoringOrder = 1,
                    IsRequired = originalQuestion.IsRequired,
                    Difficulty = originalQuestion.Difficulty,
                    Tags = [.. originalQuestion.Tags],
                    GradingRule = originalQuestion.GradingRule,
                    ShuffleOptions = originalQuestion.ShuffleOptions,
                    Options = [.. originalQuestion.Options],
                    MatchPairs = [.. originalQuestion.MatchPairs],
                    OrderingItems = [.. originalQuestion.OrderingItems],
                    AcceptedAnswers = [.. originalQuestion.AcceptedAnswers],
                    FileUploadRule = originalQuestion.FileUploadRule
                },
                new ExamQuestion
                {
                    Id = -1,
                    GroupId = group.Id,
                    Type = QuestionType.ShortAnswer,
                    BodyMarkdown = newBody,
                    ReferenceMarkdown = string.Empty,
                    Mark = 1,
                    AuthoringOrder = 2,
                    IsRequired = true,
                    Difficulty = "Medium",
                    Tags = [],
                    GradingRule = "manual",
                    ShuffleOptions = false,
                    Options = [],
                    MatchPairs = [],
                    OrderingItems = [],
                    AcceptedAnswers = []
                }
            ]
        };

        var updated = store.UpdateExam(exam.Id, new UpdateExamRequest(
            exam.Title,
            exam.Mode,
            exam.StartAtUtc,
            exam.EndAtUtc,
            exam.MaxMark,
            exam.PassingMark,
            exam.IsVisible,
            exam.ShuffleGroups,
            exam.FocusModeEnabled,
            exam.InstructionsMarkdown,
            exam.StudyMaterialsMarkdown,
            [submittedGroup]));

        Assert.NotNull(updated);
        Assert.Contains(updated.Groups[0].Questions, question => question.BodyMarkdown == updatedBody);

        var addedQuestion = Assert.Single(updated.Groups[0].Questions, question => question.BodyMarkdown == newBody);
        Assert.True(addedQuestion.Id > 0);
        Assert.Equal(updated.Groups[0].Id, addedQuestion.GroupId);
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
