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
                    PumpStatus = pump.GetOverallStatus(pump.OilTemperature)
                };
            }
            else
            {
                // Если масло не используется — дефолтные значения
                dto.Wear = 0;
                dto.Contamination = 0;
                dto.Status = "Нормальное";
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

        public async Task<OilResponseDTO> Update(int id, OilUpdateDTO oilDTO)
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
            // Загружаем все масла и все насосы
            var oils = await _context.Oils.ToListAsync();
            var pumps = await _context.Pumps.ToListAsync();

            var query =
                from oil in oils
                join pump in pumps on oil.Id equals pump.OilId into oilPumps
                from pump in oilPumps.DefaultIfEmpty()
                let temperature = pump?.OilTemperature ?? 0
                let status = oil.GetOilStatus(temperature)
                where status == "Критическое"
                select new CriticalWearDTO
                {
                    Id = oil.Id,
                    Wear = oil.GetWear(temperature),
                    OperatingHours = oil.OperatingHours
                };

            return query.ToList();
        }

        public async Task<StatisticsDTO> GetStatistics()
        {
            var oils = await _context.Oils.ToListAsync();
            var pumps = await _context.Pumps.ToListAsync();

            var stats =
                from oil in oils
                join pump in pumps on oil.Id equals pump.OilId into oilPumps
                from pump in oilPumps.DefaultIfEmpty()
                let temperature = pump?.OilTemperature ?? 0
                select new
                {
                    OilId = oil.Id,  
                    Status = oil.GetOilStatus(temperature),
                    Wear = oil.GetWear(temperature),
                    Contamination = oil.GetContamination(temperature)
                };

            var groupedStats = stats
                .GroupBy(s => s.OilId)
                .Select(g => g.First()) 
                .ToList();

            int totalOils = groupedStats.Count();
            if (totalOils == 0)
            {
                return new StatisticsDTO();
            }

            int normalOils = groupedStats.Count(s => s.Status == "Нормальное");
            int warningOils = groupedStats.Count(s => s.Status != "Нормальное");
            double avgWear = groupedStats.Average(s => s.Wear);
            double avgContamination = groupedStats.Average(s => s.Contamination);

            return new StatisticsDTO
            {
                TotalOils = totalOils,
                NormalOils = normalOils,
                WarningOils = warningOils,
                AverageWear = avgWear,
                AverageContamination = avgContamination
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
