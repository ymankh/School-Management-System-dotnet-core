# Module Structure

Each module can use this structure:

```txt
ModuleName/
  Api/
    ModuleNameController.cs

  Application/
    CreateModuleName/
      CreateModuleNameRequest.cs
      CreateModuleNameResponse.cs
      CreateModuleNameHandler.cs
      CreateModuleNameValidator.cs

    GetModuleName/
      GetModuleNameQuery.cs
      GetModuleNameResponse.cs
      GetModuleNameHandler.cs

  Domain/
    ModuleName.cs
    ModuleNameStatus.cs
    ModuleNameRules.cs

  Infrastructure/
    ModuleNameConfiguration.cs
    ModuleNameRepository.cs

  DTOs/
    ModuleNameDto.cs

  Mappers/
    ModuleNameMapper.cs
```

## School Example

```txt
Modules/
  Students/
    Api/
      StudentsController.cs
    Application/
      AddStudent/
      GetStudent/
      SearchStudents/
    Domain/
      Student.cs
      StudentStatus.cs
    Infrastructure/
      StudentConfiguration.cs
    DTOs/
      AddStudentDto.cs
      StudentDto.cs

  Exams/
    Api/
      ExamsController.cs
    Application/
      CreateExam/
      AddExamMark/
    Domain/
      Exam.cs
      ExamMark.cs
    Infrastructure/
      ExamConfiguration.cs
    DTOs/
      CreateExamDto.cs
      AddExamMarkDto.cs
```

## Nested Modules

Modules can contain nested modules when the domain becomes large.

Example:

```txt
Modules/
  Academics/
    Classes/
    Subjects/
    Exams/

  StudentLife/
    Attendance/
    Notes/
    Behavior/

  Identity/
    Users/
    Roles/
    Permissions/
```

Use nested modules when:

* A module becomes too large
* A sub-area has its own endpoints
* A sub-area has its own business rules
* A sub-area has its own database model
* A sub-area can be understood as a separate capability

Do not nest modules just to make folders look organized.
