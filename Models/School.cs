using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolSystemTask.Models;
public class Student
{
    public int Id { get; set; } // Primary Key

    [Required] public string FirstName { get; set; } = string.Empty; // Not Null

    public string SecondName { get; set; } = string.Empty; // Not Null
    public string ThirdName { get; set; } = string.Empty; // Not Null
    public string LastName { get; set; } = string.Empty; // Not Null

    public string? ParentContact { get; set; }
    public string? Address { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? NationalId { get; set; }

    [ForeignKey("Class")] public int ClassId { get; set; } // Foreign Key

    public Class Class { get; set; } = null!; // Navigation Property
    public StudentDetails StudentDetails { get; set; } = null!; // Navigation Property

    public ICollection<StudentAbsence> StudentAbsences { get; set; } = new List<StudentAbsence>();
    public ICollection<ExamMark> ExamMarks { get; set; } = new List<ExamMark>();
    public ICollection<StudentNote> StudentNotes { get; set; } = new List<StudentNote>();

    public string StudentName()
    {
        return FirstName + " " + SecondName;
    }
}

public class Class
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Grade")] public int GradeId { get; set; } // Foreign Key
    public Grade Grade { get; set; } = null!; // Navigation Property

    [ForeignKey("Teacher")] public int TeacherId { get; set; } // Foreign Key
    public Teacher Teacher { get; set; } = null!; // Navigation Property

    [ForeignKey("Section")] public int SectionId { get; set; } // Foreign Key
    public Section Section { get; set; } = null!; // Navigation Property

    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<ClassSubject> ClassSubjects { get; set; } = new List<ClassSubject>();
    public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();

    public string ClassName => $"{Grade.Name}, {Section.Name}";
}

public class StudentClass
{
    [Key][Column(Order = 1)] public int StudentId { get; set; } // Composite Primary Key

    public Student Student { get; set; } = null!; // Navigation Property

    [Key][Column(Order = 2)] public int ClassId { get; set; } // Composite Primary Key

    public Class Class { get; set; } = null!; // Navigation Property
}

public class StudentAbsence
{
    public int Id { get; set; } // Primary Key

    public DateTime DateTime { get; set; } // Not Null

    [ForeignKey("Student")] public int StudentId { get; set; } // Foreign Key

    public Student Student { get; set; } // Navigation Property
}

public class ExamMark
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Student")] public int StudentId { get; set; } // Foreign Key

    public Student Student { get; set; } = null!; // Navigation Property

    public int Mark { get; set; } // Not Null

    [ForeignKey("Exam")] public int ExamId { get; set; } // Foreign Key

    public Exam Exam { get; set; } = null!; // Navigation Property
}

public class NoteType
{
    public int Id { get; set; } // Primary Key

    [Required] public string NoteTypeName { get; set; } = string.Empty; // Not Null

    public ICollection<StudentNote> StudentNotes { get; set; } = new List<StudentNote>();
}

public class Subject
{
    public int Id { get; set; } // Primary Key

    [Required] public string Name { get; set; } = string.Empty; // Not Null

    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<ClassSubject> ClassSubjects { get; set; } = new List<ClassSubject>();
}

public class Exam
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("ClassSubject")] public int ClassSubjectId { get; set; }

    public ClassSubject ClassSubject { get; set; } = null!; // Navigation Property

    public int MaxMark { get; set; }

    public DateTime ExamStartDate { get; set; }

    [Required] public string Details { get; set; } = string.Empty; // Exam details

    public TimeSpan ExamDuration { get; set; }
    public bool IsVisible { get; set; } = false; // Default: not visible
    public bool MarkPublished { get; set; } = false; // Default: not published

    [Required] public string ExamType { get; set; } = string.Empty; // Not Null

    public ICollection<ExamMark> ExamMarks { get; set; } = new List<ExamMark>();
}

public class StudentNote
{
    public int Id { get; set; } // Primary Key

    [Required] public string Note { get; set; } = string.Empty; // Not Null

    public DateTime DateTime { get; set; } = DateTime.Now;
    [ForeignKey("NoteType")] public int NoteTypeId { get; set; } // Foreign Key

    public NoteType NoteType { get; set; } = null!; // Navigation Property

    [ForeignKey("Student")] public int StudentId { get; set; } // Foreign Key

    public Student Student { get; set; } = null!; // Navigation Property

    [ForeignKey("Teacher")] public int TeacherId { get; set; } // Foreign Key

    public Teacher Teacher { get; set; } = null!; // Navigation Property
}

public class ClassSubject
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Class")] public int ClassId { get; set; } // Foreign Key

    public Class Class { get; set; } = null!; // Navigation Property

    [ForeignKey("TeacherSubject")] public int TeacherSubjectId { get; set; } // Foreign Key

    public TeacherSubject TeacherSubject { get; set; } = null!; // Navigation Property

    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
}

public class Grade
{
    public int Id { get; set; } // Primary Key

    [Required] public string Name { get; set; } = string.Empty; // Not Null

    public ICollection<Class> Classes { get; set; } = new List<Class>();
}

public class Teacher
{
    public int Id { get; set; } // Primary Key

    [Required] public string FirstName { get; set; } = string.Empty; // Not Null

    public string? SecondName { get; set; } // Nullable
    public string? ThirdName { get; set; } // Nullable
    public string? Specialty { get; set; }
    public string? Mobile { get; set; }
    public string? Location { get; set; }
    public string? Bio { get; set; }
    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    [Required] public string LastName { get; set; } = string.Empty; // Not Null

    public ICollection<Class> Classes { get; set; } = new List<Class>();
    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    public ICollection<StudentNote> StudentNotes { get; set; } = new List<StudentNote>();
}

public class StudentDetails
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Student")] public int StudentId { get; set; } // Foreign Key

    [Required][EmailAddress] public string Email { get; set; } = string.Empty; // Not Null

    public Student Student { get; set; } = null!; // Navigation Property
}

public class TeacherSubject
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Teacher")] public int TeacherId { get; set; } // Foreign Key

    public Teacher Teacher { get; set; } = null!; // Navigation Property

    [ForeignKey("Subject")] public int SubjectId { get; set; } // Foreign Key

    public Subject Subject { get; set; } = null!; // Navigation Property

    public ICollection<StudentAbsence> StudentAbsences { get; set; } = new List<StudentAbsence>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();

    public ICollection<ClassSubject> ClassSubjects { get; set; }
}

public class Section
{
    public int Id { get; set; } // Primary Key

    [MaxLength(255)][Required] public string Name { get; set; } = string.Empty; // Not Null

    public ICollection<Class> Classes { get; set; } = new List<Class>();
}

public class Assignment
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("ClassSubject")] public int ClassSubjectId { get; set; }

    public ClassSubject ClassSubject { get; set; } = null!; // Navigation Property

    public DateTime DueDate { get; set; }

    [Required] public string Details { get; set; } = string.Empty; // Exam details
    public bool IsVisible { get; set; } = false; // Default: not visible
}

public class AssignmentSubmission
{
    public int Id { get; set; } // Primary Key

    [ForeignKey("Student")] public int StudentId { get; set; } // Foreign Key

    public Student Student { get; set; } = null!; // Navigation Property

    [ForeignKey("Assignment")] public int AssignmentId { get; set; } // Foreign Key

    public Assignment Assignment { get; set; } = null!; // Navigation Property

    public DateTime DateTime { get; set; } = DateTime.Now;

    [Required] public string Submission { get; set; } = string.Empty; // Not Null
}
