using DmitrievaOilMonitoringApi.Models;
using System.ComponentModel.DataAnnotations;

namespace DmitrievaOilMonitoringApi.DTO
{
    public class PumpDTO
    {
        public PumpMode Mode { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Давление на входе должно быть положительным")]
        public double PressureIn { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Давление на выходе должно быть положительным")]
        public double PressureOut { get; set; }

        public double TemperatureBody { get; set; }
        public double TemperatureBearing { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Вибрация должна быть положительным числом")]
        public double Vibration { get; set; }

        [Range(0, 100, ErrorMessage = "Уровень масла должен быть от 0 до 100%")]
        public double OilLevel { get; set; }

        public double OilTemperature { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Давление масла должно быть положительным")]
        public double OilPressure { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Мощность должна быть положительным числом")]
        public double Power { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Частота вращения должна быть положительным числом")]
        public double ShaftRotationFrequency { get; set; }
        public string Status { get; set; } = string.Empty;
        public OilResponseDTO? Oil { get; set; }
    }

    public class PumpResponseDTO : PumpDTO
    {
        public int Id { get; set; }
        // Вычисляемые характеристики насоса
        public double Efficiency { get; set; }

        // Вычисляемые характеристики масла для этого насоса
        public double? OilWear{ get; set; }
        public double? OilContamination { get; set; }
        public string? OilStatus { get; set; } = string.Empty;
    }
    

}
