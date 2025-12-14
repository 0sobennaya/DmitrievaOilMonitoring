export interface OilUpdateRequest {
  id?: number;  
  tan: number;
  viscosity: number;
  waterContent: number;
  installationDate: string;
  operatingHours: number;
  startStopCycles: number;
}
export interface OilResponse extends OilUpdateRequest {
  id: number;
  wear: number;
  contamination: number;
  status: string;
  pumpUsage: {
    pumpId: number;
    oilTemperature: number;
    pumpStatus: string;
  };
}
export interface OilInterface {
  id: number;
  // Редактируемые поля
  tan: number;
  viscosity: number;
  waterContent: number;
  installationDate: string;
  operatingHours: number;
  startStopCycles: number;
  // Вычисленные поля (только для чтения)
  wear?: number;
  contamination?: number;
  status?: string;
  pumpUsage?: {
    pumpId: number;
    oilTemperature: number;
    pumpStatus: string;
  };
}
export type OilCreateRequest = Omit<OilUpdateRequest, 'id'>;