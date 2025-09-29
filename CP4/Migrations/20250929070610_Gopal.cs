using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TitleVerification.Api.Migrations
{
    /// <inheritdoc />
    public partial class Gopal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "LandRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "LandRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "LandRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Ownership",
                table: "LandRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RestrictedType",
                table: "LandRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "SiblingApproval",
                table: "LandRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "YearOfExistence",
                table: "LandRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LandRecordId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "LandRecords",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Address", "Latitude", "Longitude", "Ownership", "RestrictedType", "SiblingApproval", "YearOfExistence" },
                values: new object[] { "", 0.0, 0.0, "", "", false, 0 });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_LandRecordId",
                table: "Documents",
                column: "LandRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_LandRecords_LandRecordId",
                table: "Documents",
                column: "LandRecordId",
                principalTable: "LandRecords",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_LandRecords_LandRecordId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_LandRecordId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "Ownership",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "RestrictedType",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "SiblingApproval",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "YearOfExistence",
                table: "LandRecords");

            migrationBuilder.DropColumn(
                name: "LandRecordId",
                table: "Documents");
        }
    }
}
