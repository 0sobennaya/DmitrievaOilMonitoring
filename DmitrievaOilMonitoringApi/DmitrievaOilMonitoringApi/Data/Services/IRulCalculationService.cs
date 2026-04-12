using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using System.Threading.Tasks;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IRulCalculationService
    {
        Task<bool> RunRulCalculationAsync();
        Task<IEnumerable<OilForecastPointDTO>> GetForecastPointsAsync(int? pumpId = null);
        Task<RulForecastWithFactDTO> GetForecastWithFactAsync(int pumpId);
        Task<IEnumerable<RulResult>> GetLatestRulResultsAsync();
    }
}