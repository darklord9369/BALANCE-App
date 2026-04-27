using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessPlanner.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceWorkoutTimeWithDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredWorkoutTime",
                table: "UserProfiles");

            migrationBuilder.AddColumn<int>(
                name: "PreferredWorkoutDurationMinutes",
                table: "UserProfiles",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredWorkoutDurationMinutes",
                table: "UserProfiles");

            migrationBuilder.AddColumn<string>(
                name: "PreferredWorkoutTime",
                table: "UserProfiles",
                type: "text",
                nullable: true);
        }
    }
}
