using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorization : Migration
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

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Login = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pumps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Mode = table.Column<int>(type: "int", nullable: false),
                    PressureIn = table.Column<double>(type: "float", nullable: false),
                    PressureOut = table.Column<double>(type: "float", nullable: false),
                    TemperatureBody = table.Column<double>(type: "float", nullable: false),
                    TemperatureBearing = table.Column<double>(type: "float", nullable: false),
                    Vibration = table.Column<double>(type: "float", nullable: false),
                    OilLevel = table.Column<double>(type: "float", nullable: false),
                    OilTemperature = table.Column<double>(type: "float", nullable: false),
                    OilPressure = table.Column<double>(type: "float", nullable: false),
                    Power = table.Column<double>(type: "float", nullable: false),
                    ShaftRotationFrequency = table.Column<double>(type: "float", nullable: false),
                    OilId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pumps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pumps_Oils_OilId",
                        column: x => x.OilId,
                        principalTable: "Oils",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "People",
                columns: new[] { "Id", "CreatedAt", "FullName", "Login", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Иван Лаборантов", "laborant", "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi", "Laborant" },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Петр Инженеров", "engineer", "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi", "Engineer" },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Мария Технологова", "technologist", "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi", "Technologist" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_People_Login",
                table: "People",
                column: "Login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps",
                column: "OilId",
                unique: true,
                filter: "[OilId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "People");

            migrationBuilder.DropTable(
                name: "Pumps");

            migrationBuilder.DropTable(
                name: "Oils");
        }
    }
}
