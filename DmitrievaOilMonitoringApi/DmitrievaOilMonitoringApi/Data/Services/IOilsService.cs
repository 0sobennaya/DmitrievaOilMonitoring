using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IOilsService
    {
        Task<IEnumerable<OilResponseDTO>> GetAll();
        Task<OilResponseDTO> GetById(int id);
        Task<OilResponseDTO> Update(int id, OilUpdateDTO oilDTO);
        Task<OilResponseDTO> Add(OilDTO oilDTO);
        Task Delete(int id);
        Task<IEnumerable<CriticalWearDTO>> GetCriticalWearOils();
        Task <StatisticsDTO> GetStatistics();
    }
}
