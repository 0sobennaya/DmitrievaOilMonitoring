namespace DmitrievaOilMonitoringApi.Models
{
    public class Oil
    {
        //attributes
        public int Id { get; set; }
        public double TAN { get; set; }
        public double Viscosity { get; set; }
        public double WaterContent { get; set; }
        public DateTime InstallationDate { get; set; }
        public double OperatingHours { get; set; }
        public int StartStopCycles { get; set; }
        //methods
        
        public double GetWear(double currentTemperature)
        {
            if (OperatingHours <= 0 && StartStopCycles <= 0)
                return 0;

            double tempFactor = currentTemperature > 80 ? 1.5 : 1.0;
            return Math.Round((OperatingHours / 1000.0) * tempFactor + StartStopCycles / 100.0, 2);
        }

        public double GetContamination(double currentTemperature)

        {
            if (OperatingHours <= 0)
                return 0;

            double tempFactor = currentTemperature > 90 ? 1.3 : 1.0;
            double waterFactor = WaterContent > 0.5 ? 2.0 : 1.0;
            return Math.Round((OperatingHours / 2000.0) * waterFactor * tempFactor, 2);
        }
        
        public string GetOilStatus(double currentTemperature)
        {
            double wear = GetWear(currentTemperature);
            double contamination = GetContamination(currentTemperature);

            if (wear > 20 || contamination > 8 || WaterContent > 2)
                return "Критическое";
            else if (wear > 15 || contamination > 5 || WaterContent > 1.5)
                return "Предельное";
            else if (wear > 10 || contamination > 3 || WaterContent > 1)
                return "Удовлетворительное";
            else 
                return "Нормальное";
        }

        public bool IsOilGood(double oilTemperature)
        {
            return GetWear(oilTemperature) < 10 &&
                   GetContamination(oilTemperature) < 5 &&
                   WaterContent < 1 &&
                   TAN < 2.0;
        }

        public void UpdateOperatingHours( double additionalHours)
        {
            OperatingHours += additionalHours;
        }
    }

}
