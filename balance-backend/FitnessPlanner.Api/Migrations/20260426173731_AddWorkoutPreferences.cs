using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FitnessPlanner.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreferredWorkoutTime",
                table: "UserProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "WorkoutPreferenceId",
                table: "UserProfiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkoutPreferences",
                columns: table => new
                {
                    WorkoutPreferenceId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutPreferences", x => x.WorkoutPreferenceId);
                });

            migrationBuilder.InsertData(
                table: "WorkoutPreferences",
                columns: new[] { "WorkoutPreferenceId", "DeletedAt", "Name" },
                values: new object[,]
                {
                    { 1L, null, "General Fitness" },
                    { 2L, null, "Build Strength" },
                    { 3L, null, "Weight Loss" },
                    { 4L, null, "Endurance" },
                    { 5L, null, "Mobility & Flexibility" },
                    { 6L, null, "Recovery" },
                    { 7L, null, "Beginner-Friendly" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_WorkoutPreferenceId",
                table: "UserProfiles",
                column: "WorkoutPreferenceId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_WorkoutPreferences_WorkoutPreferenceId",
                table: "UserProfiles",
                column: "WorkoutPreferenceId",
                principalTable: "WorkoutPreferences",
                principalColumn: "WorkoutPreferenceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_WorkoutPreferences_WorkoutPreferenceId",
                table: "UserProfiles");

            migrationBuilder.DropTable(
                name: "WorkoutPreferences");

            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_WorkoutPreferenceId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "PreferredWorkoutTime",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WorkoutPreferenceId",
                table: "UserProfiles");
        }
    }
}
