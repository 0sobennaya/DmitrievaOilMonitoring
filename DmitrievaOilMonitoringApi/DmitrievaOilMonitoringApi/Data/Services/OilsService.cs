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
        private static OilResponseDTO OilToResponseDTO(Oil oil, Pump? pump = null)
        {
            var dto = new OilResponseDTO
            {
                Id = oil.Id,
                TAN = oil.TAN,
                Viscosity = oil.Viscosity,
                WaterContent = oil.WaterContent,
                InstallationDate = oil.InstallationDate,
                OperatingHours = oil.OperatingHours,
                StartStopCycles = oil.StartStopCycles
            };

            // Если масло используется в насосе
            if (pump != null)
            {
                // Вычисляем характеристики с учётом температуры насоса
                dto.Wear = oil.GetWear(pump.OilTemperature);
                dto.Contamination = oil.GetContamination(pump.OilTemperature);
                dto.Status = oil.GetOilStatus(pump.OilTemperature);

                // Добавляем информацию о насосе
                dto.PumpUsage = new PumpUsageDTO
                {
                    PumpId = pump.Id,
                    OilTemperature = pump.OilTemperature,
                    PumpStatus = pump.GetOverallStatus()
                };
            }
            else
            {
                // Если масло не используется — дефолтные значения
                dto.Wear = oil.Wear;
                dto.Contamination = oil.Contamination;
                dto.Status = oil.Status;
                dto.PumpUsage = null;
            }

            return dto;
        }

        public async Task<OilResponseDTO> Add(OilDTO oilDTO)
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
            oil.Wear = 0.0;
            oil.Contamination = 0.0;
            oil.Status = "Нормальное";

            _context.Oils.Add(oil);
            await _context.SaveChangesAsync();
            return OilToResponseDTO(oil);
            
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

        public async Task<IEnumerable<OilResponseDTO>> GetAll()
        {
            var oils = await _context.Oils
                .AsNoTracking()
                .ToListAsync();

            var result = new List<OilResponseDTO>();

            foreach (var oil in oils)
            {
                // Ищем насос, в котором используется это масло
                var pump = await _context.Pumps
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.OilId == oil.Id);

                result.Add(OilToResponseDTO(oil, pump));
            }

            return result;
        }

        public async Task<OilResponseDTO> Update(int id, OilDTO oilDTO)
        {
            var oil = await _context.Oils.FindAsync(id);
            if (oil != null) {
                oil.TAN = oilDTO.TAN;
                oil.Viscosity = oilDTO.Viscosity;
                oil.WaterContent = oilDTO.WaterContent;
                oil.OperatingHours = oilDTO.OperatingHours;
                oil.StartStopCycles = oilDTO.StartStopCycles;
                await _context.SaveChangesAsync();
            }
            // Ищем насос для отображения актуальных характеристик
            var pump = await _context.Pumps
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.OilId == oil.Id);

            return OilToResponseDTO(oil, pump);

        }
        public OilCharacteristicsDTO CalculateCharacteristics(Oil oil, double temperature)
        {
            if (oil == null) return null;

            var wear = oil.GetWear(temperature);
            var contamination = oil.GetContamination(temperature);
            var status = oil.GetOilStatus(temperature);

            return new OilCharacteristicsDTO
            {
                Wear = wear,
                Contamination = contamination,
                Status = status
            };
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

        public async Task<OilResponseDTO?> GetById(int id)
        {
            var oil = await _context.Oils
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == id);

            if (oil == null) return null;

            // Ищем насос, в котором используется это масло
            var pump = await _context.Pumps
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.OilId == oil.Id);

            return OilToResponseDTO(oil, pump);
        }
    }
}
