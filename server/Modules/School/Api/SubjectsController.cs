using Microsoft.AspNetCore.Mvc;
using SchoolSystemTask.Data;
using SchoolSystemTask.Modules.School.Domain;
using SchoolSystemTask.Modules.School.DTOs;

namespace SchoolSystemTask.Modules.School.Api;

[ApiController]
[Route("api/subjects")]
public sealed class SubjectsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult GetSubjects(string? search = null, bool includeInactive = false)
    {
        var subjects = db.Subjects.AsQueryable();

        if (!includeInactive)
        {
            subjects = subjects.Where(subject => subject.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            subjects = subjects.Where(subject =>
                subject.Name.ToLower().Contains(normalizedSearch) ||
                subject.Code.ToLower().Contains(normalizedSearch));
        }

        return Ok(subjects
            .OrderBy(subject => subject.Name)
            .AsEnumerable()
            .Select(ToDto)
            .ToList());
    }

    [HttpGet("{id:int}")]
    public IActionResult GetSubject(int id)
    {
        var subject = db.Subjects.FirstOrDefault(item => item.Id == id);
        return subject is null ? NotFound(new { error = "Subject was not found." }) : Ok(ToDto(subject));
    }

    [HttpPost]
    public IActionResult CreateSubject(CreateSubjectRequest request)
    {
        var validation = ValidateSubject(request.Name, request.Code);
        if (validation is not null)
        {
            return BadRequest(new { error = validation });
        }

        var name = request.Name.Trim();
        var code = request.Code.Trim().ToUpperInvariant();
        if (SubjectExists(name, code))
        {
            return Conflict(new { error = "A subject with this name or code already exists." });
        }

        var subject = new Subject
        {
            Name = name,
            Code = code,
            Description = request.Description.Trim(),
            IsActive = true
        };

        db.Subjects.Add(subject);
        db.SaveChanges();

        return CreatedAtAction(nameof(GetSubject), new { id = subject.Id }, ToDto(subject));
    }

    [HttpPut("{id:int}")]
    public IActionResult UpdateSubject(int id, UpdateSubjectRequest request)
    {
        var subject = db.Subjects.FirstOrDefault(item => item.Id == id);
        if (subject is null)
        {
            return NotFound(new { error = "Subject was not found." });
        }

        var validation = ValidateSubject(request.Name, request.Code);
        if (validation is not null)
        {
            return BadRequest(new { error = validation });
        }

        var name = request.Name.Trim();
        var code = request.Code.Trim().ToUpperInvariant();
        if (db.Subjects.Any(item => item.Id != id && (item.Name == name || item.Code == code)))
        {
            return Conflict(new { error = "A subject with this name or code already exists." });
        }

        subject.Name = name;
        subject.Code = code;
        subject.Description = request.Description.Trim();
        subject.IsActive = request.IsActive;
        db.SaveChanges();

        return Ok(ToDto(subject));
    }

    [HttpDelete("{id:int}")]
    public IActionResult DeleteSubject(int id)
    {
        var subject = db.Subjects.FirstOrDefault(item => item.Id == id);
        if (subject is null)
        {
            return NotFound(new { error = "Subject was not found." });
        }

        subject.IsActive = false;
        db.SaveChanges();
        return NoContent();
    }

    private bool SubjectExists(string name, string code)
    {
        return db.Subjects.Any(subject => subject.Name == name || subject.Code == code);
    }

    private static string? ValidateSubject(string name, string code)
    {
        if (name.Trim().Length < 2)
        {
            return "Enter the subject name.";
        }

        if (code.Trim().Length < 2)
        {
            return "Enter the subject code.";
        }

        return null;
    }

    private static SubjectDto ToDto(Subject subject)
    {
        return new SubjectDto(subject.Id, subject.Name, subject.Code, subject.Description, subject.IsActive);
    }
}
