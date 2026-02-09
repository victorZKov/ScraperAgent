using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScraperAgent.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDurationToReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DurationSeconds",
                table: "reports",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationSeconds",
                table: "reports");
        }
    }
}
