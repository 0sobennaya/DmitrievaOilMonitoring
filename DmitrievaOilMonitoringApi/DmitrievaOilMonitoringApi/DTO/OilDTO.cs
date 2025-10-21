using System.ComponentModel.DataAnnotations;

namespace DmitrievaOilMonitoringApi.DTO
{
    public class OilDTO
    {

        [Required(ErrorMessage = "TAN обязательно")]
        [Range(0, 5.0, ErrorMessage = "TAN допускается в диапазоне 0.0 - 5.0")]
        public double TAN { get; set; }

        [Required(ErrorMessage = "Вязкость обязательна")]
        [Range(3.8, 26.1, ErrorMessage = "Вязкость допускается в диапазоне 3.8 - 26.1")]
        public double Viscosity { get; set; }

        [Required(ErrorMessage = "Содержание воды обязательно")]
        [Range(0, 100.0, ErrorMessage = "Содержание воды допускается в диапазоне от 0 до 100%")]
        public double WaterContent { get; set; }

        // Опциональное для Update, обязательное для Create
        public DateTime? InstallationDate { get; set; }

        [Required(ErrorMessage = "Часы эксплуатации обязательны")]
        [Range(0, double.MaxValue, ErrorMessage = "Часы эксплуатации должны быть положительным числом")]
        public double OperatingHours { get; set; }

        [Required(ErrorMessage = "Количество циклов обязательно")]
        [Range(0, int.MaxValue, ErrorMessage = "Количество циклов должно быть положительным числом")]
        public int StartStopCycles { get; set; }
    }

    public class OilResponseDTO : OilDTO
    {
        public int Id { get; set; }
        public double Wear {  get; set; }
        public double Contamination { get; set; }
        public string Status { get; set; }
    }
    public class CriticalWearDTO
    {
        public int Id { get; set; }
        public double Wear { get; set; }
        public string Status { get; set; }
        public double OperatingHours { get; set; }
    }
    public class StatisticsDTO
    {
        public int TotalOils { get; set; }
        public int NormalOils { get; set; }
        public int WarningOils { get; set; }
        public double AverageWear { get; set; }
        public double AverageContamination { get; set; }
    }
}
