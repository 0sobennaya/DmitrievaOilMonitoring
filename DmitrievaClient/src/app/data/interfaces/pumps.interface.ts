export interface PumpInterface{
    id: number;
    mode: number;
    pressureIn: number;
    pressureOut: number;
    temperatureBody: number;
    temperatureBearing: number;
    vibration: number;
    oilLevel: number;
    oilTemperature: number;
    oilPressure: number;
    power: number;
    shaftRotationFrequency: number;
    oilId: number | null
}