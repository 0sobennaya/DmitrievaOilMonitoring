import { Component, inject, signal } from '@angular/core';
import { PumpsService } from '../../data/services/pumps';
import {CommonModule} from '@angular/common'
import { PumpInterface } from '../../data/interfaces/pumps.interface';
import { PumpCard } from './pump-card/pump-card';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
@Component({
  selector: 'app-pump-page',
  imports: [
    PumpCard,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
  ],
  templateUrl: './pump-page.html',
  styleUrl: './pump-page.css',
})
export class PumpPage {
  private router = inject(Router);
  private PumpsService = inject(PumpsService);

  pumps = signal<PumpInterface[]>([]);
  loading = signal(false);
  
  viewMode = signal<'cards' | 'table'>('cards');
    displayedColumns: string[] = [
    'id',
    'mode',
    'pressureIn',
    'pressureOut',
    'temperatureBody',
    'temperatureBearing',
    'power',
    'shaftRotationFrequency',
    'oilLevel',
    'oilTemperature',
    'oilPressure',
    'vibration',
    'oilId'
  ];

  goToCreate() {
    this.router.navigate(['/pumps/create']);
  }
  goToEdit(pumpId: number) {
    this.router.navigate(['/pump/edit', pumpId]);
  }

  constructor() {
    this.loadPumps();
  }

  loadPumps() {
    this.loading.set(true);
    this.PumpsService.getPumps().subscribe({
      next: (value: PumpInterface[]) => {
        this.pumps.set(value);
        this.loading.set(false);
        console.log('✅ Насосы загружены:', value);
      },
      error: (err) => {
        console.error('❌ Ошибка при получении данных:', err);
        this.loading.set(false);
      }
    });
  }

  // Метод для переключения вида
  toggleViewMode(mode: 'cards' | 'table') {
    this.viewMode.set(mode);
  }
}
