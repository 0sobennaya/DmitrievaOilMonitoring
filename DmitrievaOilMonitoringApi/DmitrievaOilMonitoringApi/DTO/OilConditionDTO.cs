namespace DmitrievaOilMonitoringApi.DTO
{
    public class OilConditionDTO
    {
        public int PumpId { get; set; }
        public DateTime MeasurementDate { get; set; } = DateTime.UtcNow;

        public double TAN { get; set; }
        public double WaterContentPct { get; set; }
        public double ImpuritiesPct { get; set; }
        public double FlashPointC { get; set; }

        public double MeanVibration { get; set; }
        public double MeanOilTemp { get; set; }
        public double OperatingHours { get; set; }

        public bool IsTopup { get; set; } = false;
        public bool HasLeak { get; set; } = false;
    }
}
