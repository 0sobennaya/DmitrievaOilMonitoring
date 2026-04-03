import { Component, inject, OnInit, signal } from '@angular/core';
import { OilCard } from '../oil-page/oil-card/oil-card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { OilsService } from '../../data/services/oils';
import { ActivatedRoute, Router } from '@angular/router';
import { OilResponse, OilUpdateRequest } from '../../data/interfaces/oils.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-oil-edit-page',
  imports: [OilCard, CommonModule, MatButtonModule],
  templateUrl: './oil-edit-page.html',
  styleUrl: './oil-edit-page.css',
})
export class OilEditPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private oilsService = inject(OilsService);

  oil= signal<OilResponse | null>(null);
  oilId: number | null = null;
  isEditing = signal(false);
  loading = signal(false);
  originalOil: OilResponse | null = null;
  isChanged = signal(false);
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.oilId = +params['id'];
      this.isEditing.set(false); // сброс режима редактирования
      this.isChanged.set(false);
      this.oil.set(null); // очистить старые данные
      this.loadOilDetails();
    });
  }
  loadOilDetails() {
  if (!this.oilId) {
    return;
  }
  this.oilsService.getOilById(this.oilId).subscribe({
    next: (oil) => {
      this.oil.set(oil);
      this.originalOil = JSON.parse(JSON.stringify(oil));
    },
    error: (err) => {
          }
  });
  }
  startEditing() {
    this.isEditing.set(true);
  }
  cancelEditing() {
  this.isEditing.set(false);
  if (this.originalOil) {
    this.oil.set(JSON.parse(JSON.stringify(this.originalOil)));
  }
  this.isChanged.set(false);
  }
  onOilChanged(updatedOil: OilUpdateRequest) {
    const current = this.oil();
    if (!current) return;

    const merged: OilResponse = { ...current, ...updatedOil };
    this.oil.set(merged);

    this.isChanged.set(
      JSON.stringify(merged) !== JSON.stringify(this.originalOil)
    );
  }
  saveOil() {
  const currentOil = this.oil();
  if (!currentOil || !currentOil.id || !this.isChanged()) {
        return;
  }

  this.loading.set(true);
  
  this.oilsService.updateOil(currentOil).subscribe({
    next: () => {
            this.loading.set(false);
      this.isEditing.set(false);
      this.originalOil = JSON.parse(JSON.stringify(currentOil));
      this.isChanged.set(false);
    },
    error: (err) => {
            this.loading.set(false);
    }
  });
  }
  deleteOil() {
    const currentOil = this.oil();
    
    if (!currentOil|| !currentOil.id) {
            return;
    }

    // Подтверждение удаления
    const confirmed = confirm(`Вы уверены, что хотите удалить масло №${currentOil.id}?`);
    
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
        this.oilsService.deleteOil(currentOil.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/oils']);
      },
      error: (err) => {
                this.loading.set(false);
      }
    });
  }
  goBack() {
    this.router.navigate(['/oils']);
  }

}
