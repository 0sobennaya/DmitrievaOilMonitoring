using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRulResultTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RulResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PumpId = table.Column<int>(type: "integer", nullable: false),
                    CurrentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RulWarningMonths = table.Column<int>(type: "integer", nullable: false),
                    RulCriticalMonths = table.Column<int>(type: "integer", nullable: false),
                    RulWarningYears = table.Column<double>(type: "double precision", nullable: false),
                    RulCriticalYears = table.Column<double>(type: "double precision", nullable: false),
                    ReplacementDateWarning = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReplacementDateCritical = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LimitingParamWarning = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LimitingParamCritical = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OperatingHoursAtCalculation = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RulResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RulResults_Pumps_PumpId",
                        column: x => x.PumpId,
                        principalTable: "Pumps",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RulResults_PumpId",
                table: "RulResults",
                column: "PumpId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RulResults");
        }
    }
}
