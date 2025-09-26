using Microsoft.EntityFrameworkCore;
using TitleVerification.Api.Models;

namespace TitleVerification.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<LandRecord> LandRecords { get; set; } = null!;
        public DbSet<LoanApplication> LoanApplications { get; set; } = null!;
        public DbSet<Document> Documents { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Document>()
                .HasOne(d => d.User)
                .WithMany(u => u.Documents)
                .HasForeignKey(d => d.UserId);

            modelBuilder.Entity<LandRecord>().HasData(
                new LandRecord
                {
                    Id = 1,
                    LandId = "LAND123",
                    OwnerName = "John Doe",
                    OwnershipType = "Self",
                    LandType = "Agriculture",
                    HasOngoingLoan = false,
                    HasDispute = false
                }
            );
        }
    }
}