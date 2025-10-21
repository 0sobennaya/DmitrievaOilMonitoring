using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Oils",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TAN = table.Column<double>(type: "float", nullable: false),
                    Viscosity = table.Column<double>(type: "float", nullable: false),
                    WaterContent = table.Column<double>(type: "float", nullable: false),
                    InstallationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OperatingHours = table.Column<double>(type: "float", nullable: false),
                    StartStopCycles = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oils", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Oils");
        }
    }
}
