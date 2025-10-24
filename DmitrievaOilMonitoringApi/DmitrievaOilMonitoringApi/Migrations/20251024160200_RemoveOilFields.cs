using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOilFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Contamination",
                table: "Oils",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Oils",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Wear",
                table: "Oils",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
