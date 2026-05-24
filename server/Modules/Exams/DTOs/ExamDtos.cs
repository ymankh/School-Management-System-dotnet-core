using SchoolSystemTask.Modules.Exams.Domain;

namespace SchoolSystemTask.Modules.Exams.DTOs;

public sealed record ExamSummaryDto(
    int Id,
    string Title,
    string Subject,
    string ClassName,
    string TeacherName,
    ExamMode Mode,
    ExamStatus Status,
    DateTime StartAtUtc,
    DateTime EndAtUtc,
    int MaxMark,
    bool IsVisible,
    bool IsPublished,
    bool MarkPublished,
    int QuestionCount,
    int SubmissionCount);

public sealed record ExamDashboardDto(
    int ActiveExams,
    int Drafts,
    int Submissions,
    decimal AverageScore,
    IReadOnlyList<ExamSummaryDto> Exams);

public sealed record CreateExamRequest(
    string Title,
    int ClassSubjectId,
    string Subject,
    string ClassName,
    string TeacherName,
    ExamMode Mode,
    DateTime StartAtUtc,
    DateTime EndAtUtc,
    int MaxMark,
    int PassingMark,
    string InstructionsMarkdown);

public sealed record UpdateExamRequest(
    string Title,
    ExamMode Mode,
    DateTime StartAtUtc,
    DateTime EndAtUtc,
    int MaxMark,
    int PassingMark,
    bool IsVisible,
    bool ShuffleGroups,
    bool FocusModeEnabled,
    string InstructionsMarkdown,
    string StudyMaterialsMarkdown,
    IReadOnlyList<QuestionGroup>? Groups = null);

public sealed record CreateQuestionGroupRequest(
    string Title,
    string InstructionsMarkdown,
    string SelectionPolicy,
    int? QuestionsToShow,
    bool ShuffleQuestions);

public sealed record UpdateQuestionGroupRequest(
    string Title,
    string InstructionsMarkdown,
    string SelectionPolicy,
    int? QuestionsToShow,
    bool ShuffleQuestions);

public sealed record CreateQuestionRequest(
    QuestionType Type,
    string BodyMarkdown,
    string ReferenceMarkdown,
    decimal Mark,
    bool IsRequired,
    string Difficulty,
    IReadOnlyList<string> Tags,
    string GradingRule,
    bool ShuffleOptions,
    IReadOnlyList<QuestionOptionDto> Options,
    IReadOnlyList<QuestionMatchPairDto> MatchPairs,
    IReadOnlyList<string> OrderingItems,
    IReadOnlyList<string> AcceptedAnswers,
    FileUploadRule? FileUploadRule);

public sealed record CreateQuestionBankItemRequest(
    string Subject,
    string OwnerName,
    CreateQuestionRequest Question);

public sealed record QuestionOptionDto(int Id, string TextMarkdown, bool IsCorrect, int AuthoringOrder);

public sealed record QuestionMatchPairDto(int Id, string LeftMarkdown, string RightMarkdown, int AuthoringOrder);

public sealed record ImportFromBankRequest(int GroupId, IReadOnlyList<int> QuestionBankItemIds);

public sealed record StartAttemptRequest(int StudentId);

public sealed record SaveAnswerRequest(string AnswerJson, bool FlaggedForReview);

public sealed record GradeAnswerRequest(decimal AwardedMark, string TeacherFeedback);

public sealed record ExamAttemptDto(
    int Id,
    int ExamId,
    int StudentId,
    ExamAttemptStatus Status,
    DateTime StartedAtUtc,
    DateTime? SubmittedAtUtc,
    decimal TotalMark,
    IReadOnlyList<AttemptQuestionDto> Questions,
    IReadOnlyList<StudentAnswerDto> Answers);

public sealed record AttemptQuestionDto(int QuestionId, int DeliveredOrder, IReadOnlyList<int> DeliveredOptionOrder);

public sealed record StudentAnswerDto(
    int Id,
    int QuestionId,
    string AnswerJson,
    decimal AwardedMark,
    GradingStatus GradingStatus,
    bool FlaggedForReview,
    DateTime SavedAtUtc,
    string TeacherFeedback);

public sealed record FileUploadResponse(
    string FileName,
    string ContentType,
    long SizeBytes,
    string Url,
    DateTime UploadedAtUtc);
