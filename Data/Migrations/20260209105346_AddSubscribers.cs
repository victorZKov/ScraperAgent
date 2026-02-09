using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ScraperAgent.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscribers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "subscribers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DomainPreference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TrialReportsUsed = table.Column<int>(type: "integer", nullable: false),
                    TrialExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MollieCustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MollieSubscriptionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MollieMandateId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MollieFirstPaymentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ManagementToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    EmailVerificationToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConsentGivenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConsentIpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscribers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_subscribers_Email",
                table: "subscribers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscribers_ManagementToken",
                table: "subscribers",
                column: "ManagementToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscribers_MollieCustomerId",
                table: "subscribers",
                column: "MollieCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_subscribers_Status_DomainPreference",
                table: "subscribers",
                columns: new[] { "Status", "DomainPreference" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "subscribers");
        }
    }
}
