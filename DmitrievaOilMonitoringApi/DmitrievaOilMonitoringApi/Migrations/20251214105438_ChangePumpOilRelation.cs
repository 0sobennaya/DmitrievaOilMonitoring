using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class ChangePumpOilRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps");

            migrationBuilder.CreateIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps",
                column: "OilId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps");

            migrationBuilder.CreateIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps",
                column: "OilId",
                unique: true,
                filter: "[OilId] IS NOT NULL");
        }
    }
}
