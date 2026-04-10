using System.ComponentModel.DataAnnotations;

namespace DmitrievaOilMonitoringApi.Models
{
    public class RulResult
    {
        public int Id { get; set; } // Первичный ключ, будет автоматически увеличиваться

        [Required]
        public int PumpId { get; set; } // связь с таблицей Pumps

        [Required]
        public DateTime CurrentDate { get; set; } // Дата последнего замера при расчете

        [Required]
        public int RulWarningMonths { get; set; }

        [Required]
        public int RulCriticalMonths { get; set; }

        [Required]
        public double RulWarningYears { get; set; }

        [Required]
        public double RulCriticalYears { get; set; }
        [Required]
        public DateTime ReplacementDateWarning { get; set; }

        [Required]
        public DateTime ReplacementDateCritical { get; set; }

        [MaxLength(50)] // Установите подходящую длину
        public string LimitingParamWarning { get; set; } = string.Empty;

        [MaxLength(50)]
        public string LimitingParamCritical { get; set; } = string.Empty;

        [Required]
        public long OperatingHoursAtCalculation { get; set; }
    }
}
