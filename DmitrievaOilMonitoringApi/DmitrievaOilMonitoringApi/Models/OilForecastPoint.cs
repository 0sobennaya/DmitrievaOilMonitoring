using System.ComponentModel.DataAnnotations;

namespace DmitrievaOilMonitoringApi.Models
{
    public class OilForecastPoint
    {
        public int Id { get; set; } // Primary key

        [Required]
        public int PumpId { get; set; }

        [Required]
        public DateTime MeasurementDate { get; set; }

        [Required]
        public int Month { get; set; } // 1..60

        [Required]
        public double TAN { get; set; }

        [Required]
        public double WaterContentPct { get; set; }

        [Required]
        public double ImpuritiesPct { get; set; }

        [Required]
        public double FlashPointC { get; set; }

        [Required]
        public double MeanVibration { get; set; }

        [Required]
        public double MeanOilTemp { get; set; }

        [Required]
        public long OperatingHours { get; set; }
    }
}
