using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Modules.Exams.Domain;

namespace SchoolSystemTask.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<QuestionGroup> QuestionGroups => Set<QuestionGroup>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<QuestionMatchPair> QuestionMatchPairs => Set<QuestionMatchPair>();
    public DbSet<ExamAttachment> ExamAttachments => Set<ExamAttachment>();
    public DbSet<ExamStudentAssignment> ExamStudentAssignments => Set<ExamStudentAssignment>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<AttemptQuestion> AttemptQuestions => Set<AttemptQuestion>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();
    public DbSet<QuestionBankItem> QuestionBankItems => Set<QuestionBankItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Exam>(entity =>
        {
            entity.HasKey(exam => exam.Id);
            entity.Property(exam => exam.Mode).HasConversion<string>();
            entity.Property(exam => exam.Status).HasConversion<string>();
            entity.HasMany(exam => exam.Groups).WithOne().HasForeignKey(group => group.ExamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(exam => exam.Attachments).WithOne().HasForeignKey(attachment => attachment.ExamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionGroup>(entity =>
        {
            entity.HasKey(group => group.Id);
            entity.HasMany(group => group.Questions).WithOne().HasForeignKey(question => question.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.HasKey(question => question.Id);
            entity.Property(question => question.Type).HasConversion<string>();
            entity.Property(question => question.Mark).HasPrecision(10, 2);
            entity.OwnsOne(question => question.FileUploadRule);
            entity.HasMany(question => question.Options).WithOne().HasForeignKey(option => option.QuestionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(question => question.MatchPairs).WithOne().HasForeignKey(pair => pair.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionOption>().HasKey(option => option.Id);
        modelBuilder.Entity<QuestionMatchPair>().HasKey(pair => pair.Id);
        modelBuilder.Entity<ExamAttachment>().HasKey(attachment => attachment.Id);
        modelBuilder.Entity<ExamStudentAssignment>(entity =>
        {
            entity.HasKey(assignment => assignment.Id);
            entity.HasIndex(assignment => new { assignment.ExamId, assignment.StudentId }).IsUnique();
        });

        modelBuilder.Entity<ExamAttempt>(entity =>
        {
            entity.HasKey(attempt => attempt.Id);
            entity.Property(attempt => attempt.Status).HasConversion<string>();
            entity.Property(attempt => attempt.TotalMark).HasPrecision(10, 2);
            entity.HasMany(attempt => attempt.Questions).WithOne().HasForeignKey(question => question.AttemptId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(attempt => attempt.Answers).WithOne().HasForeignKey(answer => answer.AttemptId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AttemptQuestion>().HasKey(question => question.Id);

        modelBuilder.Entity<StudentAnswer>(entity =>
        {
            entity.HasKey(answer => answer.Id);
            entity.Property(answer => answer.AwardedMark).HasPrecision(10, 2);
            entity.Property(answer => answer.GradingStatus).HasConversion<string>();
        });

        modelBuilder.Entity<QuestionBankItem>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.HasOne(item => item.Question).WithMany().OnDelete(DeleteBehavior.Cascade);
        });
    }
}
