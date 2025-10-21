using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IOilsService
    {
        Task<IEnumerable<OilDTO>> GetAll();
        Task<OilDTO> GetById(int id);
        Task<OilDTO> Update(int id, OilDTO oilDTO, double temperature);
        Task<Oil> Add(OilDTO oilDTO, double temperature);
        Task Delete(int id);
    }
}
