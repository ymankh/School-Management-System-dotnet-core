using Microsoft.AspNetCore.Mvc;
using SchoolSystemTask.Modules.Exams.Application;
using SchoolSystemTask.Modules.Exams.DTOs;

namespace SchoolSystemTask.Modules.Exams.Api;

[ApiController]
[Route("api/question-bank")]
public sealed class QuestionBankController(ExamEngineStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetQuestionBank([FromQuery] string? subject, [FromQuery] string? type, [FromQuery] string? search)
    {
        return Ok(store.GetQuestionBank(subject, type, search));
    }

    [HttpPost]
    public IActionResult AddQuestionBankItem(CreateQuestionRequest request)
    {
        return Ok(store.AddQuestionBankItem(request));
    }
}
