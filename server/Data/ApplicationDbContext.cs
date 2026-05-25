using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Modules.Auth.Domain;
using SchoolSystemTask.Modules.Exams.Domain;

namespace SchoolSystemTask.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<AuthUser> Users => Set<AuthUser>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<QuestionGroup> QuestionGroups => Set<QuestionGroup>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<QuestionMatchPair> QuestionMatchPairs => Set<QuestionMatchPair>();
    public DbSet<ExamAttachment> ExamAttachments => Set<ExamAttachment>();
    public DbSet<SubjectSkill> SubjectSkills => Set<SubjectSkill>();
    public DbSet<ExamStudentAssignment> ExamStudentAssignments => Set<ExamStudentAssignment>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<AttemptQuestion> AttemptQuestions => Set<AttemptQuestion>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();
    public DbSet<QuestionBankItem> QuestionBankItems => Set<QuestionBankItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AuthUser>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.Email).IsUnique();
        });

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
            entity.Property(question => question.Tags).HasJsonListConversion();
            entity.Property(question => question.OrderingItems).HasJsonListConversion();
            entity.Property(question => question.AcceptedAnswers).HasJsonListConversion();
            entity.OwnsOne(question => question.FileUploadRule, rule =>
            {
                rule.Property(item => item.AcceptedContentTypes).HasJsonListConversion();
            });
            entity.HasMany(question => question.Options).WithOne().HasForeignKey(option => option.QuestionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(question => question.MatchPairs).WithOne().HasForeignKey(pair => pair.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionOption>().HasKey(option => option.Id);
        modelBuilder.Entity<QuestionMatchPair>().HasKey(pair => pair.Id);
        modelBuilder.Entity<ExamAttachment>().HasKey(attachment => attachment.Id);
        modelBuilder.Entity<SubjectSkill>(entity =>
        {
            entity.HasKey(skill => skill.Id);
            entity.HasIndex(skill => new { skill.ClassSubjectId, skill.Name }).IsUnique();
        });
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

        modelBuilder.Entity<AttemptQuestion>(entity =>
        {
            entity.HasKey(question => question.Id);
            entity.Property(question => question.DeliveredOptionOrder).HasJsonListConversion();
        });

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

internal static class JsonListPropertyBuilderExtensions
{
    public static void HasJsonListConversion<T>(this Microsoft.EntityFrameworkCore.Metadata.Builders.PropertyBuilder<List<T>> propertyBuilder)
    {
        propertyBuilder.HasConversion(
            values => JsonSerializer.Serialize(values, (JsonSerializerOptions?)null),
            json => JsonSerializer.Deserialize<List<T>>(json, (JsonSerializerOptions?)null) ?? new List<T>());

        propertyBuilder.Metadata.SetValueComparer(new ValueComparer<List<T>>(
            (left, right) => left != null && right != null && left.SequenceEqual(right),
            values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
            values => values.ToList()));
    }
}
