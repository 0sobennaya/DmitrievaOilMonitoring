using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PumpOils");

            migrationBuilder.AddColumn<int>(
                name: "OilId",
                table: "Pumps",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps",
                column: "OilId",
                unique: true,
                filter: "[OilId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Pumps_Oils_OilId",
                table: "Pumps",
                column: "OilId",
                principalTable: "Oils",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pumps_Oils_OilId",
                table: "Pumps");

            migrationBuilder.DropIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps");

            migrationBuilder.DropColumn(
                name: "OilId",
                table: "Pumps");

            migrationBuilder.CreateTable(
                name: "PumpOils",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OilId = table.Column<int>(type: "int", nullable: false),
                    PumpId = table.Column<int>(type: "int", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InitialOperatingHours = table.Column<double>(type: "float", nullable: false),
                    InitialStartStopCycles = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    RemovedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PumpOils", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PumpOils_Oils_OilId",
                        column: x => x.OilId,
                        principalTable: "Oils",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PumpOils_Pumps_PumpId",
                        column: x => x.PumpId,
                        principalTable: "Pumps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PumpOils_OilId",
                table: "PumpOils",
                column: "OilId");

            migrationBuilder.CreateIndex(
                name: "IX_PumpOils_PumpId_IsActive",
                table: "PumpOils",
                columns: new[] { "PumpId", "IsActive" });
        }
    }
}
