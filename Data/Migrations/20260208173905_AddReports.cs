using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScraperAgent.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Domain = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TweetsAnalyzed = table.Column<int>(type: "integer", nullable: false),
                    ExpertsIncluded = table.Column<int>(type: "integer", nullable: false),
                    OverallSentiment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SentimentScore = table.Column<decimal>(type: "numeric", nullable: false),
                    ReportJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reports_Domain",
                table: "reports",
                column: "Domain");

            migrationBuilder.CreateIndex(
                name: "IX_reports_GeneratedAt",
                table: "reports",
                column: "GeneratedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reports");
        }
    }
}
