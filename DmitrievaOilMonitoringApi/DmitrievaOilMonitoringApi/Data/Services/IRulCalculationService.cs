using System.Threading.Tasks;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IRulCalculationService
    {
        Task<bool> RunRulCalculationAsync();
    }
}