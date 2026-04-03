using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateForPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Oils",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TAN = table.Column<double>(type: "double precision", nullable: false),
                    Viscosity = table.Column<double>(type: "double precision", nullable: false),
                    WaterContent = table.Column<double>(type: "double precision", nullable: false),
                    InstallationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OperatingHours = table.Column<double>(type: "double precision", nullable: false),
                    StartStopCycles = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Oils", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Login = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pumps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    PressureIn = table.Column<double>(type: "double precision", nullable: false),
                    PressureOut = table.Column<double>(type: "double precision", nullable: false),
                    TemperatureBody = table.Column<double>(type: "double precision", nullable: false),
                    TemperatureBearing = table.Column<double>(type: "double precision", nullable: false),
                    Vibration = table.Column<double>(type: "double precision", nullable: false),
                    OilLevel = table.Column<double>(type: "double precision", nullable: false),
                    OilTemperature = table.Column<double>(type: "double precision", nullable: false),
                    OilPressure = table.Column<double>(type: "double precision", nullable: false),
                    Power = table.Column<double>(type: "double precision", nullable: false),
                    ShaftRotationFrequency = table.Column<double>(type: "double precision", nullable: false),
                    OilId = table.Column<int>(type: "integer", nullable: true)
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
                unique: true);
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
