namespace SchoolSystemTask.Modules.School.DTOs;

public sealed record SubjectDto(
    int Id,
    string Name,
    string Code,
    string Description,
    bool IsActive);

public sealed record CreateSubjectRequest(
    string Name,
    string Code,
    string Description = "");

public sealed record UpdateSubjectRequest(
    string Name,
    string Code,
    string Description,
    bool IsActive);
