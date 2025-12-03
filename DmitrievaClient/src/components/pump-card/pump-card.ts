import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Pump {
  id: number;
  mode: PumpMode;
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
  oil?: { id: number; name: string } | null;
  oilId?: number | null;
}

export enum PumpMode {
  Running= 0,
  Off = 1,
  Reserve = 2,
  Repairing = 3
}

@Component({
  selector: 'app-pump-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pump-card.html',
  styleUrls: ['./pump-card.css']
})
export class PumpCard {
  @Input() pump!: Pump;

  getModeLabel(mode: PumpMode): string {
    const labels: { [key in PumpMode]: string } = {
      [PumpMode.Running]: 'Работает',
      [PumpMode.Off]: 'Остановлен',
      [PumpMode.Reserve]: 'Резерв',
      [PumpMode.Repairing]: 'Ремонт'
    };
    return labels[mode] || 'Неизвестно';
  }

  getModeClass(mode: PumpMode): string {
    const classes: { [key in PumpMode]: string } = {
      [PumpMode.Off]: 'mode--off',
      [PumpMode.Reserve]: 'mode--reserve',
      [PumpMode.Running]: 'mode--running',
      [PumpMode.Repairing]: 'mode--repairing'
    };
    return classes[mode] || '';
  }

  isNormalRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }
}
