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
        public long OperatingHours { get; set; }
    }
}
