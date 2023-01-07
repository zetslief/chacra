using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace chacra.Migrations
{
    /// <inheritdoc />
    public partial class EnemyWithTarget : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "TargetX",
                table: "Enemies",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "TargetY",
                table: "Enemies",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetX",
                table: "Enemies");

            migrationBuilder.DropColumn(
                name: "TargetY",
                table: "Enemies");
        }
    }
}
