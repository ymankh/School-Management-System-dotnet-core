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

    [Fact]
    public void StartOrResumeAttempt_ReturnsExistingAttemptWithSavedProgress()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedExam(store, database.Context, studentId: 42);
        var firstAttempt = store.StartOrResumeAttempt(exam.Id, 42)!;
        var firstQuestionId = Assert.Single(firstAttempt.Questions).QuestionId;

        var saved = store.SaveAnswer(firstAttempt.Id, firstQuestionId, new SaveAnswerRequest("{\"selectedOptionId\":1}", true));
        var resumed = store.StartOrResumeAttempt(exam.Id, 42)!;

        Assert.NotNull(saved);
        Assert.Equal(firstAttempt.Id, resumed.Id);
        Assert.Equal(firstAttempt.Questions.Select(question => question.QuestionId), resumed.Questions.Select(question => question.QuestionId));
        var answer = Assert.Single(resumed.Answers);
        Assert.Equal(firstQuestionId, answer.QuestionId);
        Assert.True(answer.FlaggedForReview);
    }

    [Fact]
    public void SubmittedAttempt_LocksFutureAnswerSaves()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedExam(store, database.Context, studentId: 7);
        var attempt = store.StartOrResumeAttempt(exam.Id, 7)!;
        var questionId = Assert.Single(attempt.Questions).QuestionId;

        var submitted = store.SubmitAttempt(attempt.Id);
        var savedAfterSubmit = store.SaveAnswer(attempt.Id, questionId, new SaveAnswerRequest("{\"selectedOptionId\":1}", false));

        Assert.NotNull(submitted);
        Assert.Null(savedAfterSubmit);
        Assert.False(store.CanSaveAnswer(attempt.Id, questionId));
    }

    [Fact]
    public void ExpiredAttempt_LocksFutureAnswerSaves()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedExam(store, database.Context, studentId: 8);
        var attempt = store.StartOrResumeAttempt(exam.Id, 8)!;
        var questionId = Assert.Single(attempt.Questions).QuestionId;

        var expired = store.SubmitAttempt(attempt.Id, expired: true);
        var savedAfterExpiry = store.SaveAnswer(attempt.Id, questionId, new SaveAnswerRequest("{\"selectedOptionId\":1}", false));

        Assert.NotNull(expired);
        Assert.Equal(ExamAttemptStatus.Expired, expired.Status);
        Assert.Null(savedAfterExpiry);
        Assert.False(store.CanSaveAnswer(attempt.Id, questionId));
    }

    [Fact]
    public void SubmittedAttempt_LocksFileUploadMetadataSaves()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedFileUploadExam(store, database.Context, studentId: 9);
        var attempt = store.StartOrResumeAttempt(exam.Id, 9)!;
        var questionId = Assert.Single(attempt.Questions).QuestionId;
        var rule = store.GetFileUploadRule(attempt.Id, questionId);

        store.SubmitAttempt(attempt.Id);
        var uploadAfterSubmit = store.SaveAttemptFileMetadata(
            attempt.Id,
            questionId,
            "answer.pdf",
            "application/pdf",
            1024,
            "/uploads/answer.pdf");

        Assert.NotNull(rule);
        Assert.Contains("application/pdf", rule.AcceptedContentTypes);
        Assert.Null(uploadAfterSubmit);
    }

    [Fact]
    public void AttemptDto_HidesMarksAndFeedbackUntilMarksArePublished()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedExam(store, database.Context, studentId: 10);
        var attempt = store.StartOrResumeAttempt(exam.Id, 10)!;
        var questionId = Assert.Single(attempt.Questions).QuestionId;
        var correctOptionId = store.GetExam(exam.Id)!
            .Groups
            .SelectMany(group => group.Questions)
            .Single(question => question.Id == questionId)
            .Options
            .Single(option => option.IsCorrect)
            .Id;

        store.SaveAnswer(attempt.Id, questionId, new SaveAnswerRequest($"{{\"selectedOptionId\":{correctOptionId}}}", false));
        var submitted = store.SubmitAttempt(attempt.Id)!;
        var hidden = ExamEngineStore.ToAttemptDto(submitted, includeMarks: false);

        var publishedExam = store.PublishMarks(exam.Id)!;
        var publishedAttempt = store.GetStudentAttempt(exam.Id, 10)!;
        var visible = ExamEngineStore.ToAttemptDto(publishedAttempt, includeMarks: publishedExam.MarkPublished);

        Assert.Equal(0, hidden.TotalMark);
        var hiddenAnswer = Assert.Single(hidden.Answers);
        Assert.Equal(0, hiddenAnswer.AwardedMark);
        Assert.Equal(GradingStatus.NotGraded, hiddenAnswer.GradingStatus);

        Assert.Equal(1, visible.TotalMark);
        var visibleAnswer = Assert.Single(visible.Answers);
        Assert.Equal(1, visibleAnswer.AwardedMark);
        Assert.Equal(GradingStatus.AutoGraded, visibleAnswer.GradingStatus);
    }

    [Fact]
    public void RandomizedAttempts_PreserveEachDeliveredOrderOnResume()
    {
        using var database = CreateDatabase();
        var store = new ExamEngineStore(database.Context);
        var exam = CreatePublishedAssignedMultiQuestionExam(store, database.Context, [21, 22]);

        var firstAttempt = store.StartOrResumeAttempt(exam.Id, 21)!;
        var secondAttempt = store.StartOrResumeAttempt(exam.Id, 22)!;
        var firstOrder = firstAttempt.Questions.OrderBy(question => question.DeliveredOrder).Select(question => question.QuestionId).ToList();
        var secondOrder = secondAttempt.Questions.OrderBy(question => question.DeliveredOrder).Select(question => question.QuestionId).ToList();

        var firstResumed = store.StartOrResumeAttempt(exam.Id, 21)!;
        var secondResumed = store.StartOrResumeAttempt(exam.Id, 22)!;

        Assert.NotEqual(firstAttempt.Id, secondAttempt.Id);
        Assert.Equal(3, firstOrder.Count);
        Assert.Equal(3, secondOrder.Count);
        Assert.Equal(firstOrder, firstResumed.Questions.OrderBy(question => question.DeliveredOrder).Select(question => question.QuestionId));
        Assert.Equal(secondOrder, secondResumed.Questions.OrderBy(question => question.DeliveredOrder).Select(question => question.QuestionId));
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

    private static Exam CreatePublishedAssignedExam(ExamEngineStore store, ApplicationDbContext context, int studentId)
    {
        var start = DateTime.UtcNow.AddMinutes(-5);
        var exam = store.CreateExam(new CreateExamRequest(
            "Autosave Algebra",
            10,
            "Mathematics",
            "Grade 10 - A",
            "Dr. Noether",
            ExamMode.Online,
            start,
            start.AddHours(1),
            10,
            5,
            "Instructions"));
        var group = store.AddGroup(exam.Id, new CreateQuestionGroupRequest(
            "Core",
            string.Empty,
            "show-all",
            null,
            true))!;
        store.AddQuestion(group.Id, new CreateQuestionRequest(
            QuestionType.MultipleChoice,
            "Solve $x + 1 = 2$",
            string.Empty,
            1,
            true,
            "Easy",
            ["algebra"],
            "auto",
            true,
            [
                new QuestionOptionDto(1, "1", true, 1),
                new QuestionOptionDto(2, "2", false, 2)
            ],
            [],
            [],
            [],
            null));

        context.ExamStudentAssignments.Add(new ExamStudentAssignment { ExamId = exam.Id, StudentId = studentId });
        context.SaveChanges();
        return store.PublishExam(exam.Id)!;
    }

    private static Exam CreatePublishedAssignedFileUploadExam(ExamEngineStore store, ApplicationDbContext context, int studentId)
    {
        var start = DateTime.UtcNow.AddMinutes(-5);
        var exam = store.CreateExam(new CreateExamRequest(
            "Portfolio Upload",
            11,
            "Art",
            "Grade 10 - A",
            "Ms. Kahlo",
            ExamMode.Online,
            start,
            start.AddHours(1),
            10,
            5,
            "Instructions"));
        var group = store.AddGroup(exam.Id, new CreateQuestionGroupRequest(
            "Submission",
            string.Empty,
            "show-all",
            null,
            false))!;
        store.AddQuestion(group.Id, new CreateQuestionRequest(
            QuestionType.FileUpload,
            "Upload your response.",
            string.Empty,
            10,
            true,
            "Medium",
            ["portfolio"],
            "manual",
            false,
            [],
            [],
            [],
            [],
            new FileUploadRule
            {
                AcceptedContentTypes = ["application/pdf"],
                MaxSizeBytes = 1_048_576
            }));

        context.ExamStudentAssignments.Add(new ExamStudentAssignment { ExamId = exam.Id, StudentId = studentId });
        context.SaveChanges();
        return store.PublishExam(exam.Id)!;
    }

    private static Exam CreatePublishedAssignedMultiQuestionExam(
        ExamEngineStore store,
        ApplicationDbContext context,
        IReadOnlyList<int> studentIds)
    {
        var start = DateTime.UtcNow.AddMinutes(-5);
        var exam = store.CreateExam(new CreateExamRequest(
            "Randomized Algebra",
            12,
            "Mathematics",
            "Grade 10 - A",
            "Dr. Noether",
            ExamMode.Online,
            start,
            start.AddHours(1),
            10,
            5,
            "Instructions"));
        exam.ShuffleGroups = true;
        var group = store.AddGroup(exam.Id, new CreateQuestionGroupRequest(
            "Core",
            string.Empty,
            "show-all",
            null,
            true))!;

        for (var index = 1; index <= 3; index++)
        {
            store.AddQuestion(group.Id, new CreateQuestionRequest(
                QuestionType.MultipleChoice,
                $"Question {index}",
                string.Empty,
                1,
                true,
                "Easy",
                ["algebra"],
                "auto",
                true,
                [
                    new QuestionOptionDto(0, "Correct", true, 1),
                    new QuestionOptionDto(0, "Distractor", false, 2)
                ],
                [],
                [],
                [],
                null));
        }

        foreach (var studentId in studentIds)
        {
            context.ExamStudentAssignments.Add(new ExamStudentAssignment { ExamId = exam.Id, StudentId = studentId });
        }

        context.SaveChanges();
        return store.PublishExam(exam.Id)!;
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
