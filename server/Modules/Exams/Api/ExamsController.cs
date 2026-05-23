using Microsoft.AspNetCore.Mvc;
using SchoolSystemTask.Modules.Exams.Application;
using SchoolSystemTask.Modules.Exams.DTOs;

namespace SchoolSystemTask.Modules.Exams.Api;

[ApiController]
[Route("api")]
public sealed class ExamsController(ExamEngineStore store, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet("exams")]
    public IActionResult GetDashboard([FromQuery] string? status, [FromQuery] string? search)
    {
        return Ok(store.GetDashboard(status, search));
    }

    [HttpGet("students/me/exams")]
    public IActionResult GetStudentExams([FromQuery] int studentId = 1)
    {
        return Ok(store.GetStudentExams(studentId));
    }

    [HttpGet("exams/{id:int}")]
    public IActionResult GetExam(int id)
    {
        var exam = store.GetExam(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams")]
    public IActionResult CreateExam(CreateExamRequest request)
    {
        var exam = store.CreateExam(request);
        return CreatedAtAction(nameof(GetExam), new { id = exam.Id }, exam);
    }

    [HttpPut("exams/{id:int}")]
    public IActionResult UpdateExam(int id, UpdateExamRequest request)
    {
        var exam = store.UpdateExam(id, request);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams/{id:int}/groups")]
    public IActionResult AddGroup(int id, CreateQuestionGroupRequest request)
    {
        var group = store.AddGroup(id, request);
        return group is null ? NotFound() : Ok(group);
    }

    [HttpPut("groups/{groupId:int}")]
    public IActionResult UpdateGroup(int groupId, UpdateQuestionGroupRequest request)
    {
        var group = store.UpdateGroup(groupId, request);
        return group is null ? NotFound() : Ok(group);
    }

    [HttpPost("groups/{groupId:int}/questions")]
    public IActionResult AddQuestion(int groupId, CreateQuestionRequest request)
    {
        var question = store.AddQuestion(groupId, request);
        return question is null ? NotFound() : Ok(question);
    }

    [HttpPost("exams/{id:int}/questions/import-from-bank")]
    public IActionResult ImportFromBank(int id, ImportFromBankRequest request)
    {
        var questions = store.ImportQuestionsFromBank(id, request);
        return questions is null ? NotFound() : Ok(questions);
    }

    [HttpPost("exams/{id:int}/attachments")]
    public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
    {
        if (store.GetExam(id) is null)
        {
            return NotFound();
        }

        if (file.Length == 0)
        {
            return BadRequest(new { error = "Uploaded file is empty." });
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { error = "File size cannot exceed 10MB." });
        }

        var upload = await SaveUploadAsync(file, Path.Combine("exam-attachments", id.ToString()));
        var attachment = store.AddExamAttachment(id, upload.FileName, upload.ContentType, upload.SizeBytes, upload.Url);
        if (attachment is null)
        {
            return NotFound();
        }

        return Ok(new FileUploadResponse(
            upload.FileName,
            upload.ContentType,
            upload.SizeBytes,
            upload.Url,
            DateTime.UtcNow));
    }

    [HttpPost("exams/{id:int}/preview")]
    public IActionResult PreviewExam(int id)
    {
        var exam = store.GetExam(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams/{id:int}/publish")]
    public IActionResult PublishExam(int id)
    {
        var exam = store.PublishExam(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams/{id:int}/archive")]
    public IActionResult ArchiveExam(int id)
    {
        var exam = store.ArchiveExam(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams/{id:int}/duplicate")]
    public IActionResult DuplicateExam(int id)
    {
        var exam = store.DuplicateExam(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams/{id:int}/attempts")]
    public IActionResult StartAttempt(int id, StartAttemptRequest request)
    {
        var attempt = store.StartOrResumeAttempt(id, request.StudentId);
        return attempt is null ? NotFound() : Ok(ExamEngineStore.ToAttemptDto(attempt));
    }

    [HttpPut("attempts/{attemptId:int}/answers/{questionId:int}")]
    public IActionResult SaveAnswer(int attemptId, int questionId, SaveAnswerRequest request)
    {
        var answer = store.SaveAnswer(attemptId, questionId, request);
        return answer is null ? NotFound() : Ok(ExamEngineStore.ToAnswerDto(answer));
    }

    [HttpPost("attempts/{attemptId:int}/answers/{questionId:int}/files")]
    public async Task<IActionResult> UploadAttemptFile(int attemptId, int questionId, IFormFile file)
    {
        if (!store.CanSaveAnswer(attemptId, questionId))
        {
            return NotFound();
        }

        if (file.Length == 0)
        {
            return BadRequest(new { error = "Uploaded file is empty." });
        }

        var allowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "application/pdf"
        };

        if (!allowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { error = "Only JPG, PNG, and PDF files are accepted." });
        }

        const long maxSizeBytes = 10 * 1024 * 1024;
        if (file.Length > maxSizeBytes)
        {
            return BadRequest(new { error = "File size cannot exceed 10MB." });
        }

        var upload = await SaveUploadAsync(file, Path.Combine("attempt-files", attemptId.ToString(), questionId.ToString()));
        var saved = store.SaveAttemptFileMetadata(
            attemptId,
            questionId,
            upload.FileName,
            upload.ContentType,
            upload.SizeBytes,
            upload.Url);

        return saved is null ? NotFound() : Ok(saved);
    }

    [HttpPost("attempts/{attemptId:int}/submit")]
    public IActionResult SubmitAttempt(int attemptId, [FromQuery] bool expired = false)
    {
        var attempt = store.SubmitAttempt(attemptId, expired);
        if (attempt is null)
        {
            return NotFound();
        }

        var exam = store.GetExam(attempt.ExamId);
        return Ok(ExamEngineStore.ToAttemptDto(attempt, exam?.MarkPublished == true));
    }

    [HttpGet("exams/{id:int}/grading")]
    public IActionResult GetGrading(int id)
    {
        var answers = store.GetGradingAnswers(id);
        return answers is null ? NotFound() : Ok(answers.Select(ExamEngineStore.ToAnswerDto));
    }

    [HttpPut("answers/{answerId:int}/grade")]
    public IActionResult GradeAnswer(int answerId, GradeAnswerRequest request)
    {
        var answer = store.GradeAnswer(answerId, request);
        return answer is null ? NotFound() : Ok(ExamEngineStore.ToAnswerDto(answer));
    }

    [HttpPost("exams/{id:int}/publish-marks")]
    public IActionResult PublishMarks(int id)
    {
        var exam = store.PublishMarks(id);
        return exam is null ? NotFound() : Ok(exam);
    }

    private async Task<StoredUpload> SaveUploadAsync(IFormFile file, string relativeFolder)
    {
        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var uploadRoot = Path.Combine(webRoot, "uploads", relativeFolder);
        Directory.CreateDirectory(uploadRoot);

        var safeExtension = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}{safeExtension}";
        var fullPath = Path.Combine(uploadRoot, storedFileName);

        await using var stream = System.IO.File.Create(fullPath);
        await file.CopyToAsync(stream);

        return new StoredUpload(
            file.FileName,
            file.ContentType,
            file.Length,
            $"/uploads/{relativeFolder.Replace('\\', '/')}/{storedFileName}");
    }

    private sealed record StoredUpload(string FileName, string ContentType, long SizeBytes, string Url);
}
