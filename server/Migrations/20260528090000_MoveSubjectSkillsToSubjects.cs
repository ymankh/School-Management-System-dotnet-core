using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolSystemTask.Data;

#nullable disable

namespace SchoolSystemTask.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260528090000_MoveSubjectSkillsToSubjects")]
public partial class MoveSubjectSkillsToSubjects : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_SubjectSkills_ClassSubjectId_Name",
            table: "SubjectSkills");

        migrationBuilder.AddColumn<int>(
            name: "SubjectId",
            table: "SubjectSkills",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.Sql("""
            UPDATE SubjectSkills
            SET SubjectId = (
                SELECT SubjectId
                FROM ClassSubjects
                WHERE ClassSubjects.Id = SubjectSkills.ClassSubjectId
            )
            WHERE SubjectId = 0
            """);

        migrationBuilder.Sql("""
            DELETE FROM SubjectSkills
            WHERE Id NOT IN (
                SELECT MIN(Id)
                FROM SubjectSkills
                GROUP BY SubjectId, Name
            )
            """);

        migrationBuilder.CreateIndex(
            name: "IX_SubjectSkills_SubjectId_Name",
            table: "SubjectSkills",
            columns: new[] { "SubjectId", "Name" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_SubjectSkills_SubjectId_Name",
            table: "SubjectSkills");

        migrationBuilder.DropColumn(
            name: "SubjectId",
            table: "SubjectSkills");

        migrationBuilder.CreateIndex(
            name: "IX_SubjectSkills_ClassSubjectId_Name",
            table: "SubjectSkills",
            columns: new[] { "ClassSubjectId", "Name" },
            unique: true);
    }
}
