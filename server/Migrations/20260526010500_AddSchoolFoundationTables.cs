using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using SchoolSystemTask.Data;

#nullable disable

namespace SchoolSystemTask.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260526010500_AddSchoolFoundationTables")]
public partial class AddSchoolFoundationTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SchoolClasses",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Name = table.Column<string>(nullable: false),
                GradeLevel = table.Column<string>(nullable: false),
                AcademicYear = table.Column<string>(nullable: false),
                IsActive = table.Column<bool>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SchoolClasses", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Subjects",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Name = table.Column<string>(nullable: false),
                Code = table.Column<string>(nullable: false),
                Description = table.Column<string>(nullable: false),
                IsActive = table.Column<bool>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Subjects", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ParentProfiles",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                UserId = table.Column<int>(nullable: false),
                Phone = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ParentProfiles", x => x.Id);
                table.ForeignKey("FK_ParentProfiles_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StudentProfiles",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                UserId = table.Column<int>(nullable: false),
                StudentNumber = table.Column<string>(nullable: false),
                DateOfBirth = table.Column<DateOnly>(nullable: true),
                GuardianPhone = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentProfiles", x => x.Id);
                table.ForeignKey("FK_StudentProfiles_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TeacherProfiles",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                UserId = table.Column<int>(nullable: false),
                EmployeeNumber = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TeacherProfiles", x => x.Id);
                table.ForeignKey("FK_TeacherProfiles_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ClassSubjects",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                SchoolClassId = table.Column<int>(nullable: false),
                SubjectId = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ClassSubjects", x => x.Id);
                table.ForeignKey("FK_ClassSubjects_SchoolClasses_SchoolClassId", x => x.SchoolClassId, "SchoolClasses", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_ClassSubjects_Subjects_SubjectId", x => x.SubjectId, "Subjects", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "ParentStudentLinks",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ParentProfileId = table.Column<int>(nullable: false),
                StudentProfileId = table.Column<int>(nullable: false),
                Relationship = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ParentStudentLinks", x => x.Id);
                table.ForeignKey("FK_ParentStudentLinks_ParentProfiles_ParentProfileId", x => x.ParentProfileId, "ParentProfiles", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_ParentStudentLinks_StudentProfiles_StudentProfileId", x => x.StudentProfileId, "StudentProfiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StudentClassEnrollments",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                StudentProfileId = table.Column<int>(nullable: false),
                SchoolClassId = table.Column<int>(nullable: false),
                AcademicYear = table.Column<string>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentClassEnrollments", x => x.Id);
                table.ForeignKey("FK_StudentClassEnrollments_SchoolClasses_SchoolClassId", x => x.SchoolClassId, "SchoolClasses", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_StudentClassEnrollments_StudentProfiles_StudentProfileId", x => x.StudentProfileId, "StudentProfiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TeacherClassAssignments",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                TeacherProfileId = table.Column<int>(nullable: false),
                ClassSubjectId = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TeacherClassAssignments", x => x.Id);
                table.ForeignKey("FK_TeacherClassAssignments_ClassSubjects_ClassSubjectId", x => x.ClassSubjectId, "ClassSubjects", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_TeacherClassAssignments_TeacherProfiles_TeacherProfileId", x => x.TeacherProfileId, "TeacherProfiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_ClassSubjects_SchoolClassId_SubjectId", "ClassSubjects", new[] { "SchoolClassId", "SubjectId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ClassSubjects_SubjectId", "ClassSubjects", "SubjectId");
        migrationBuilder.CreateIndex("IX_ParentProfiles_UserId", "ParentProfiles", "UserId", unique: true);
        migrationBuilder.CreateIndex("IX_ParentStudentLinks_ParentProfileId_StudentProfileId", "ParentStudentLinks", new[] { "ParentProfileId", "StudentProfileId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ParentStudentLinks_StudentProfileId", "ParentStudentLinks", "StudentProfileId");
        migrationBuilder.CreateIndex("IX_SchoolClasses_Name_AcademicYear", "SchoolClasses", new[] { "Name", "AcademicYear" }, unique: true);
        migrationBuilder.CreateIndex("IX_StudentClassEnrollments_SchoolClassId", "StudentClassEnrollments", "SchoolClassId");
        migrationBuilder.CreateIndex("IX_StudentClassEnrollments_StudentProfileId_AcademicYear", "StudentClassEnrollments", new[] { "StudentProfileId", "AcademicYear" }, unique: true);
        migrationBuilder.CreateIndex("IX_StudentProfiles_StudentNumber", "StudentProfiles", "StudentNumber", unique: true);
        migrationBuilder.CreateIndex("IX_StudentProfiles_UserId", "StudentProfiles", "UserId", unique: true);
        migrationBuilder.CreateIndex("IX_Subjects_Code", "Subjects", "Code", unique: true);
        migrationBuilder.CreateIndex("IX_Subjects_Name", "Subjects", "Name", unique: true);
        migrationBuilder.CreateIndex("IX_TeacherClassAssignments_ClassSubjectId", "TeacherClassAssignments", "ClassSubjectId");
        migrationBuilder.CreateIndex("IX_TeacherClassAssignments_TeacherProfileId_ClassSubjectId", "TeacherClassAssignments", new[] { "TeacherProfileId", "ClassSubjectId" }, unique: true);
        migrationBuilder.CreateIndex("IX_TeacherProfiles_EmployeeNumber", "TeacherProfiles", "EmployeeNumber", unique: true);
        migrationBuilder.CreateIndex("IX_TeacherProfiles_UserId", "TeacherProfiles", "UserId", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("ParentStudentLinks");
        migrationBuilder.DropTable("StudentClassEnrollments");
        migrationBuilder.DropTable("TeacherClassAssignments");
        migrationBuilder.DropTable("ParentProfiles");
        migrationBuilder.DropTable("StudentProfiles");
        migrationBuilder.DropTable("ClassSubjects");
        migrationBuilder.DropTable("TeacherProfiles");
        migrationBuilder.DropTable("SchoolClasses");
        migrationBuilder.DropTable("Subjects");
    }
}
