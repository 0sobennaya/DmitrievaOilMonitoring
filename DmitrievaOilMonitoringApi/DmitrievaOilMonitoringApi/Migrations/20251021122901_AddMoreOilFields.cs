using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMoreOilFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Contamination",
                table: "Oils",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Oils",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Wear",
                table: "Oils",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Contamination",
                table: "Oils");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Oils");

            migrationBuilder.DropColumn(
                name: "Wear",
                table: "Oils");
        }
    }
}
