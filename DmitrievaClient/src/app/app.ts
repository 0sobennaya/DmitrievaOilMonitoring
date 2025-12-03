import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pump, PumpCard, PumpMode } from '../components/pump-card/pump-card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PumpCard],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  pumps: Pump[] = [
    {
      id: 1,
      mode: PumpMode.Running,
      pressureIn: 2.5,
      pressureOut: 45.8,
      temperatureBody: 65.2,
      temperatureBearing: 58.4,
      vibration: 2.1,
      oilLevel: 85.5,
      oilTemperature: 52.3,
      oilPressure: 3.2,
      power: 15.5,
      shaftRotationFrequency: 1450,
      oil: { id: 1, name: 'Масло №1' }
    },
    {
      id: 2,
      mode: PumpMode.Off,
      pressureIn: 0,
      pressureOut: 0,
      temperatureBody: 25.0,
      temperatureBearing: 24.5,
      vibration: 0,
      oilLevel: 90.0,
      oilTemperature: 25.0,
      oilPressure: 0,
      power: 0,
      shaftRotationFrequency: 0,
      oil: { id: 1, name: 'Масло №2' }
    },
    {
      id: 2,
      mode: PumpMode.Running,
      pressureIn: 1,
      pressureOut: 5,
      temperatureBody: 75.0,
      temperatureBearing: 58.5,
      vibration: 10,
      oilLevel: 90.0,
      oilTemperature: 55.0,
      oilPressure: 10,
      power: 10,
      shaftRotationFrequency: 3000,
      oil: { id: 1, name: 'Масло №2' }
    }
    // Добавьте больше насосов сюда
  ];
}
