using System.Text.Json;
using SchoolSystemTask.Modules.Exams.Domain;
using SchoolSystemTask.Modules.Exams.DTOs;

namespace SchoolSystemTask.Modules.Exams.Application;

public sealed class ExamEngineStore
{
    private readonly object _gate = new();
    private readonly List<Exam> _exams = [];
    private readonly List<ExamAttempt> _attempts = [];
    private readonly List<QuestionBankItem> _questionBank = [];
    private int _nextId = 1000;

    public ExamEngineStore()
    {
        Seed();
    }

    public ExamDashboardDto GetDashboard(string? status = null, string? search = null)
    {
        lock (_gate)
        {
            var exams = _exams.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ExamStatus>(status, true, out var parsedStatus))
            {
                exams = exams.Where(exam => exam.Status == parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                exams = exams.Where(exam =>
                    exam.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    exam.Subject.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    exam.ClassName.Contains(search, StringComparison.OrdinalIgnoreCase));
            }

            var summaries = exams
                .OrderByDescending(exam => exam.StartAtUtc)
                .Select(ToSummary)
                .ToList();

            var submittedAttempts = _attempts.Where(attempt => attempt.Status != ExamAttemptStatus.InProgress).ToList();

            return new ExamDashboardDto(
                _exams.Count(exam => exam.Status == ExamStatus.Active),
                _exams.Count(exam => exam.Status == ExamStatus.Draft),
                submittedAttempts.Count,
                submittedAttempts.Count == 0 ? 0 : submittedAttempts.Average(attempt => attempt.TotalMark),
                summaries);
        }
    }

    public IReadOnlyList<ExamSummaryDto> GetStudentExams(int studentId)
    {
        lock (_gate)
        {
            return _exams
                .Where(exam => exam.IsVisible && exam.IsPublished && exam.Status != ExamStatus.Archived)
                .OrderBy(exam => exam.StartAtUtc)
                .Select(ToSummary)
                .ToList();
        }
    }

    public Exam? GetExam(int id)
    {
        lock (_gate)
        {
            return _exams.FirstOrDefault(exam => exam.Id == id);
        }
    }

    public Exam CreateExam(CreateExamRequest request)
    {
        lock (_gate)
        {
            var exam = new Exam
            {
                Id = NextId(),
                Title = request.Title,
                ClassSubjectId = request.ClassSubjectId,
                Subject = request.Subject,
                ClassName = request.ClassName,
                TeacherName = "Current Teacher",
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

            _exams.Add(exam);
            return exam;
        }
    }

    public Exam? UpdateExam(int id, UpdateExamRequest request)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == id);
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

