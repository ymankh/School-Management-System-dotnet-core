using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolSystemTask.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "Users" ("FullName", "Email", "PasswordHash", "PasswordSalt", "Role", "StudentId", "CreatedAtUtc")
                SELECT 'Default Admin', 'admin@school.local',
                       '3f7f478e31278d7f3a887ea91bcaf3c641e02d9f6fa8d8c6dd5cbf139ff7e2c9',
                       'MDEyMzQ1Njc4OWFiY2RlZg==',
                       'admin', NULL, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (
                  SELECT 1 FROM "Users" WHERE "Email" = 'admin@school.local'
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "Users"
                WHERE "FullName" = 'Default Admin'
                  AND "Email" = 'admin@school.local'
                  AND "PasswordHash" = '3f7f478e31278d7f3a887ea91bcaf3c641e02d9f6fa8d8c6dd5cbf139ff7e2c9'
                  AND "PasswordSalt" = 'MDEyMzQ1Njc4OWFiY2RlZg=='
                  AND "Role" = 'admin'
                  AND "StudentId" IS NULL;
                """);
        }
    }
}
