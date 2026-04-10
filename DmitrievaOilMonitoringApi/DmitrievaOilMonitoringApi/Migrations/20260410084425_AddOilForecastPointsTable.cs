using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddOilForecastPointsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OilForecastPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PumpId = table.Column<int>(type: "integer", nullable: false),
                    MeasurementDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    TAN = table.Column<double>(type: "double precision", nullable: false),
                    WaterContentPct = table.Column<double>(type: "double precision", nullable: false),
                    ImpuritiesPct = table.Column<double>(type: "double precision", nullable: false),
                    FlashPointC = table.Column<double>(type: "double precision", nullable: false),
                    MeanVibration = table.Column<double>(type: "double precision", nullable: false),
                    MeanOilTemp = table.Column<double>(type: "double precision", nullable: false),
                    OperatingHours = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OilForecastPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OilForecastPoints_Pumps_PumpId",
                        column: x => x.PumpId,
                        principalTable: "Pumps",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OilForecastPoints_PumpId",
                table: "OilForecastPoints",
                column: "PumpId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OilForecastPoints");
        }
    }
}
