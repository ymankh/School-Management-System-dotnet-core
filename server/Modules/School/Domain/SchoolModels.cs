using SchoolSystemTask.Modules.Auth.Domain;

namespace SchoolSystemTask.Modules.School.Domain;

public sealed class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<ClassSubject> ClassSubjects { get; set; } = [];
}

public sealed class SchoolClass
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<ClassSubject> ClassSubjects { get; set; } = [];
    public List<StudentClassEnrollment> Enrollments { get; set; } = [];
}

public sealed class ClassSubject
{
    public int Id { get; set; }
    public int SchoolClassId { get; set; }
    public SchoolClass? SchoolClass { get; set; }
    public int SubjectId { get; set; }
    public Subject? Subject { get; set; }
    public List<TeacherClassAssignment> TeacherAssignments { get; set; } = [];
}

public sealed class StudentProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string GuardianPhone { get; set; } = string.Empty;
    public List<StudentClassEnrollment> Enrollments { get; set; } = [];
    public List<ParentStudentLink> ParentLinks { get; set; } = [];
}

public sealed class TeacherProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public string EmployeeNumber { get; set; } = string.Empty;
    public List<TeacherClassAssignment> Assignments { get; set; } = [];
}

public sealed class ParentProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public string Phone { get; set; } = string.Empty;
    public List<ParentStudentLink> StudentLinks { get; set; } = [];
}

public sealed class StudentClassEnrollment
{
    public int Id { get; set; }
    public int StudentProfileId { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public int SchoolClassId { get; set; }
    public SchoolClass? SchoolClass { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
}

public sealed class TeacherClassAssignment
{
    public int Id { get; set; }
    public int TeacherProfileId { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }
    public int ClassSubjectId { get; set; }
    public ClassSubject? ClassSubject { get; set; }
}

public sealed class ParentStudentLink
{
    public int Id { get; set; }
    public int ParentProfileId { get; set; }
    public ParentProfile? ParentProfile { get; set; }
    public int StudentProfileId { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public string Relationship { get; set; } = string.Empty;
}
