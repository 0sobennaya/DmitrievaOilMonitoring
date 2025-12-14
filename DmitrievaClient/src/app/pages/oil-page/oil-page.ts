import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OilCard } from './oil-card/oil-card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { OilsService } from '../../data/services/oils';
import { OilInterface } from '../../data/interfaces/oils.interface';
import { AuthService } from '../../data/services/auth.service';

@Component({
  selector: 'app-oil-page',
  imports: [
    OilCard,
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
  ],
  templateUrl: './oil-page.html',
  styleUrl: './oil-page.css',
})
export class OilPage {
  private router = inject(Router);

  oils = signal<OilInterface[]>([]);
  constructor(private oilsService: OilsService,public auth: AuthService ) {
  this.oilsService.getOils().subscribe({
    next: (oils: OilInterface[]) => this.oils.set(oils)
  });
}
  loading = signal(false);
  viewMode = signal<'cards' | 'table'>('cards');

  displayedColumns: string[] = [
  'id',
  'tan',
  'viscosity',
  'waterContent',
  'installationDate',
  'operatingHours',
  'startStopCycles',
  'wear',           
  'contamination',  
  'status',         
  'PumpId'
  ];
  ngOnInit() {
    this.loadOils();
  }
  loadOils() {
    this.loading.set(true);
    this.oilsService.getOils().subscribe({
      next: (data: OilInterface[]) => {
        this.oils.set(data);
        this.loading.set(false);
        console.log('Масла загружены:', data);
      },
      error: (err) => {
        console.error(' Ошибка загрузки:', err);
        this.loading.set(false);
      }
    });
  }
  goToCreate() {
    this.router.navigate(['/oils/create']);
  }

  toggleViewMode(mode: 'cards' | 'table') {
    this.viewMode.set(mode);
  }

  goToEdit(oilId: number) {
    this.router.navigate(['/oil/edit', oilId]);
  }
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

}
