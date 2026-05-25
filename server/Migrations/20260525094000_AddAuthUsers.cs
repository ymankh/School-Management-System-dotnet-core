using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using SchoolSystemTask.Data;

#nullable disable

namespace SchoolSystemTask.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260525094000_AddAuthUsers")]
public partial class AddAuthUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                FullName = table.Column<string>(nullable: false),
                Email = table.Column<string>(nullable: false),
                PasswordHash = table.Column<string>(nullable: false),
                PasswordSalt = table.Column<string>(nullable: false),
                Role = table.Column<string>(nullable: false),
                StudentId = table.Column<int>(nullable: true),
                CreatedAtUtc = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateIndex("IX_Users_Email", "Users", "Email", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("Users");
    }
}
