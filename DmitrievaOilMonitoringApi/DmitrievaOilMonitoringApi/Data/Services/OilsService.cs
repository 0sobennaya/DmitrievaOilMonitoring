using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc.Formatters.Xml;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public class OilsService : IOilsService
    {
        private readonly OilMonitoringApiContext _context;
        public OilsService(OilMonitoringApiContext context)
        {
            _context = context;
        }
        private static OilDTO OilToDTO(Oil oil) =>
            new OilDTO
            {
                TAN = oil.TAN,
                Viscosity = oil.Viscosity,
                WaterContent = oil.WaterContent,
                InstallationDate = oil.InstallationDate,
                OperatingHours = oil.OperatingHours,
                StartStopCycles = oil.StartStopCycles
                
            };
        private static OilResponseDTO OilToResponseDTO(Oil oil) =>
            new OilResponseDTO
            {
                Id = oil.Id,
                TAN = oil.TAN,
                Viscosity = oil.Viscosity,
                WaterContent = oil.WaterContent,
                InstallationDate = oil.InstallationDate,
                OperatingHours = oil.OperatingHours,
                StartStopCycles = oil.StartStopCycles,
                Wear = oil.Wear,
                Contamination = oil.Contamination,
                Status = oil.Status
            };

        public async Task<Oil> Add(OilDTO oilDTO, double temperature)
        {            
            var oil = new Oil
            {
                TAN = oilDTO.TAN,
                Viscosity = oilDTO.Viscosity,
                WaterContent = oilDTO.WaterContent,
                InstallationDate = oilDTO.InstallationDate ?? DateTime.Now,
                OperatingHours = oilDTO.OperatingHours,
                StartStopCycles = oilDTO.StartStopCycles

            };
            oil.Wear = oil.GetWear(temperature);
            oil.Contamination = oil.GetContamination(temperature);
            oil.Status = oil.GetOilStatus(temperature);

            _context.Oils.Add(oil);
            await _context.SaveChangesAsync();
            return oil;
            
        }

        public async Task Delete(int id)
        {
            var oil = await _context.Oils.FindAsync(id);
            if (oil != null) 
            { 
                _context.Oils.Remove(oil);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<OilDTO>> GetAll()
        {
            return await _context.Oils.Select( x => OilToResponseDTO(x)).ToListAsync();
        }
        public async Task<OilDTO> GetById(int id)
        {
            var oil =  await _context.Oils.FindAsync(id);
            return OilToResponseDTO(oil);
        }

        public async Task<OilDTO> Update(int id, OilDTO oilDTO, double temperature)
        {
            var oil = await _context.Oils.FindAsync(id);
            if (oil != null) {
                oil.TAN = oilDTO.TAN;
                oil.Viscosity = oilDTO.Viscosity;
                oil.WaterContent = oilDTO.WaterContent;
                oil.OperatingHours = oilDTO.OperatingHours;
                oil.StartStopCycles = oilDTO.StartStopCycles;
                oil.Wear = oil.GetWear(temperature);
                oil.Contamination = oil.GetContamination(temperature);
                oil.Status = oil.GetOilStatus(temperature);
                await _context.SaveChangesAsync();
            }
            return oilDTO;
        }

        //============ LINQ ================\\
        public async Task<IEnumerable<CriticalWearDTO>> GetCriticalWearOils()
        {
            return await _context.Oils.Where(s => s.Status == "Критическое").Select(o => new CriticalWearDTO
            {
                Id = o.Id,
                Wear = o.Wear,
                Status = o.Status,
                OperatingHours = o.OperatingHours
            }).ToListAsync();
        }

        public async Task<StatisticsDTO> GetStatistics()
        {
            var totalOils = await _context.Oils.CountAsync();

            if (totalOils == 0)
            {
                return new StatisticsDTO
                {
                    TotalOils = 0,
                    NormalOils = 0,
                    WarningOils = 0,
                    AverageWear = 0,
                    AverageContamination = 0
                };
            }
            var normalOils = await _context.Oils.CountAsync(o => o.Status == "Нормальное");
            var warningOils = await _context.Oils.CountAsync(o => o.Status != "Нормальное");
            var averageWear = await _context.Oils.AverageAsync(o => o.Wear);
            var averageContamination = await _context.Oils.AverageAsync(o => o.Contamination);

            return new StatisticsDTO
            {
                TotalOils = totalOils,
                NormalOils = normalOils,
                WarningOils = warningOils,
                AverageWear = averageWear,
                AverageContamination = averageContamination
            };

        }
    }
}
