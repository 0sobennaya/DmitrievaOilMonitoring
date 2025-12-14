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
import { AuthService } from '../../data/services/auth.service';
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
  constructor(public auth: AuthService) {
    this.loadPumps();
  }
  private router = inject(Router);
  private PumpsService = inject(PumpsService);

  pumps = signal<PumpInterface[]>([]);
  filteredPumps = signal<PumpInterface[]>([]); 
  searchId = signal<string>('');    
  selectedMode = signal<number | null>(null); 
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

  loadPumps() {
    this.loading.set(true);
    this.PumpsService.getPumps().subscribe({
      next: (value: PumpInterface[]) => {
        this.pumps.set(value);
        this.filterBySearch();
        this.loading.set(false);
        console.log('Насосы загружены:', value);
      },
      error: (err) => {
        console.error('Ошибка при получении данных:', err);
        this.loading.set(false);
      }
    });
    
  }
  onSearchChange(id: string) {
    this.searchId.set(id.trim());
    this.filterBySearch();
  }
  onModeChange(value: string) {
  if (value === '') {
    this.selectedMode.set(null);
  } else {
    this.selectedMode.set(Number(value));
  }
  this.filterBySearch();
}


 filterBySearch() {
  const id = this.searchId();
  const mode = this.selectedMode();

  const filtered = this.pumps().filter(p => {
    // Проверяем ID, если задан
    if (id && !p.id?.toString().includes(id)) {
      return false;
    }
    
    // Проверяем режим, если задан
    if (mode !== null && p.mode !== mode) {
      return false;
    }
    
    return true;
  });

  this.filteredPumps.set(filtered);
}



  // Метод для переключения вида
  toggleViewMode(mode: 'cards' | 'table') {
    this.viewMode.set(mode);
  }
  
}