using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScraperAgent.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bias",
                table: "experts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsContrarian",
                table: "experts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Weight",
                table: "experts",
                type: "integer",
                nullable: false,
                defaultValue: 5);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bias",
                table: "experts");

            migrationBuilder.DropColumn(
                name: "IsContrarian",
                table: "experts");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "experts");
        }
    }
}
