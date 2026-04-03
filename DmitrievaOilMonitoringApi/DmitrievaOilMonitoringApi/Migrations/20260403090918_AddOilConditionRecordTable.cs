using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddOilConditionRecordTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OilConditionRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PumpId = table.Column<int>(type: "integer", nullable: false),
                    MeasurementDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TAN = table.Column<double>(type: "double precision", nullable: false),
                    WaterContentPct = table.Column<double>(type: "double precision", nullable: false),
                    ImpuritiesPct = table.Column<double>(type: "double precision", nullable: false),
                    FlashPointC = table.Column<double>(type: "double precision", nullable: false),
                    IsTopup = table.Column<bool>(type: "boolean", nullable: false),
                    HasLeak = table.Column<bool>(type: "boolean", nullable: false),
                    MeanVibration = table.Column<double>(type: "double precision", nullable: false),
                    MeanOilTemp = table.Column<double>(type: "double precision", nullable: false),
                    MeanBearingTemp = table.Column<double>(type: "double precision", nullable: false),
                    OperatingHours = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OilConditionRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OilConditionRecords_Pumps_PumpId",
                        column: x => x.PumpId,
                        principalTable: "Pumps",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OilConditionRecords_PumpId",
                table: "OilConditionRecords",
                column: "PumpId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OilConditionRecords");
        }
    }
}
