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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Pump>()
                .HasOne(p => p.Oil)
                .WithOne()
                .HasForeignKey<Pump>(p => p.OilId)
                .OnDelete(DeleteBehavior.SetNull);
        }

    }
}
