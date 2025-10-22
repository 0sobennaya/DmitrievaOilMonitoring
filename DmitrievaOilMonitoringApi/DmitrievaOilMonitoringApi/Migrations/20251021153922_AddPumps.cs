using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DmitrievaOilMonitoringApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPumps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "Wear",
                table: "Oils",
                type: "float",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Oils",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "Contamination",
                table: "Oils",
                type: "float",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);

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
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pumps_OilId",
                table: "Pumps",
                column: "OilId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Pumps");

            migrationBuilder.AlterColumn<double>(
                name: "Wear",
                table: "Oils",
                type: "float",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Oils",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<double>(
                name: "Contamination",
                table: "Oils",
                type: "float",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float");
        }
    }
}