            return exam;
        }
    }

    public QuestionGroup? AddGroup(int examId, CreateQuestionGroupRequest request)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == examId);
            if (exam is null)
            {
                return null;
            }

            var group = new QuestionGroup
            {
                Id = NextId(),
                ExamId = examId,
                Title = request.Title,
                InstructionsMarkdown = request.InstructionsMarkdown,
                SelectionPolicy = request.SelectionPolicy,
                QuestionsToShow = request.QuestionsToShow,
                ShuffleQuestions = request.ShuffleQuestions,
                AuthoringOrder = exam.Groups.Count + 1
            };

            exam.Groups.Add(group);
            return group;
        }
    }

    public QuestionGroup? UpdateGroup(int groupId, UpdateQuestionGroupRequest request)
    {
        lock (_gate)
        {
            var group = _exams.SelectMany(exam => exam.Groups).FirstOrDefault(item => item.Id == groupId);
            if (group is null)
            {
                return null;
            }

            group.Title = request.Title;
            group.InstructionsMarkdown = request.InstructionsMarkdown;
            group.SelectionPolicy = request.SelectionPolicy;
            group.QuestionsToShow = request.QuestionsToShow;
            group.ShuffleQuestions = request.ShuffleQuestions;
            return group;
        }
    }

    public ExamQuestion? AddQuestion(int groupId, CreateQuestionRequest request)
    {
        lock (_gate)
        {
            var group = _exams.SelectMany(exam => exam.Groups).FirstOrDefault(item => item.Id == groupId);
            if (group is null)
            {
                return null;
            }

            var question = CreateQuestionFromRequest(groupId, group.Questions.Count + 1, request);
            group.Questions.Add(question);
            return question;
        }
    }

    public IReadOnlyList<ExamQuestion>? ImportQuestionsFromBank(int examId, ImportFromBankRequest request)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == examId);
            var group = exam?.Groups.FirstOrDefault(item => item.Id == request.GroupId);
            if (group is null)
            {
                return null;
            }

            var nextOrder = group.Questions.Count + 1;
            var imported = _questionBank
                .Where(item => request.QuestionBankItemIds.Contains(item.Id))
                .Select(item => CloneQuestion(item.Question, group.Id, nextOrder++))
                .ToList();

            group.Questions.AddRange(imported);
            return imported;
        }
    }

    public Exam? PublishExam(int id)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == id);
            if (exam is null)
            {
                return null;
            }

            exam.IsPublished = true;
            exam.IsVisible = true;
            exam.Status = exam.StartAtUtc <= DateTime.UtcNow && exam.EndAtUtc >= DateTime.UtcNow
                ? ExamStatus.Active
                : ExamStatus.Scheduled;
            return exam;
        }
    }

    public Exam? ArchiveExam(int id)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == id);
            if (exam is null)
            {
                return null;
            }

            exam.Status = ExamStatus.Archived;
            return exam;
        }
    }

    public Exam? DuplicateExam(int id)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == id);
            if (exam is null)
            {
                return null;
            }

            var clone = CloneExam(exam);
            clone.Id = NextId();
            clone.Title = $"{exam.Title} Copy";
            clone.Status = ExamStatus.Draft;
            clone.IsPublished = false;
            clone.IsVisible = false;

            foreach (var group in clone.Groups)
            {
                group.Id = NextId();
                group.ExamId = clone.Id;
                foreach (var question in group.Questions)
                {
                    question.Id = NextId();
                    question.GroupId = group.Id;
                    question.Options.ForEach(option => option.Id = NextId());
                    question.MatchPairs.ForEach(pair => pair.Id = NextId());
                }
            }

            _exams.Add(clone);
            return clone;
        }
    }

    public ExamAttempt? StartOrResumeAttempt(int examId, int studentId)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == examId);
            if (exam is null || exam.Mode == ExamMode.Paper || !exam.IsPublished || !exam.IsVisible)
            {
                return null;
            }

            var existing = _attempts.FirstOrDefault(item =>
                item.ExamId == examId &&
                item.StudentId == studentId &&
                item.Status == ExamAttemptStatus.InProgress);

            if (existing is not null)
            {
                return existing;
            }

            var attempt = new ExamAttempt
            {
                Id = NextId(),
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
                    Id = NextId(),
                    AttemptId = attempt.Id,
                    QuestionId = question.Id,
                    DeliveredOrder = order++,
                    DeliveredOptionOrder = BuildOptionOrder(question)
                });
            }

            _attempts.Add(attempt);
            return attempt;
        }
    }

    public StudentAnswer? SaveAnswer(int attemptId, int questionId, SaveAnswerRequest request)
    {
        lock (_gate)
        {
            var attempt = _attempts.FirstOrDefault(item => item.Id == attemptId);
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
                    Id = NextId(),
                    AttemptId = attemptId,
                    QuestionId = questionId
                };
                attempt.Answers.Add(answer);
            }

            answer.AnswerJson = string.IsNullOrWhiteSpace(request.AnswerJson) ? "{}" : request.AnswerJson;
            answer.FlaggedForReview = request.FlaggedForReview;
            answer.SavedAtUtc = DateTime.UtcNow;
            answer.GradingStatus = GradingStatus.NotGraded;
            return answer;
        }
    }

    public bool CanSaveAnswer(int attemptId, int questionId)
    {
        lock (_gate)
        {
            var attempt = _attempts.FirstOrDefault(item => item.Id == attemptId);
            return attempt is not null &&
                   attempt.Status == ExamAttemptStatus.InProgress &&
                   attempt.Questions.Any(item => item.QuestionId == questionId);
        }
    }

    public ExamAttachment? AddExamAttachment(int examId, string fileName, string contentType, long sizeBytes, string url)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == examId);
            if (exam is null)
            {
                return null;
            }

            var attachment = new ExamAttachment
            {
                Id = NextId(),
                ExamId = examId,
                FileName = fileName,
                ContentType = contentType,
                SizeBytes = sizeBytes,
                Url = url
            };

            exam.Attachments.Add(attachment);
            return attachment;
        }
    }

    public ExamAttempt? SubmitAttempt(int attemptId, bool expired = false)
    {
        lock (_gate)
        {
            var attempt = _attempts.FirstOrDefault(item => item.Id == attemptId);
            if (attempt is null)
            {
                return null;
            }

            if (attempt.Status != ExamAttemptStatus.InProgress)
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
            return attempt;
        }
    }

    public IReadOnlyList<StudentAnswer>? GetGradingAnswers(int examId)
    {
        lock (_gate)
        {
            if (_exams.All(exam => exam.Id != examId))
            {
                return null;
            }

            return _attempts
                .Where(attempt => attempt.ExamId == examId)
                .SelectMany(attempt => attempt.Answers)
                .OrderBy(answer => answer.QuestionId)
                .ToList();
        }
    }

    public StudentAnswer? GradeAnswer(int answerId, GradeAnswerRequest request)
    {
        lock (_gate)
        {
            var answer = _attempts.SelectMany(attempt => attempt.Answers).FirstOrDefault(item => item.Id == answerId);
            if (answer is null)
            {
                return null;
            }

            answer.AwardedMark = request.AwardedMark;
            answer.TeacherFeedback = request.TeacherFeedback;
            answer.GradingStatus = GradingStatus.Graded;

            var attempt = _attempts.First(item => item.Id == answer.AttemptId);
            attempt.TotalMark = attempt.Answers.Sum(item => item.AwardedMark);
            attempt.Status = attempt.Answers.All(item => item.GradingStatus is GradingStatus.AutoGraded or GradingStatus.Graded)
                ? ExamAttemptStatus.Graded
                : ExamAttemptStatus.PartiallyGraded;

            return answer;
        }
    }

    public Exam? PublishMarks(int examId)
    {
        lock (_gate)
        {
            var exam = _exams.FirstOrDefault(item => item.Id == examId);
            if (exam is null)
            {
                return null;
            }

            exam.MarkPublished = true;
            foreach (var attempt in _attempts.Where(item => item.ExamId == examId && item.Status == ExamAttemptStatus.Graded))
            {
                attempt.Status = ExamAttemptStatus.MarksPublished;
            }

            return exam;
        }
    }

    public IReadOnlyList<QuestionBankItem> GetQuestionBank(string? subject = null, string? type = null, string? search = null)
    {
        lock (_gate)
        {
            var items = _questionBank.AsEnumerable();

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
    }

    public QuestionBankItem AddQuestionBankItem(CreateQuestionRequest request)
    {
        lock (_gate)
        {
            var item = new QuestionBankItem
            {
                Id = NextId(),
                Subject = "General",
                OwnerName = "Current Teacher",
                Question = CreateQuestionFromRequest(0, 1, request)
            };

            _questionBank.Add(item);
            return item;
        }
    }

    public FileUploadResponse? SaveAttemptFileMetadata(
        int attemptId,
        int questionId,
        string fileName,
        string contentType,
        long sizeBytes,
        string url)
    {
        lock (_gate)
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
    }

    public static ExamSummaryDto ToSummary(Exam exam)
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
            0);
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

    private ExamQuestion CreateQuestionFromRequest(int groupId, int order, CreateQuestionRequest request)
    {
        return new ExamQuestion
        {
            Id = NextId(),
            GroupId = groupId,
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
                Id = option.Id == 0 ? NextId() : option.Id,
                TextMarkdown = option.TextMarkdown,
                IsCorrect = option.IsCorrect,
                AuthoringOrder = option.AuthoringOrder == 0 ? index + 1 : option.AuthoringOrder
            }).ToList(),
            MatchPairs = request.MatchPairs.Select((pair, index) => new QuestionMatchPair
            {
                Id = pair.Id == 0 ? NextId() : pair.Id,
                LeftMarkdown = pair.LeftMarkdown,
                RightMarkdown = pair.RightMarkdown,
                AuthoringOrder = pair.AuthoringOrder == 0 ? index + 1 : pair.AuthoringOrder
            }).ToList(),
            OrderingItems = request.OrderingItems.ToList(),
            AcceptedAnswers = request.AcceptedAnswers.ToList(),
            FileUploadRule = request.FileUploadRule
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
        var exam = _exams.First(item => item.Id == attempt.ExamId);
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
                Id = NextId(),
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

    private Exam CloneExam(Exam source)
    {
        var json = JsonSerializer.Serialize(source);
        return JsonSerializer.Deserialize<Exam>(json) ?? throw new InvalidOperationException("Could not clone exam.");
    }

    private ExamQuestion CloneQuestion(ExamQuestion source, int groupId, int order)
    {
        var json = JsonSerializer.Serialize(source);
        var clone = JsonSerializer.Deserialize<ExamQuestion>(json) ?? throw new InvalidOperationException("Could not clone question.");
        clone.Id = NextId();
        clone.GroupId = groupId;
        clone.AuthoringOrder = order;
        clone.Options.ForEach(option => option.Id = NextId());
        clone.MatchPairs.ForEach(pair => pair.Id = NextId());
        return clone;
    }

    private int NextId()
    {
        return _nextId++;
    }

    private void Seed()
    {
        var exam = new Exam
        {
            Id = 1,
            Title = "Midterm: Algebra and Functions",
            ClassSubjectId = 10,
            Subject = "Mathematics",
            ClassName = "Grade 10 - A",
            TeacherName = "H. Wells",
            Mode = ExamMode.Online,
            StartAtUtc = DateTime.UtcNow.AddHours(-1),
            EndAtUtc = DateTime.UtcNow.AddHours(3),
            MaxMark = 100,
            PassingMark = 50,
            IsVisible = true,
            IsPublished = true,
            Status = ExamStatus.Active,
            ShuffleGroups = true,
            FocusModeEnabled = true,
            InstructionsMarkdown = "Answer all required questions. You may use LaTeX such as `$x^2 + y^2 = z^2$`.",
            StudyMaterialsMarkdown = "Review **quadratic functions** and the formula $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$."
        };

        var coreGroup = new QuestionGroup
        {
            Id = 2,
            ExamId = exam.Id,
            Title = "Core Skills",
            InstructionsMarkdown = "These questions cover essential algebra skills.",
            AuthoringOrder = 1,
            SelectionPolicy = "show-all",
            ShuffleQuestions = true
        };

        coreGroup.Questions.Add(new ExamQuestion
        {
            Id = 3,
            GroupId = coreGroup.Id,
            Type = QuestionType.MultipleChoice,
            BodyMarkdown = "Which expression is equivalent to `$x^2 + 5x + 6$`?",
            Mark = 5,
            AuthoringOrder = 1,
            Difficulty = "Easy",
            Tags = ["factorization", "algebra"],
            GradingRule = "auto",
            ShuffleOptions = true,
            Options =
            [
                new QuestionOption { Id = 4, TextMarkdown = "`(x + 2)(x + 3)`", IsCorrect = true, AuthoringOrder = 1 },
                new QuestionOption { Id = 5, TextMarkdown = "`(x + 1)(x + 6)`", IsCorrect = false, AuthoringOrder = 2 },
                new QuestionOption { Id = 6, TextMarkdown = "`(x - 2)(x - 3)`", IsCorrect = false, AuthoringOrder = 3 }
            ]
        });

        coreGroup.Questions.Add(new ExamQuestion
        {
            Id = 7,
            GroupId = coreGroup.Id,
            Type = QuestionType.TrueFalse,
            BodyMarkdown = "The graph of `$y = x^2$` opens upward.",
            Mark = 3,
            AuthoringOrder = 2,
            Difficulty = "Easy",
            Tags = ["graphs"],
            GradingRule = "auto",
            AcceptedAnswers = ["true"]
        });

        coreGroup.Questions.Add(new ExamQuestion
        {
            Id = 13,
            GroupId = coreGroup.Id,
            Type = QuestionType.ShortAnswer,
            BodyMarkdown = "Write the value of `$f(3)$` for `$f(x)=2x+1$`.",
            Mark = 4,
            AuthoringOrder = 3,
            Difficulty = "Easy",
            Tags = ["functions"],
            GradingRule = "exact-match",
            AcceptedAnswers = ["7"]
        });

        coreGroup.Questions.Add(new ExamQuestion
        {
            Id = 14,
            GroupId = coreGroup.Id,
            Type = QuestionType.FillInTheBlank,
            BodyMarkdown = "Fill in the blank: the vertex of `$y=(x-2)^2+5$` is `(___, ___)`.",
            Mark = 4,
            AuthoringOrder = 4,
            Difficulty = "Medium",
            Tags = ["graphs", "vertex"],
            GradingRule = "exact-match",
            AcceptedAnswers = ["2,5", "(2,5)", "2, 5"]
        });

        var extendedGroup = new QuestionGroup
        {
            Id = 8,
            ExamId = exam.Id,
            Title = "Extended Response",
            InstructionsMarkdown = "Use clear steps and justify your answer.",
            AuthoringOrder = 2,
            SelectionPolicy = "pick-random",
            QuestionsToShow = 2,
            ShuffleQuestions = true
        };

        extendedGroup.Questions.Add(new ExamQuestion
        {
            Id = 9,
            GroupId = extendedGroup.Id,
            Type = QuestionType.Article,
            BodyMarkdown = "Explain how the discriminant `$b^2 - 4ac$` determines the number of roots of a quadratic equation.",
            ReferenceMarkdown = "Reference: a quadratic has form `$ax^2 + bx + c = 0`.",
            Mark = 10,
            AuthoringOrder = 1,
            Difficulty = "Medium",
            Tags = ["quadratics", "essay"],
            GradingRule = "manual"
        });

        extendedGroup.Questions.Add(new ExamQuestion
        {
            Id = 10,
            GroupId = extendedGroup.Id,
            Type = QuestionType.FileUpload,
            BodyMarkdown = "Upload your handwritten solution for solving `$2x^2 - 3x - 2 = 0$`.",
            Mark = 8,
            AuthoringOrder = 2,
            Difficulty = "Medium",
            Tags = ["upload", "quadratics"],
            GradingRule = "manual",
            FileUploadRule = new FileUploadRule
            {
                AcceptedContentTypes = ["image/jpeg", "image/png", "application/pdf"],
                MaxSizeBytes = 10 * 1024 * 1024
            }
        });

        extendedGroup.Questions.Add(new ExamQuestion
        {
            Id = 15,
            GroupId = extendedGroup.Id,
            Type = QuestionType.Matching,
            BodyMarkdown = "Match each expression to its simplified value.",
            Mark = 6,
            AuthoringOrder = 3,
            Difficulty = "Medium",
            Tags = ["matching", "simplification"],
            GradingRule = "auto",
            MatchPairs =
            [
                new QuestionMatchPair { Id = 16, LeftMarkdown = "`2^3`", RightMarkdown = "`8`", AuthoringOrder = 1 },
                new QuestionMatchPair { Id = 17, LeftMarkdown = "`\\sqrt{16}`", RightMarkdown = "`4`", AuthoringOrder = 2 },
                new QuestionMatchPair { Id = 18, LeftMarkdown = "`3^2`", RightMarkdown = "`9`", AuthoringOrder = 3 }
            ]
        });

        extendedGroup.Questions.Add(new ExamQuestion
        {
            Id = 19,
            GroupId = extendedGroup.Id,
            Type = QuestionType.Ordering,
            BodyMarkdown = "Order the steps for solving `$x^2 + 5x + 6 = 0$`.",
            Mark = 6,
            AuthoringOrder = 4,
            Difficulty = "Medium",
            Tags = ["ordering", "quadratics"],
            GradingRule = "auto",
            OrderingItems =
            [
                "Factor the expression",
                "Set each factor equal to zero",
                "Solve each linear equation",
                "Write the two roots"
            ]
        });

        exam.Groups.Add(coreGroup);
        exam.Groups.Add(extendedGroup);
        _exams.Add(exam);

        _questionBank.Add(new QuestionBankItem
        {
            Id = 11,
            Subject = "Mathematics",
            OwnerName = "H. Wells",
            Question = coreGroup.Questions[0]
        });

        _questionBank.Add(new QuestionBankItem
        {
            Id = 12,
            Subject = "Mathematics",
            OwnerName = "H. Wells",
            Question = extendedGroup.Questions[0]
        });
    }
}
