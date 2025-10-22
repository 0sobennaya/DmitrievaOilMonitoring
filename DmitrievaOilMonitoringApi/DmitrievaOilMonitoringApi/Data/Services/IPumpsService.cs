using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public interface IPumpsService
    {
        Task<IEnumerable<PumpResponseDTO>> GetAll();
        Task<PumpResponseDTO> GetById(int id);
        Task<PumpResponseDTO> Update(int id, PumpDTO pumpDTO);
        Task<PumpResponseDTO> Add(PumpDTO pumpDTO);
        Task Delete(int id);
    }
}
