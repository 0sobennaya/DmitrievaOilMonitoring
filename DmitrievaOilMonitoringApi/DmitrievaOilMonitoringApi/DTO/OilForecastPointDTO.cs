namespace DmitrievaOilMonitoringApi.DTO
{
    public class OilForecastPointDTO
    {
        public int PumpId { get; set; }
        public DateTime MeasurementDate { get; set; }
        public int Month { get; set; }
        public double TAN { get; set; }
        public double WaterContentPct { get; set; }
        public double ImpuritiesPct { get; set; }
        public double FlashPointC { get; set; }
        public double MeanVibration { get; set; }
        public double MeanOilTemp { get; set; }
        public double OperatingHours { get; set; }
    }
    public class FactPointDTO
    {
        public int Month { get; set; } 
        public double TAN { get; set; }
        public double WaterContentPct { get; set; }
        public double ImpuritiesPct { get; set; }
        public double FlashPointC { get; set; }
        public double OperatingHours { get; set; }
    }
    public class RulForecastWithFactDTO
    {
        public int PumpId { get; set; }
        public List<FactPointDTO> FactPoints { get; set; } = new();
        public List<OilForecastPointDTO> ForecastPoints { get; set; } = new();
    }

    
}
