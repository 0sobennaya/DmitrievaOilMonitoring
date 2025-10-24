using DmitrievaOilMonitoringApi.DTO;
using DmitrievaOilMonitoringApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Security.Cryptography;

namespace DmitrievaOilMonitoringApi.Data.Services
{
    public class PumpsService : IPumpsService
    {
        private readonly OilMonitoringApiContext _context;
        public PumpsService(OilMonitoringApiContext context)
        {
            _context = context;
        }


        private static PumpResponseDTO PumpToResponseDTO(Pump pump)
        {
            var dto = new PumpResponseDTO
            {
                Id = pump.Id,
                Mode = pump.Mode,
                PressureIn = pump.PressureIn,
                PressureOut = pump.PressureOut,
                TemperatureBody = pump.TemperatureBody,
                TemperatureBearing = pump.TemperatureBearing,
                Vibration = pump.Vibration,
                OilLevel = pump.OilLevel,
                OilTemperature = pump.OilTemperature,
                OilPressure = pump.OilPressure,
                Power = pump.Power,
                ShaftRotationFrequency = pump.ShaftRotationFrequency,
                Efficiency = pump.CalculateEfficiency(),
                Status = pump.GetOverallStatus(pump.OilTemperature),
                OilId = pump.OilId
            };

            if (pump.Oil != null)
            {
                dto.Oil = new OilResponseDTO
                {
                    Id = pump.Oil.Id,
                    TAN = pump.Oil.TAN,
                    Viscosity = pump.Oil.Viscosity,
                    WaterContent = pump.Oil.WaterContent,
                    InstallationDate = pump.Oil.InstallationDate,
                    OperatingHours = pump.Oil.OperatingHours,
                    StartStopCycles = pump.Oil.StartStopCycles,
                    Wear = pump.Oil.GetWear(pump.OilTemperature),
                    Contamination = pump.Oil.GetContamination(pump.OilTemperature),
                    Status = pump.Oil.GetOilStatus(pump.OilTemperature)
                };

                dto.OilWear = dto.Oil.Wear;
                dto.OilContamination = dto.Oil.Contamination;
                dto.OilStatus = dto.Oil.Status;
            }
            else
            {
                dto.Oil = null;
                dto.OilWear = 0;
                dto.OilContamination = 0;
                dto.OilStatus = "Масло отсутствует";
            }

            return dto;
        }

        public async Task<PumpResponseDTO> Add(PumpDTO pumpDTO)
        {
            Oil? oil = null;
            if (pumpDTO.OilId.HasValue)
            {
                oil = await _context.Oils.FindAsync(pumpDTO.OilId.Value);
                if (oil == null)
                {
                    throw new ArgumentException($"Масло с ID {pumpDTO.OilId} не найдено");
                }
            }

            var pump = new Pump
            {
                Mode = pumpDTO.Mode,
                PressureIn = pumpDTO.PressureIn,
                PressureOut = pumpDTO.PressureOut,
                TemperatureBody = pumpDTO.TemperatureBody,
                TemperatureBearing = pumpDTO.TemperatureBearing,
                Vibration = pumpDTO.Vibration,
                OilLevel = pumpDTO.OilLevel,
                OilTemperature = pumpDTO.OilTemperature,
                OilPressure = pumpDTO.OilPressure,
                Power = pumpDTO.Power,
                ShaftRotationFrequency = pumpDTO.ShaftRotationFrequency,
                Oil = oil,
                OilId = oil?.Id
            };

            _context.Pumps.Add(pump);
            await _context.SaveChangesAsync();

            return PumpToResponseDTO(pump);
        }

        public async Task Delete(int id)
        {
            var pump = await _context.Pumps.FindAsync(id);
            if (pump != null)
            {
                _context.Pumps.Remove(pump);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<PumpResponseDTO>> GetAll()
        {
            var pumps = await _context.Pumps
                .Include(p => p.Oil)
                .AsNoTracking()
                .ToListAsync();

            return pumps.Select(PumpToResponseDTO).ToList();
        }

        public async Task<PumpResponseDTO> GetById(int id)
        {
            var pump = await _context.Pumps
                .AsNoTracking()
                .Include(p => p.Oil)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pump == null)
                return null;

            return PumpToResponseDTO(pump);
        }

        public async Task<PumpResponseDTO> Update(int id, PumpDTO pumpDTO)
        {
            var pump = await _context.Pumps
                .Include(p => p.Oil)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pump == null)
                return null;

            // Обновляем параметры насоса
            pump.Mode = pumpDTO.Mode;
            pump.PressureIn = pumpDTO.PressureIn;
            pump.PressureOut = pumpDTO.PressureOut;
            pump.TemperatureBody = pumpDTO.TemperatureBody;
            pump.TemperatureBearing = pumpDTO.TemperatureBearing;
            pump.Vibration = pumpDTO.Vibration;
            pump.OilLevel = pumpDTO.OilLevel;
            pump.OilTemperature = pumpDTO.OilTemperature;
            pump.OilPressure = pumpDTO.OilPressure;
            pump.Power = pumpDTO.Power;
            pump.ShaftRotationFrequency = pumpDTO.ShaftRotationFrequency;

            if (pumpDTO.OilId.HasValue)
            {
                // Если передан новый OilId
                if (pump.OilId != pumpDTO.OilId.Value)
                {
                    var newOil = await _context.Oils.FindAsync(pumpDTO.OilId.Value);
                    if (newOil == null)
                    {
                        throw new ArgumentException($"Масло с ID {pumpDTO.OilId} не найдено");
                    }

                    pump.OilId = newOil.Id;
                    pump.Oil = newOil;
                }
            }
            else
            {
                // Если OilId = null, удаляем масло из насоса
                pump.OilId = null;
                pump.Oil = null;
            }

            await _context.SaveChangesAsync();

            // Отключаем отслеживание для свежей загрузки данных
            _context.Entry(pump).State = EntityState.Detached;

            return await GetById(id);
        }
        //============ LINQ ================\\
        public async Task<IEnumerable<PumpsAndOilsHealthDTO>> GetPumpsAndOilsHeath()
        {
            var pumps = await _context.Pumps
                .Include(pump => pump.Oil)
                .AsNoTracking()
                .ToListAsync();
            var query = pumps
                .Where(pump => pump.Oil != null)
                .Select(pump => new PumpsAndOilsHealthDTO
                {
                    Id = pump.Id,
                    Mode = pump.Mode,
                    StartStopCycles = pump.Oil.StartStopCycles,
                    OperatingHours = pump.Oil.OperatingHours,
                    OilStatus = pump.OilStatus
                })
                .OrderByDescending(pump => pump.OperatingHours)
                .ToList();
            return query;
        }
        public async Task<IEnumerable<VibrationAndContaminationDTO>> GetVibrationAndContamination()
        {
            var pumpsWithOils = await _context.Pumps
                .Include(p => p.Oil)
                .AsNoTracking()
                .ToListAsync();

            var filtered = pumpsWithOils
                .Where(po => po.Vibration > 8 && po.Oil != null && po.Oil.GetContamination(po.OilTemperature) > 1)
                .Select(po => new VibrationAndContaminationDTO
                {
                    PumpId = po.Id,
                    Vibration = po.Vibration,
                    OilContamination = po.Oil.GetContamination(po.OilTemperature),
                    OilStatus = po.Oil.GetOilStatus(po.OilTemperature)
                })
                .ToList();

            return filtered;
        }
    }
}
