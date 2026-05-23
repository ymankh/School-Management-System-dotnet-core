# Design Boundary Rules

## 1. A module owns its business language

Each module should own the terms, entities, DTOs, and rules related to its business area.

Bad:

```txt
Shared/DTOs/StudentDto.cs
Shared/Services/StudentService.cs
```

Good:

```txt
Modules/Students/DTOs/StudentDto.cs
Modules/Students/Application/StudentService.cs
```

## 2. Controllers should stay thin

Controllers are HTTP entry points only.

Bad:

```csharp
public async Task<IActionResult> AddStudent(AddStudentDto dto)
{
    var salt = SaltHelper.Generate();
    var hash = HashHelper.Hash(dto.Password, salt);
    db.Students.Add(new Student(...));
    await db.SaveChangesAsync();
    return Ok();
}
```

Good:

```csharp
public async Task<IActionResult> AddStudent(AddStudentDto dto)
{
    var result = await addStudentHandler.HandleAsync(dto);
    return Ok(result);
}
```

## 3. DTOs belong near the owning module

Avoid one global `DTOs/` folder for every feature as the app grows.

Bad:

```txt
DTOs/StudentsDTOs/AddStudentDto.cs
DTOs/ExamDTOs/CreateExamDto.cs
DTOs/ClassesDTOs/AddClassDto.cs
```

Better:

```txt
Modules/Students/DTOs/AddStudentDto.cs
Modules/Exams/DTOs/CreateExamDto.cs
Modules/Classes/DTOs/AddClassDto.cs
```

## 4. A module owns its data access rules

EF Core configuration, query behavior, and persistence rules for a module should stay close to that module.

Good:

```txt
Modules/Students/Infrastructure/StudentConfiguration.cs
Modules/Students/Application/SearchStudents/SearchStudentsHandler.cs
```

## 5. Shared should stay generic

Only move code to `Shared/` when it is truly generic and used by multiple modules.

Bad:

```txt
Shared/StudentMapper.cs
Shared/ExamRules.cs
Shared/ClassService.cs
```

Good:

```txt
Shared/Results/Result.cs
Shared/Errors/ApiError.cs
Shared/Time/IDateTimeProvider.cs
```

## 6. Avoid circular dependencies

A module should not depend on another module that also depends on it.

Bad:

```txt
Students imports Exams
Exams imports Students
```

Better:

```txt
Reports composes Students and Exams
Students does not own Exams
Exams does not own Students
```

## 7. Use application services for workflows

Cross-module workflows should live in a workflow module or application service.

Examples:

```txt
Modules/Workflows/Enrollment/
Modules/Workflows/ExamPublishing/
Modules/Reports/AcademicProgress/
```

## 8. Keep infrastructure replaceable

Email, hashing, storage, and database details should be behind interfaces when business code depends on them.

Good:

```txt
Application depends on IEmailSender
Infrastructure implements SmtpEmailSender
```

## 9. Keep validation close to use cases

Validation rules for a command or request should live near that command.

Good:

```txt
Modules/Students/Application/AddStudent/AddStudentValidator.cs
```

## 10. Keep permissions centralized

Authorization checks should use policies or capability checks, not scattered role checks.

Bad:

```csharp
if (user.Role == "Admin")
```

Good:

```csharp
[Authorize(Policy = "students:create")]
```

or:

```csharp
authorizationService.AuthorizeAsync(user, "students:create")
```
