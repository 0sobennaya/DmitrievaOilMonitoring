export interface CriticalWear {
  id: number;
  wear: number;
  operatingHours: number;
}

export interface OilStatistics {
  totalOils: number;
  normalOils: number;
  warningOils: number;
  averageWear: number;
  averageContamination: number;
}
export interface PumpHealth {
  id: number;
  mode: number;
  startStopCycles: number;
  operatingHours: number;
  oilStatus: string;
}
export interface PumpDetails {
  
    pumpId: number,
    oilTemperature : number,
    vibration: number,
    oilContamination: number,
    oilStatus: string;
  
}
export interface OilForecastPointDTO {
  pumpId: number;
  measurementDate: string; 
  month: number;
  tan: number;
  waterContentPct: number;
  impuritiesPct: number;
  flashPointC: number;
  meanVibration: number;
  meanOilTemp: number;
  operatingHours: number;
}