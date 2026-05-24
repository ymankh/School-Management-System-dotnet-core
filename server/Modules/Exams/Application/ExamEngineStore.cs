using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.Exams.Domain;
using SchoolSystemTask.Modules.Exams.DTOs;

namespace SchoolSystemTask.Modules.Exams.Application;

public sealed class ExamEngineStore(ApplicationDbContext db)
{
    public ExamDashboardDto GetDashboard(
        string? status = null,
        string? search = null,
        string? className = null,
        string? subject = null,
        string? date = null,
        string? mode = null)
    {
        var exams = QueryExams(asTracking: false).ToList().AsEnumerable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ExamStatus>(status, true, out var parsedStatus))
        {
            exams = exams.Where(exam => exam.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            exams = exams.Where(exam =>
                exam.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                exam.Subject.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                exam.ClassName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                exam.TeacherName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(className))
        {
            exams = exams.Where(exam => exam.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(subject))
        {
            exams = exams.Where(exam => exam.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(mode) && Enum.TryParse<ExamMode>(mode, true, out var parsedMode))
        {
            exams = exams.Where(exam => exam.Mode == parsedMode);
        }

        exams = ApplyDateFilter(exams, date);

        var filteredExams = exams.OrderByDescending(exam => exam.StartAtUtc).ToList();
        var submittedAttempts = db.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.Status != ExamAttemptStatus.InProgress)
            .ToList();

        return new ExamDashboardDto(
            db.Exams.Count(exam => exam.Status == ExamStatus.Active),
            db.Exams.Count(exam => exam.Status == ExamStatus.Draft),
            submittedAttempts.Count,
            submittedAttempts.Count == 0 ? 0 : submittedAttempts.Average(attempt => attempt.TotalMark),
            filteredExams.Select(exam => ToSummary(exam, CountSubmittedAttempts(exam.Id))).ToList());
    }

    public IReadOnlyList<ExamSummaryDto> GetStudentExams(int studentId)
    {
        var assignedExamIds = db.ExamStudentAssignments
            .AsNoTracking()
            .Where(assignment => assignment.StudentId == studentId)
            .Select(assignment => assignment.ExamId)
            .ToHashSet();
        var attemptedExamIds = db.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.StudentId == studentId)
            .Select(attempt => attempt.ExamId)
            .ToHashSet();

        return QueryExams(asTracking: false)
            .Where(exam => exam.IsVisible && exam.IsPublished && exam.Status != ExamStatus.Archived)
            .Where(exam => assignedExamIds.Contains(exam.Id) || attemptedExamIds.Contains(exam.Id))
            .OrderBy(exam => exam.StartAtUtc)
            .AsEnumerable()
            .Select(exam => ToSummary(exam, CountSubmittedAttempts(exam.Id)))
            .ToList();
    }

    public Exam? GetExam(int id)
    {
        return QueryExams(asTracking: false).FirstOrDefault(exam => exam.Id == id);
    }

    public Exam CreateExam(CreateExamRequest request)
    {
        var exam = new Exam
        {
            Title = request.Title,
            ClassSubjectId = request.ClassSubjectId,
            Subject = request.Subject,
            ClassName = request.ClassName,
            TeacherName = request.TeacherName,
            Mode = request.Mode,
            StartAtUtc = request.StartAtUtc,
            EndAtUtc = request.EndAtUtc,
            MaxMark = request.MaxMark,
            PassingMark = request.PassingMark,
            Status = ExamStatus.Draft,
            InstructionsMarkdown = request.InstructionsMarkdown,
            IsVisible = false,
            IsPublished = false
        };

        db.Exams.Add(exam);
        db.SaveChanges();
        return exam;
    }

    public Exam? UpdateExam(int id, UpdateExamRequest request)
    {
        var exam = QueryExams(asTracking: true).FirstOrDefault(item => item.Id == id);
        if (exam is null)
        {
            return null;
        }

        exam.Title = request.Title;
        exam.Mode = request.Mode;
        exam.StartAtUtc = request.StartAtUtc;
        exam.EndAtUtc = request.EndAtUtc;
        exam.MaxMark = request.MaxMark;
        exam.PassingMark = request.PassingMark;
        exam.IsVisible = request.IsVisible;
        exam.ShuffleGroups = request.ShuffleGroups;
        exam.FocusModeEnabled = request.FocusModeEnabled;
        exam.InstructionsMarkdown = request.InstructionsMarkdown;
        exam.StudyMaterialsMarkdown = request.StudyMaterialsMarkdown;

        if (request.Groups is not null)
        {
            db.QuestionGroups.RemoveRange(exam.Groups);
            exam.Groups = request.Groups
                .Select((group, index) => NormalizeGroupForExam(id, group, index + 1))
                .ToList();
        }

        db.SaveChanges();
        return QueryExams(asTracking: false).FirstOrDefault(item => item.Id == id);
    }

    public QuestionGroup? AddGroup(int examId, CreateQuestionGroupRequest request)
    {
        var exam = QueryExams(asTracking: true).FirstOrDefault(item => item.Id == examId);
        if (exam is null)
        {
            return null;
        }

        var group = new QuestionGroup
        {
            ExamId = examId,
            Title = request.Title,
            InstructionsMarkdown = request.InstructionsMarkdown,
            SelectionPolicy = request.SelectionPolicy,
            QuestionsToShow = request.QuestionsToShow,
            ShuffleQuestions = request.ShuffleQuestions,
            AuthoringOrder = exam.Groups.Count + 1
        };

        exam.Groups.Add(group);
        db.SaveChanges();
        return group;
    }

    public QuestionGroup? UpdateGroup(int groupId, UpdateQuestionGroupRequest request)
    {
        var group = db.QuestionGroups.FirstOrDefault(item => item.Id == groupId);
        if (group is null)
        {
            return null;
        }

        group.Title = request.Title;
        group.InstructionsMarkdown = request.InstructionsMarkdown;
        group.SelectionPolicy = request.SelectionPolicy;
        group.QuestionsToShow = request.QuestionsToShow;
        group.ShuffleQuestions = request.ShuffleQuestions;
        db.SaveChanges();
        return group;
    }

    public ExamQuestion? AddQuestion(int groupId, CreateQuestionRequest request)
    {
        var group = db.QuestionGroups
            .Include(item => item.Questions)
            .FirstOrDefault(item => item.Id == groupId);
        if (group is null)
        {
            return null;
        }

        var question = CreateQuestionFromRequest(groupId, group.Questions.Count + 1, request);
        group.Questions.Add(question);
        db.SaveChanges();
        return question;
    }

    public IReadOnlyList<ExamQuestion>? ImportQuestionsFromBank(int examId, ImportFromBankRequest request)
    {
        var exam = QueryExams(asTracking: true).FirstOrDefault(item => item.Id == examId);
        var group = exam?.Groups.FirstOrDefault(item => item.Id == request.GroupId);
        if (group is null)
        {
            return null;
        }

        var bankItems = QueryQuestionBank(asTracking: false)
            .Where(item => request.QuestionBankItemIds.Contains(item.Id))
            .ToList();
        var nextOrder = group.Questions.Count + 1;
        var imported = bankItems
            .Select(item => CloneQuestion(item.Question, group.Id, nextOrder++))
            .ToList();

        group.Questions.AddRange(imported);
        db.SaveChanges();
        return imported;
    }

    public Exam? PublishExam(int id)
    {
        var exam = db.Exams.FirstOrDefault(item => item.Id == id);
        if (exam is null)
        {
            return null;
        }

        exam.IsPublished = true;
        exam.IsVisible = true;
        exam.Status = exam.StartAtUtc <= DateTime.UtcNow && exam.EndAtUtc >= DateTime.UtcNow
            ? ExamStatus.Active
            : ExamStatus.Scheduled;
        db.SaveChanges();
        return GetExam(id);
    }

    public Exam? ArchiveExam(int id)
    {
        var exam = db.Exams.FirstOrDefault(item => item.Id == id);
        if (exam is null)
        {
            return null;
        }

        exam.Status = ExamStatus.Archived;
        db.SaveChanges();
        return GetExam(id);
    }

    public Exam? DuplicateExam(int id)
    {
        var exam = QueryExams(asTracking: false).FirstOrDefault(item => item.Id == id);
        if (exam is null)
        {
            return null;
        }

        var clone = CloneExam(exam);
        ResetExamIdentity(clone);
        clone.Title = $"{exam.Title} Copy";
        clone.Status = ExamStatus.Draft;
        clone.IsPublished = false;
        clone.IsVisible = false;

        db.Exams.Add(clone);
        db.SaveChanges();
        return clone;
    }

    public ExamAttempt? StartOrResumeAttempt(int examId, int studentId)
    {
        var exam = QueryExams(asTracking: false).FirstOrDefault(item => item.Id == examId);
        if (exam is null || exam.Mode == ExamMode.Paper || !exam.IsPublished || !exam.IsVisible)
        {
            return null;
        }

        var isAssigned = db.ExamStudentAssignments.Any(assignment => assignment.ExamId == examId && assignment.StudentId == studentId);
        if (!isAssigned)
        {
            return null;
        }

        var existing = QueryAttempts(asTracking: false).FirstOrDefault(item =>
            item.ExamId == examId &&
            item.StudentId == studentId &&
            item.Status == ExamAttemptStatus.InProgress);

        if (existing is not null)
        {
            return existing;
        }

        var attempt = new ExamAttempt
        {
            ExamId = examId,
            StudentId = studentId,
            StartedAtUtc = DateTime.UtcNow
        };

        var deliveredQuestions = BuildDeliveredQuestions(exam);
        var order = 1;
        foreach (var question in deliveredQuestions)
        {
            attempt.Questions.Add(new AttemptQuestion
            {
                QuestionId = question.Id,
                DeliveredOrder = order++,
                DeliveredOptionOrder = BuildOptionOrder(question)
            });
        }

        db.ExamAttempts.Add(attempt);
        db.SaveChanges();
        return QueryAttempts(asTracking: false).FirstOrDefault(item => item.Id == attempt.Id);
    }

    public StudentAnswer? SaveAnswer(int attemptId, int questionId, SaveAnswerRequest request)
    {
        var attempt = QueryAttempts(asTracking: true).FirstOrDefault(item => item.Id == attemptId);
        if (attempt is null || attempt.Status != ExamAttemptStatus.InProgress)
        {
            return null;
        }

        if (attempt.Questions.All(item => item.QuestionId != questionId))
        {
            return null;
        }

        var answer = attempt.Answers.FirstOrDefault(item => item.QuestionId == questionId);
        if (answer is null)
        {
            answer = new StudentAnswer
            {
                AttemptId = attemptId,
                QuestionId = questionId
            };
            attempt.Answers.Add(answer);
        }

        answer.AnswerJson = string.IsNullOrWhiteSpace(request.AnswerJson) ? "{}" : request.AnswerJson;
        answer.FlaggedForReview = request.FlaggedForReview;
        answer.SavedAtUtc = DateTime.UtcNow;
        answer.GradingStatus = GradingStatus.NotGraded;
        db.SaveChanges();
        return answer;
    }

    public bool CanSaveAnswer(int attemptId, int questionId)
    {
        return QueryAttempts(asTracking: false).Any(item =>
            item.Id == attemptId &&
            item.Status == ExamAttemptStatus.InProgress &&
            item.Questions.Any(question => question.QuestionId == questionId));
    }

    public ExamAttachment? AddExamAttachment(int examId, string fileName, string contentType, long sizeBytes, string url)
    {
        var exam = QueryExams(asTracking: true).FirstOrDefault(item => item.Id == examId);
        if (exam is null)
        {
            return null;
        }

        var attachment = new ExamAttachment
        {
            ExamId = examId,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            Url = url
        };

        exam.Attachments.Add(attachment);
        db.SaveChanges();
        return attachment;
    }

    public ExamAttempt? SubmitAttempt(int attemptId, bool expired = false)
    {
        var attempt = QueryAttempts(asTracking: true).FirstOrDefault(item => item.Id == attemptId);
        if (attempt is null || attempt.Status != ExamAttemptStatus.InProgress)
        {
            return null;
        }

        attempt.Status = expired ? ExamAttemptStatus.Expired : ExamAttemptStatus.Submitted;
        attempt.SubmittedAtUtc = DateTime.UtcNow;
        EnsureBlankAnswersForDeliveredQuestions(attempt);
        AutoGradeAttempt(attempt);
        if (expired && attempt.Status is ExamAttemptStatus.Graded or ExamAttemptStatus.PartiallyGraded)
        {
            attempt.Status = ExamAttemptStatus.Expired;
        }

        db.SaveChanges();
        return QueryAttempts(asTracking: false).FirstOrDefault(item => item.Id == attemptId);
    }

    public IReadOnlyList<StudentAnswer>? GetGradingAnswers(int examId)
    {
        if (!db.Exams.Any(exam => exam.Id == examId))
        {
            return null;
        }

        return QueryAttempts(asTracking: false)
            .Where(attempt => attempt.ExamId == examId)
            .SelectMany(attempt => attempt.Answers)
            .OrderBy(answer => answer.QuestionId)
            .ToList();
    }

    public StudentAnswer? GradeAnswer(int answerId, GradeAnswerRequest request)
    {
        var answer = db.StudentAnswers.FirstOrDefault(item => item.Id == answerId);
        if (answer is null)
        {
            return null;
        }

        answer.AwardedMark = request.AwardedMark;
        answer.TeacherFeedback = request.TeacherFeedback;
        answer.GradingStatus = GradingStatus.Graded;

        var attempt = QueryAttempts(asTracking: true).First(item => item.Id == answer.AttemptId);
        attempt.TotalMark = attempt.Answers.Sum(item => item.AwardedMark);
        attempt.Status = attempt.Answers.All(item => item.GradingStatus is GradingStatus.AutoGraded or GradingStatus.Graded)
            ? ExamAttemptStatus.Graded
            : ExamAttemptStatus.PartiallyGraded;

        db.SaveChanges();
        return answer;
    }

    public Exam? PublishMarks(int examId)
    {
        var exam = db.Exams.FirstOrDefault(item => item.Id == examId);
        if (exam is null)
        {
            return null;
        }

        exam.MarkPublished = true;
        foreach (var attempt in db.ExamAttempts.Where(item => item.ExamId == examId && item.Status == ExamAttemptStatus.Graded))
        {
            attempt.Status = ExamAttemptStatus.MarksPublished;
        }

        db.SaveChanges();
        return GetExam(examId);
    }

    public IReadOnlyList<QuestionBankItem> GetQuestionBank(string? subject = null, string? type = null, string? search = null)
    {
        var items = QueryQuestionBank(asTracking: false).ToList().AsEnumerable();

        if (!string.IsNullOrWhiteSpace(subject))
        {
            items = items.Where(item => item.Subject.Equals(subject, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<QuestionType>(type, true, out var parsedType))
        {
            items = items.Where(item => item.Question.Type == parsedType);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            items = items.Where(item =>
                item.Question.BodyMarkdown.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                item.Question.Tags.Any(tag => tag.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        return items.OrderBy(item => item.Subject).ThenBy(item => item.Question.Type).ToList();
    }

    public QuestionBankItem AddQuestionBankItem(CreateQuestionBankItemRequest request)
    {
        var item = new QuestionBankItem
        {
            Subject = request.Subject,
            OwnerName = request.OwnerName,
            Question = CreateQuestionFromRequest(0, 1, request.Question)
        };

        db.QuestionBankItems.Add(item);
        db.SaveChanges();
        return item;
    }

    public FileUploadResponse? SaveAttemptFileMetadata(
        int attemptId,
        int questionId,
        string fileName,
        string contentType,
        long sizeBytes,
        string url)
    {
        var payload = JsonSerializer.Serialize(new
        {
            FileName = fileName,
            ContentType = contentType,
            Length = sizeBytes,
            Url = url,
            State = "uploaded"
        });

        var answer = SaveAnswer(attemptId, questionId, new SaveAnswerRequest(payload, false));
        if (answer is null)
        {
            return null;
        }

        return new FileUploadResponse(
            fileName,
            contentType,
            sizeBytes,
            url,
            DateTime.UtcNow);
    }

    public FileUploadRule? GetFileUploadRule(int attemptId, int questionId)
    {
        var attempt = db.ExamAttempts.AsNoTracking().FirstOrDefault(item => item.Id == attemptId);
        if (attempt is null)
        {
            return null;
        }

        var question = QueryExams(asTracking: false)
            .Where(exam => exam.Id == attempt.ExamId)
            .SelectMany(exam => exam.Groups)
            .SelectMany(group => group.Questions)
            .FirstOrDefault(question => question.Id == questionId && question.Type == QuestionType.FileUpload);

        return question?.FileUploadRule;
    }

    public static ExamSummaryDto ToSummary(Exam exam)
    {
        return ToSummary(exam, 0);
    }

    public static ExamSummaryDto ToSummary(Exam exam, int submissionCount)
    {
        return new ExamSummaryDto(
            exam.Id,
            exam.Title,
            exam.Subject,
            exam.ClassName,
            exam.TeacherName,
            exam.Mode,
            exam.Status,
            exam.StartAtUtc,
            exam.EndAtUtc,
            exam.MaxMark,
            exam.IsVisible,
            exam.IsPublished,
            exam.MarkPublished,
            exam.Groups.Sum(group => group.Questions.Count),
            submissionCount);
    }

    public static ExamAttemptDto ToAttemptDto(ExamAttempt attempt, bool includeMarks = true)
    {
        return new ExamAttemptDto(
            attempt.Id,
            attempt.ExamId,
            attempt.StudentId,
            attempt.Status,
            attempt.StartedAtUtc,
            attempt.SubmittedAtUtc,
            includeMarks ? attempt.TotalMark : 0,
            attempt.Questions
                .OrderBy(question => question.DeliveredOrder)
                .Select(question => new AttemptQuestionDto(question.QuestionId, question.DeliveredOrder, question.DeliveredOptionOrder))
                .ToList(),
            attempt.Answers.Select(answer => ToAnswerDto(answer, includeMarks)).ToList());
    }

    public static StudentAnswerDto ToAnswerDto(StudentAnswer answer, bool includeMarks = true)
    {
        return new StudentAnswerDto(
            answer.Id,
            answer.QuestionId,
            answer.AnswerJson,
            includeMarks ? answer.AwardedMark : 0,
            includeMarks ? answer.GradingStatus : GradingStatus.NotGraded,
            answer.FlaggedForReview,
            answer.SavedAtUtc,
            includeMarks ? answer.TeacherFeedback : string.Empty);
    }

    private IQueryable<Exam> QueryExams(bool asTracking)
    {
        var query = db.Exams
            .Include(exam => exam.Attachments)
            .Include(exam => exam.Groups)
                .ThenInclude(group => group.Questions)
                    .ThenInclude(question => question.Options)
            .Include(exam => exam.Groups)
                .ThenInclude(group => group.Questions)
                    .ThenInclude(question => question.MatchPairs);

        return asTracking ? query : query.AsNoTracking();
    }

    private IQueryable<ExamAttempt> QueryAttempts(bool asTracking)
    {
        var query = db.ExamAttempts
            .Include(attempt => attempt.Questions)
            .Include(attempt => attempt.Answers);

        return asTracking ? query : query.AsNoTracking();
    }

    private IQueryable<QuestionBankItem> QueryQuestionBank(bool asTracking)
    {
        var query = db.QuestionBankItems
            .Include(item => item.Question)
                .ThenInclude(question => question.Options)
            .Include(item => item.Question)
                .ThenInclude(question => question.MatchPairs);

        return asTracking ? query : query.AsNoTracking();
    }

    private int CountSubmittedAttempts(int examId)
    {
        return db.ExamAttempts.Count(attempt => attempt.ExamId == examId && attempt.Status != ExamAttemptStatus.InProgress);
    }

    private ExamQuestion CreateQuestionFromRequest(int groupId, int order, CreateQuestionRequest request)
    {
        return new ExamQuestion
        {
            GroupId = groupId == 0 ? null : groupId,
            Type = request.Type,
            BodyMarkdown = request.BodyMarkdown,
            ReferenceMarkdown = request.ReferenceMarkdown,
            Mark = request.Mark,
            AuthoringOrder = order,
            IsRequired = request.IsRequired,
            Difficulty = request.Difficulty,
            Tags = request.Tags.ToList(),
            GradingRule = request.GradingRule,
            ShuffleOptions = request.ShuffleOptions,
            Options = request.Options.Select((option, index) => new QuestionOption
            {
                TextMarkdown = option.TextMarkdown,
                IsCorrect = option.IsCorrect,
                AuthoringOrder = option.AuthoringOrder == 0 ? index + 1 : option.AuthoringOrder
            }).ToList(),
            MatchPairs = request.MatchPairs.Select((pair, index) => new QuestionMatchPair
            {
                LeftMarkdown = pair.LeftMarkdown,
                RightMarkdown = pair.RightMarkdown,
                AuthoringOrder = pair.AuthoringOrder == 0 ? index + 1 : pair.AuthoringOrder
            }).ToList(),
            OrderingItems = request.OrderingItems.ToList(),
            AcceptedAnswers = request.AcceptedAnswers.ToList(),
            FileUploadRule = request.FileUploadRule
        };
    }

    private QuestionGroup NormalizeGroupForExam(int examId, QuestionGroup source, int order)
    {
        var group = CloneGroup(source);
        group.Id = 0;
        group.ExamId = examId;
        group.AuthoringOrder = order;
        group.Questions = group.Questions
            .Select((question, index) => NormalizeQuestionForGroup(group.Id, question, index + 1))
            .ToList();
        return group;
    }

    private ExamQuestion NormalizeQuestionForGroup(int groupId, ExamQuestion source, int order)
    {
        var question = CloneQuestionDraft(source);
        question.Id = 0;
        question.GroupId = groupId == 0 ? null : groupId;
        question.AuthoringOrder = order;
        question.Options = question.Options
            .Select((option, index) => new QuestionOption
            {
                TextMarkdown = option.TextMarkdown,
                IsCorrect = option.IsCorrect,
                AuthoringOrder = option.AuthoringOrder <= 0 ? index + 1 : option.AuthoringOrder
            })
            .ToList();
        question.MatchPairs = question.MatchPairs
            .Select((pair, index) => new QuestionMatchPair
            {
                LeftMarkdown = pair.LeftMarkdown,
                RightMarkdown = pair.RightMarkdown,
                AuthoringOrder = pair.AuthoringOrder <= 0 ? index + 1 : pair.AuthoringOrder
            })
            .ToList();
        return question;
    }

    private static IEnumerable<Exam> ApplyDateFilter(IEnumerable<Exam> exams, string? date)
    {
        if (string.IsNullOrWhiteSpace(date) || date.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return exams;
        }

        var today = DateTime.UtcNow.Date;
        return date.ToLowerInvariant() switch
        {
            "today" => exams.Where(exam => exam.StartAtUtc.Date == today),
            "upcoming" => exams.Where(exam => exam.StartAtUtc.Date > today),
            "past" => exams.Where(exam => exam.EndAtUtc.Date < today),
            _ => DateTime.TryParse(date, out var parsed)
                ? exams.Where(exam => exam.StartAtUtc.Date == parsed.Date)
                : exams
        };
    }

    private List<ExamQuestion> BuildDeliveredQuestions(Exam exam)
    {
        var groups = exam.Groups.AsEnumerable();
        if (exam.ShuffleGroups)
        {
            groups = groups.OrderBy(_ => Guid.NewGuid());
        }

        var delivered = new List<ExamQuestion>();
        foreach (var group in groups)
        {
            var questions = group.Questions.AsEnumerable();
            if (group.ShuffleQuestions || group.SelectionPolicy == "pick-random")
            {
                questions = questions.OrderBy(_ => Guid.NewGuid());
            }

            if (group.SelectionPolicy == "pick-random" && group.QuestionsToShow is > 0)
            {
                questions = questions.Take(group.QuestionsToShow.Value);
            }

            delivered.AddRange(questions);
        }

        return delivered;
    }

    private static List<int> BuildOptionOrder(ExamQuestion question)
    {
        var optionIds = question.Options.Select(option => option.Id).ToList();
        if (question.Type == QuestionType.Matching)
        {
            optionIds = question.MatchPairs.Select(pair => pair.Id).ToList();
        }

        return question.ShuffleOptions
            ? optionIds.OrderBy(_ => Guid.NewGuid()).ToList()
            : optionIds;
    }

    private void AutoGradeAttempt(ExamAttempt attempt)
    {
        var exam = QueryExams(asTracking: false).First(item => item.Id == attempt.ExamId);
        var questions = exam.Groups.SelectMany(group => group.Questions).ToDictionary(question => question.Id);

        foreach (var answer in attempt.Answers)
        {
            if (!questions.TryGetValue(answer.QuestionId, out var question))
            {
                continue;
            }

            if (question.Type is QuestionType.Article or QuestionType.FileUpload ||
                (question.Type == QuestionType.ShortAnswer && question.GradingRule != "exact-match"))
            {
                answer.GradingStatus = GradingStatus.NeedsManualGrading;
                continue;
            }

            answer.AwardedMark = IsCorrect(question, answer.AnswerJson) ? question.Mark : 0;
            answer.GradingStatus = GradingStatus.AutoGraded;
        }

        attempt.TotalMark = attempt.Answers.Sum(answer => answer.AwardedMark);
        attempt.Status = attempt.Answers.Any(answer => answer.GradingStatus == GradingStatus.NeedsManualGrading)
            ? ExamAttemptStatus.PartiallyGraded
            : ExamAttemptStatus.Graded;
    }

    private void EnsureBlankAnswersForDeliveredQuestions(ExamAttempt attempt)
    {
        foreach (var deliveredQuestion in attempt.Questions)
        {
            if (attempt.Answers.Any(answer => answer.QuestionId == deliveredQuestion.QuestionId))
            {
                continue;
            }

            attempt.Answers.Add(new StudentAnswer
            {
                AttemptId = attempt.Id,
                QuestionId = deliveredQuestion.QuestionId,
                AnswerJson = "{}",
                SavedAtUtc = DateTime.UtcNow,
                GradingStatus = GradingStatus.NotGraded
            });
        }
    }

    private static bool IsCorrect(ExamQuestion question, string answerJson)
    {
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(string.IsNullOrWhiteSpace(answerJson) ? "{}" : answerJson);
        }
        catch (JsonException)
        {
            return false;
        }

        using (document)
        {
            var root = document.RootElement;

            return question.Type switch
            {
                QuestionType.MultipleChoice => root.TryGetProperty("selectedOptionId", out var optionId) &&
                                               question.Options.Any(option => option.Id == optionId.GetInt32() && option.IsCorrect),
                QuestionType.TrueFalse => root.TryGetProperty("value", out var value) &&
                                          question.AcceptedAnswers.Any(answer => bool.TryParse(answer, out var parsed) && parsed == value.GetBoolean()),
                QuestionType.ShortAnswer or QuestionType.FillInTheBlank => root.TryGetProperty("value", out var text) &&
                                          question.AcceptedAnswers.Any(answer => string.Equals(answer.Trim(), text.GetString()?.Trim(), StringComparison.OrdinalIgnoreCase)),
                QuestionType.Ordering => root.TryGetProperty("items", out var items) &&
                                         items.EnumerateArray().Select(item => item.GetString()).SequenceEqual(question.OrderingItems),
                QuestionType.Matching => root.TryGetProperty("pairs", out var pairs) &&
                                         question.MatchPairs.All(pair =>
                                             pairs.TryGetProperty(pair.Id.ToString(), out var selectedRight) &&
                                             string.Equals(selectedRight.GetString(), pair.RightMarkdown, StringComparison.Ordinal)),
                _ => false
            };
        }
    }

    private static Exam CloneExam(Exam source)
    {
        var json = JsonSerializer.Serialize(source);
        return JsonSerializer.Deserialize<Exam>(json) ?? throw new InvalidOperationException("Could not clone exam.");
    }

    private static QuestionGroup CloneGroup(QuestionGroup source)
    {
        var json = JsonSerializer.Serialize(source);
        return JsonSerializer.Deserialize<QuestionGroup>(json) ?? throw new InvalidOperationException("Could not clone question group.");
    }

    private static ExamQuestion CloneQuestionDraft(ExamQuestion source)
    {
        var json = JsonSerializer.Serialize(source);
        return JsonSerializer.Deserialize<ExamQuestion>(json) ?? throw new InvalidOperationException("Could not clone question.");
    }

    private static ExamQuestion CloneQuestion(ExamQuestion source, int groupId, int order)
    {
        var clone = CloneQuestionDraft(source);
        clone.Id = 0;
        clone.GroupId = groupId == 0 ? null : groupId;
        clone.AuthoringOrder = order;
        clone.Options.ForEach(option => option.Id = 0);
        clone.MatchPairs.ForEach(pair => pair.Id = 0);
        return clone;
    }

    private static void ResetExamIdentity(Exam exam)
    {
        exam.Id = 0;
        exam.Attachments = [];
        foreach (var group in exam.Groups)
        {
            group.Id = 0;
            group.ExamId = 0;
            foreach (var question in group.Questions)
            {
                question.Id = 0;
                question.GroupId = 0;
                question.Options.ForEach(option => option.Id = 0);
                question.MatchPairs.ForEach(pair => pair.Id = 0);
            }
        }
    }
}
