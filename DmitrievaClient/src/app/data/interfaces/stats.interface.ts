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