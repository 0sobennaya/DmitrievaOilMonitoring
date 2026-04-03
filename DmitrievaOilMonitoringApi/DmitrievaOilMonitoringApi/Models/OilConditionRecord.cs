using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace DmitrievaOilMonitoringApi.Models
{
    public class OilConditionRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PumpId { get; set; }

        [Required]
        public DateTime MeasurementDate { get; set; }

        [Required]
        public double TAN { get; set; }

        [Required]
        public double WaterContentPct { get; set; }

        [Required]
        public double ImpuritiesPct { get; set; }

        [Required]
        public double FlashPointC { get; set; }

        public bool IsTopup { get; set; } = false;

        public bool HasLeak { get; set; } = false;

        [Required]
        public double MeanVibration { get; set; }

        [Required]
        public double MeanOilTemp { get; set; }

        [Required]
        public double MeanBearingTemp { get; set; }

        [Required]
        public double OperatingHours { get; set; }
    }
}
