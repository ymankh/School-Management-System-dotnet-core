namespace SchoolSystemTask.Models;

using Microsoft.EntityFrameworkCore;

public class MyDbContext(DbContextOptions<MyDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students { get; set; }
    public DbSet<StudentDetails> StudentDetails { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<Grade> Grades { get; set; }
    public DbSet<Section> Sections { get; set; }
    public DbSet<StudentClass> StudentClasses { get; set; }
    public DbSet<Subject> Subjects { get; set; }
    public DbSet<ClassSubject> ClassSubjects { get; set; }
    public DbSet<TeacherSubject> TeacherSubjects { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<UserTeacher> UserTeachers { get; set; }
    public DbSet<StudentNote> StudentNotes { get; set; }
    public DbSet<NoteType> NoteTypes { get; set; }

    public DbSet<Exam> Exams { get; set; }

    public DbSet<ExamMark> ExamMarks { get; set; }

    public DbSet<StudentAbsence> StudentAbsences { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<AssignmentSubmission> AssignmentSubmissions { get; set; }
    public DbSet<ActionHistory> ActionHistories { get; set; }
    public DbSet<UserStudent> UserStudents { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations for each entity
        modelBuilder.ApplyConfiguration(new EntityConfiguration.GradeConfiguration());
        modelBuilder.ApplyConfiguration(new EntityConfiguration.SectionConfiguration());
        modelBuilder.ApplyConfiguration(new EntityConfiguration.SubjectConfiguration());
        modelBuilder.ApplyConfiguration(new EntityConfiguration.NoteTypeConfiguration());

        // Configure cascade delete behavior for Exam -> ExamMarks
        modelBuilder.Entity<Exam>()
            .HasMany(e => e.ExamMarks)
            .WithOne(em => em.Exam)
            .HasForeignKey(em => em.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete behavior for Student -> ExamMarks
        modelBuilder.Entity<Student>()
            .HasMany(s => s.ExamMarks)
            .WithOne(em => em.Student)
            .HasForeignKey(em => em.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete behavior for Student -> StudentAbsences
        modelBuilder.Entity<Student>()
            .HasMany(s => s.StudentAbsences)
            .WithOne(sa => sa.Student)
            .HasForeignKey(sa => sa.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete behavior for Student -> StudentNotes
        modelBuilder.Entity<Student>()
            .HasMany(s => s.StudentNotes)
            .WithOne(sn => sn.Student)
            .HasForeignKey(sn => sn.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete behavior for Class -> Students
        modelBuilder.Entity<Class>()
            .HasMany(c => c.Students)
            .WithOne(s => s.Class)
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete behavior for TeacherSubject -> Exams
        modelBuilder.Entity<Exam>()
            .HasOne(e => e.ClassSubject)
            .WithMany(cs => cs.Exams)
            .HasForeignKey(e => e.ClassSubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure composite keys
        modelBuilder.Entity<StudentClass>()
            .HasKey(sc => new { sc.StudentId, sc.ClassId });

        modelBuilder.Entity<ActionHistory>()
            .HasOne(a => a.UserTeacher).WithMany(ut => ut.ActionHistories).OnDelete(DeleteBehavior.Cascade);
    }
}