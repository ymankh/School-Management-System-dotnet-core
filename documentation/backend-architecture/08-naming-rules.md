# Naming Rules

Use PascalCase for folders and C# types:

```txt
Modules/Students/
Modules/ExamMarks/
StudentsController
AddStudentDto
CreateExamHandler
```

Use `*Controller` for controllers:

```txt
StudentsController.cs
ClassesController.cs
ExamsController.cs
```

Use `*Dto` for data transfer objects:

```txt
AddStudentDto.cs
CreateExamDto.cs
StudentDto.cs
```

Use `*Request` and `*Response` for use-case models when they are not API DTOs:

```txt
CreateExamRequest.cs
CreateExamResponse.cs
```

Use `*Handler` for use-case handlers:

```txt
AddStudentHandler.cs
SearchStudentsHandler.cs
CreateExamHandler.cs
```

Use `*Service` only when the class represents a reusable service, not every use case:

```txt
EmailService.cs
PasswordHashingService.cs
```

Prefer business names over generic names.

Bad:

```txt
DataService.cs
Manager.cs
Processor.cs
Helper.cs
```

Good:

```txt
StudentEnrollmentService.cs
ExamPublishingHandler.cs
AttendanceReportGenerator.cs
```

Avoid growing generic helper folders. If a helper becomes business-specific, move it into the owning module.
