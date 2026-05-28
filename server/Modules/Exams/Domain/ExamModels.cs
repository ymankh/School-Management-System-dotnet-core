namespace SchoolSystemTask.Modules.Exams.Domain;

public enum ExamMode
{
    Online,
    Paper,
    Mixed
}

public enum ExamStatus
{
    Draft,
    Scheduled,
    Active,
    Completed,
    Archived
}

public enum ExamAttemptStatus
{
    InProgress,
    Submitted,
    Expired,
    PartiallyGraded,
    Graded,
    MarksPublished
}

public enum QuestionType
{
    MultipleChoice,
    TrueFalse,
    ShortAnswer,
    Article,
    FileUpload,
    Matching,
    Ordering,
    FillInTheBlank
}

public enum GradingStatus
{
    NotGraded,
    AutoGraded,
    NeedsManualGrading,
    PartiallyGraded,
    Graded
}

public sealed class Exam
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ClassSubjectId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ExamMode Mode { get; set; }
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public int MaxMark { get; set; }
    public int PassingMark { get; set; }
    public bool IsVisible { get; set; }
    public bool IsPublished { get; set; }
    public bool MarkPublished { get; set; }
    public ExamStatus Status { get; set; }
    public bool ShuffleGroups { get; set; }
    public bool FocusModeEnabled { get; set; }
    public string InstructionsMarkdown { get; set; } = string.Empty;
    public string StudyMaterialsMarkdown { get; set; } = string.Empty;
    public List<QuestionGroup> Groups { get; set; } = [];
    public List<ExamAttachment> Attachments { get; set; } = [];
}

public sealed class QuestionGroup
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string InstructionsMarkdown { get; set; } = string.Empty;
    public int AuthoringOrder { get; set; }
    public string SelectionPolicy { get; set; } = string.Empty;
    public int? QuestionsToShow { get; set; }
    public bool ShuffleQuestions { get; set; }
    public List<ExamQuestion> Questions { get; set; } = [];
}

public sealed class ExamQuestion
{
    public int Id { get; set; }
    public int? GroupId { get; set; }
    public QuestionType Type { get; set; }
    public string BodyMarkdown { get; set; } = string.Empty;
    public string ReferenceMarkdown { get; set; } = string.Empty;
    public decimal Mark { get; set; }
    public int AuthoringOrder { get; set; }
    public bool IsRequired { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string GradingRule { get; set; } = string.Empty;
    public bool ShuffleOptions { get; set; }
    public List<QuestionOption> Options { get; set; } = [];
    public List<QuestionMatchPair> MatchPairs { get; set; } = [];
    public List<string> OrderingItems { get; set; } = [];
    public List<string> AcceptedAnswers { get; set; } = [];
    public FileUploadRule? FileUploadRule { get; set; }
}

public sealed class QuestionOption
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string TextMarkdown { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int AuthoringOrder { get; set; }
}

public sealed class QuestionMatchPair
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string LeftMarkdown { get; set; } = string.Empty;
    public string RightMarkdown { get; set; } = string.Empty;
    public int AuthoringOrder { get; set; }
}

public sealed class FileUploadRule
{
    public List<string> AcceptedContentTypes { get; set; } = [];
    public long MaxSizeBytes { get; set; }
}

public sealed class ExamAttachment
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public sealed class SubjectSkill
{
    public int Id { get; set; }
    public int ClassSubjectId { get; set; }
    public int SubjectId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DescriptionMarkdown { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public sealed class ExamStudentAssignment
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int StudentId { get; set; }
}

public sealed class ExamAttempt
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int StudentId { get; set; }
    public ExamAttemptStatus Status { get; set; } = ExamAttemptStatus.InProgress;
    public DateTime StartedAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public decimal TotalMark { get; set; }
    public List<AttemptQuestion> Questions { get; set; } = [];
    public List<StudentAnswer> Answers { get; set; } = [];
}

public sealed class AttemptQuestion
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public int DeliveredOrder { get; set; }
    public List<int> DeliveredOptionOrder { get; set; } = [];
}

public sealed class StudentAnswer
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public string AnswerJson { get; set; } = "{}";
    public decimal AwardedMark { get; set; }
    public GradingStatus GradingStatus { get; set; }
    public bool FlaggedForReview { get; set; }
    public DateTime SavedAtUtc { get; set; }
    public string TeacherFeedback { get; set; } = string.Empty;
}

public sealed class QuestionBankItem
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public ExamQuestion Question { get; set; } = new();
}
