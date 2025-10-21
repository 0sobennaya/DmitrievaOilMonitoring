using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace DmitrievaOilMonitoringApi.Data
{
    public class OilMonitoringApiContext : DbContext 
    {
        public OilMonitoringApiContext(DbContextOptions<OilMonitoringApiContext> options) : base(options) { }
        public DbSet<Oil> Oils { get; set; }
    }
}
