import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { PumpsService } from '../../data/services/pumps';
import { PumpInterface } from '../../data/interfaces/pumps.interface';
import { PumpCard } from '../pump-page/pump-card/pump-card';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pump-edit-page',
  standalone: true,
  imports: [PumpCard, CommonModule, MatButtonModule],
  templateUrl: './pump-edit-page.html',
  styleUrl: './pump-edit-page.css',
})
export class PumpEditPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pumpsService = inject(PumpsService);
  private dialog = inject(MatDialog);


  pump = signal<PumpInterface | null>(null);
  pumpId: number | null = null;
  isEditing = signal(false);
  loading = signal(false);
  originalPump: PumpInterface | null = null;
  isChanged = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.pumpId = +params['id'];
      this.isEditing.set(false); // сброс режима редактирования
      this.isChanged.set(false);
      this.pump.set(null); // очистить старые данные
      this.loadPumpDetails();
    });
  }

  loadPumpDetails() {
  if (!this.pumpId) {
    return;
  }

  
  this.pumpsService.getPumpById(this.pumpId).subscribe({
    next: (pump) => {
      this.pump.set(pump);
      this.originalPump = JSON.parse(JSON.stringify(pump));
    },
    error: (err) => {
      console.error('Ошибка загрузки:', err);
    }
  });
}

  startEditing() {
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.isEditing.set(false);
    if (this.originalPump) {
      this.pump.set(JSON.parse(JSON.stringify(this.originalPump)));
    }
    this.isChanged.set(false);
  }

  onPumpChanged(updatedPump: PumpInterface) {
    this.pump.set(updatedPump);
    // проверяем, изменилось ли что-то
    this.isChanged.set(
      JSON.stringify(updatedPump) !== JSON.stringify(this.originalPump)
    );
  }

  savePump() {
  const currentPump = this.pump();
  

  if (!currentPump || !currentPump.id || !this.isChanged()) {
    console.warn('Ошибка: нет pump или id');
    return;
  }

  this.loading.set(true);
  
  this.pumpsService.updatePump(currentPump).subscribe({
    next: () => {
      console.log('Насос обновлён');
      this.loading.set(false);
      this.isEditing.set(false);
      this.originalPump = JSON.parse(JSON.stringify(currentPump));
      this.isChanged.set(false);
    },
    error: (err) => {
      console.error('Ошибка сохранения:', err);
      this.loading.set(false);
    }
  });
}
deletePump() {
    const currentPump = this.pump();
    
    if (!currentPump || !currentPump.id) {
      console.warn('❌ Нет pump или id');
      return;
    }

    // Подтверждение удаления
    const confirmed = confirm(`Вы уверены, что хотите удалить насос №${currentPump.id}?`);
    
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    console.log('🗑️ Удаляю насос ID:', currentPump.id);

    this.pumpsService.deletePump(currentPump.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/pumps']);
      },
      error: (err) => {
        console.error('Ошибка удаления:', err);
        this.loading.set(false);
      }
    });
  }



  goBack() {
    this.router.navigate(['/pumps']);
  }
}