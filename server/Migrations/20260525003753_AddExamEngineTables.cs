using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using SchoolSystemTask.Data;

#nullable disable

namespace SchoolSystemTask.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260525003753_AddExamEngineTables")]
public partial class AddExamEngineTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Exams",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Title = table.Column<string>(nullable: false),
                ClassSubjectId = table.Column<int>(nullable: false),
                Subject = table.Column<string>(nullable: false),
                ClassName = table.Column<string>(nullable: false),
                TeacherName = table.Column<string>(nullable: false),
                Mode = table.Column<string>(nullable: false),
                StartAtUtc = table.Column<DateTime>(nullable: false),
                EndAtUtc = table.Column<DateTime>(nullable: false),
                MaxMark = table.Column<int>(nullable: false),
                PassingMark = table.Column<int>(nullable: false),
                IsVisible = table.Column<bool>(nullable: false),
                IsPublished = table.Column<bool>(nullable: false),
                MarkPublished = table.Column<bool>(nullable: false),
                Status = table.Column<string>(nullable: false),
                ShuffleGroups = table.Column<bool>(nullable: false),
                FocusModeEnabled = table.Column<bool>(nullable: false),
                InstructionsMarkdown = table.Column<string>(nullable: false),
                StudyMaterialsMarkdown = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Exams", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ExamAttempts",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ExamId = table.Column<int>(nullable: false),
                StudentId = table.Column<int>(nullable: false),
                Status = table.Column<string>(nullable: false),
                StartedAtUtc = table.Column<DateTime>(nullable: false),
                SubmittedAtUtc = table.Column<DateTime>(nullable: true),
                TotalMark = table.Column<decimal>(precision: 10, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ExamAttempts", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ExamStudentAssignments",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ExamId = table.Column<int>(nullable: false),
                StudentId = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ExamStudentAssignments", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SubjectSkills",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ClassSubjectId = table.Column<int>(nullable: false),
                Subject = table.Column<string>(nullable: false),
                Name = table.Column<string>(nullable: false),
                DescriptionMarkdown = table.Column<string>(nullable: false),
                DisplayOrder = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SubjectSkills", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "QuestionGroups",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ExamId = table.Column<int>(nullable: false),
                Title = table.Column<string>(nullable: false),
                InstructionsMarkdown = table.Column<string>(nullable: false),
                AuthoringOrder = table.Column<int>(nullable: false),
                SelectionPolicy = table.Column<string>(nullable: false),
                QuestionsToShow = table.Column<int>(nullable: true),
                ShuffleQuestions = table.Column<bool>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuestionGroups", x => x.Id);
                table.ForeignKey("FK_QuestionGroups_Exams_ExamId", x => x.ExamId, "Exams", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ExamAttachments",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ExamId = table.Column<int>(nullable: false),
                FileName = table.Column<string>(nullable: false),
                ContentType = table.Column<string>(nullable: false),
                Url = table.Column<string>(nullable: false),
                SizeBytes = table.Column<long>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ExamAttachments", x => x.Id);
                table.ForeignKey("FK_ExamAttachments_Exams_ExamId", x => x.ExamId, "Exams", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AttemptQuestions",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                AttemptId = table.Column<int>(nullable: false),
                QuestionId = table.Column<int>(nullable: false),
                DeliveredOrder = table.Column<int>(nullable: false),
                DeliveredOptionOrder = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AttemptQuestions", x => x.Id);
                table.ForeignKey("FK_AttemptQuestions_ExamAttempts_AttemptId", x => x.AttemptId, "ExamAttempts", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StudentAnswers",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                AttemptId = table.Column<int>(nullable: false),
                QuestionId = table.Column<int>(nullable: false),
                AnswerJson = table.Column<string>(nullable: false),
                AwardedMark = table.Column<decimal>(precision: 10, scale: 2, nullable: false),
                GradingStatus = table.Column<string>(nullable: false),
                FlaggedForReview = table.Column<bool>(nullable: false),
                SavedAtUtc = table.Column<DateTime>(nullable: false),
                TeacherFeedback = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentAnswers", x => x.Id);
                table.ForeignKey("FK_StudentAnswers_ExamAttempts_AttemptId", x => x.AttemptId, "ExamAttempts", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ExamQuestions",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                GroupId = table.Column<int>(nullable: true),
                Type = table.Column<string>(nullable: false),
                BodyMarkdown = table.Column<string>(nullable: false),
                ReferenceMarkdown = table.Column<string>(nullable: false),
                Mark = table.Column<decimal>(precision: 10, scale: 2, nullable: false),
                AuthoringOrder = table.Column<int>(nullable: false),
                IsRequired = table.Column<bool>(nullable: false),
                Difficulty = table.Column<string>(nullable: false),
                Tags = table.Column<string>(nullable: false),
                GradingRule = table.Column<string>(nullable: false),
                ShuffleOptions = table.Column<bool>(nullable: false),
                OrderingItems = table.Column<string>(nullable: false),
                AcceptedAnswers = table.Column<string>(nullable: false),
                FileUploadRule_AcceptedContentTypes = table.Column<string>(nullable: true),
                FileUploadRule_MaxSizeBytes = table.Column<long>(nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ExamQuestions", x => x.Id);
                table.ForeignKey("FK_ExamQuestions_QuestionGroups_GroupId", x => x.GroupId, "QuestionGroups", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "QuestionBankItems",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Subject = table.Column<string>(nullable: false),
                OwnerName = table.Column<string>(nullable: false),
                QuestionId = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuestionBankItems", x => x.Id);
                table.ForeignKey("FK_QuestionBankItems_ExamQuestions_QuestionId", x => x.QuestionId, "ExamQuestions", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "QuestionOptions",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                QuestionId = table.Column<int>(nullable: false),
                TextMarkdown = table.Column<string>(nullable: false),
                IsCorrect = table.Column<bool>(nullable: false),
                AuthoringOrder = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuestionOptions", x => x.Id);
                table.ForeignKey("FK_QuestionOptions_ExamQuestions_QuestionId", x => x.QuestionId, "ExamQuestions", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "QuestionMatchPairs",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                QuestionId = table.Column<int>(nullable: false),
                LeftMarkdown = table.Column<string>(nullable: false),
                RightMarkdown = table.Column<string>(nullable: false),
                AuthoringOrder = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuestionMatchPairs", x => x.Id);
                table.ForeignKey("FK_QuestionMatchPairs_ExamQuestions_QuestionId", x => x.QuestionId, "ExamQuestions", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_AttemptQuestions_AttemptId", "AttemptQuestions", "AttemptId");
        migrationBuilder.CreateIndex("IX_ExamAttachments_ExamId", "ExamAttachments", "ExamId");
        migrationBuilder.CreateIndex("IX_ExamQuestions_GroupId", "ExamQuestions", "GroupId");
        migrationBuilder.CreateIndex("IX_ExamStudentAssignments_ExamId_StudentId", "ExamStudentAssignments", new[] { "ExamId", "StudentId" }, unique: true);
        migrationBuilder.CreateIndex("IX_QuestionBankItems_QuestionId", "QuestionBankItems", "QuestionId");
        migrationBuilder.CreateIndex("IX_QuestionMatchPairs_QuestionId", "QuestionMatchPairs", "QuestionId");
        migrationBuilder.CreateIndex("IX_QuestionOptions_QuestionId", "QuestionOptions", "QuestionId");
        migrationBuilder.CreateIndex("IX_QuestionGroups_ExamId", "QuestionGroups", "ExamId");
        migrationBuilder.CreateIndex("IX_StudentAnswers_AttemptId", "StudentAnswers", "AttemptId");
        migrationBuilder.CreateIndex("IX_SubjectSkills_ClassSubjectId_Name", "SubjectSkills", new[] { "ClassSubjectId", "Name" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("AttemptQuestions");
        migrationBuilder.DropTable("ExamAttachments");
        migrationBuilder.DropTable("ExamStudentAssignments");
        migrationBuilder.DropTable("QuestionBankItems");
        migrationBuilder.DropTable("QuestionMatchPairs");
        migrationBuilder.DropTable("QuestionOptions");
        migrationBuilder.DropTable("StudentAnswers");
        migrationBuilder.DropTable("SubjectSkills");
        migrationBuilder.DropTable("ExamQuestions");
        migrationBuilder.DropTable("ExamAttempts");
        migrationBuilder.DropTable("QuestionGroups");
        migrationBuilder.DropTable("Exams");
    }
}
