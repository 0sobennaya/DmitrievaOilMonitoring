using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace DmitrievaOilMonitoringApi.Data
{
    public class OilMonitoringApiContext : DbContext 
    {
        public OilMonitoringApiContext(DbContextOptions<OilMonitoringApiContext> options) : base(options) { }
        public DbSet<Oil> Oils { get; set; }
        public DbSet<Pump> Pumps { get; set; }
        public DbSet<Person> People { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Pump>()
                .HasOne(p => p.Oil)
                .WithOne()
                .HasForeignKey<Pump>(p => p.OilId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Person>()
                .HasIndex(p => p.Login)
                .IsUnique();

            InitialUsers(modelBuilder);
        }

        private void InitialUsers(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Person>().HasData(
                new Person
                {
                    Id = 1,
                    Login = "laborant",
                    PasswordHash = "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi",
                    Role = UserRoles.Laborant,
                    FullName = "Иван Лаборантов",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Person
                {
                    Id = 2,
                    Login = "engineer",
                    PasswordHash = "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi",
                    Role = UserRoles.Engineer,
                    FullName = "Петр Инженеров",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new Person
                {
                    Id = 3,
                    Login = "technologist",
                    PasswordHash = "$2a$11$3ufDM9/ALD4/aoVANHk7FuFfFlJPcw8LfzQRlX7e8KQVIR3XfWoYi",
                    Role = UserRoles.Technologist,
                    FullName = "Мария Технологова",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
                );
        }
    }
}
