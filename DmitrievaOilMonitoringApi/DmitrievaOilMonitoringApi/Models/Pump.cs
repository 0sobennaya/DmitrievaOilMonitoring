namespace DmitrievaOilMonitoringApi.Models
{
    public enum PumpMode
    {
        Работает,
        Остановлен,
        Резерв,
        Ремонт
    }
    public class Pump
    {
        public int Id { get; set; }
        public PumpMode Mode { get; set; }
        public double PressureIn { get; set; }
        public double PressureOut { get; set; }
        public double TemperatureBody { get; set; }
        public double TemperatureBearing { get; set; }
        public double Vibration { get; set; }
        public double OilLevel { get; set; }
        public double OilTemperature { get; set; }
        public double OilPressure { get; set; }
        public double Power { get; set; }
        public double ShaftRotationFrequency { get; set; }

        public Oil? Oil { get; set; }
        public int? OilId { get; set; }

        // Вычисляемые характеристики масла
        public double OilWear => Oil?.GetWear(OilTemperature) ?? 0;
        public double OilContamination => Oil?.GetContamination(OilTemperature) ?? 0;
        public string OilStatus => Oil?.GetOilStatus(OilTemperature) ?? "Масло отсутствует";
        
        public double CalculateEfficiency()
        {
            if (Power == 0) return 0;
            return Math.Round((PressureOut - PressureIn) * 10 / Power, 2);
        }

        public bool IsVibrationCritical()
        {
            return Vibration > 5.0;
        }

        public string GetTemperatureStatus()
        {
            double maxTemp = Math.Max(TemperatureBody, TemperatureBearing);

            if (maxTemp > 90)
                return "Критическая";
            else if (maxTemp > 70)
                return "Повышенная";
            else
                return "Нормальная";
        }

        public string GetOverallStatus()
        {
            bool vibrationOk = !IsVibrationCritical();
            bool temperatureOk = GetTemperatureStatus() != "Критическая";
            bool oilOk = Oil?.IsOilGood() ?? false;
            bool pressureOk = PressureOut > PressureIn;

            if (vibrationOk && temperatureOk && oilOk && pressureOk)
                return "Исправен";
            else if (!vibrationOk || !temperatureOk)
                return "Критическое состояние";
            else
                return "Требует обслуживания";
        }
    }
}
