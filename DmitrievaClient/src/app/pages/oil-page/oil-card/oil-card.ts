import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { OilInterface, OilResponse, OilUpdateRequest } from '../../../data/interfaces/oils.interface';

@Component({
  selector: 'app-oil-card',
  imports: [MatCard, CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './oil-card.html',
  styleUrl: './oil-card.css',
})
export class OilCard {
  @Input() oil!: OilInterface;
  @Input() isEditing = false;
  @Output() oilChanged = new EventEmitter<OilUpdateRequest>();

  oilForm!: FormGroup;

  constructor(private fb: FormBuilder) {}
   
  ngOnInit() {
    this.initForm();
  }
  ngOnChanges(changes: SimpleChanges) {
    if ((changes['oil'] || changes['isEditing']) && this.oil) {
      this.initForm();
    }
  }
  initForm() {
    this.oilForm = this.fb.group({
      id: [this.oil?.id],
      tan: [this.oil?.tan, [Validators.required, Validators.min(0), Validators.max(5)]],
      viscosity: [this.oil?.viscosity, [Validators.required, Validators.min(3.8), Validators.max(26.1)]],
      waterContent: [this.oil?.waterContent, [Validators.required, Validators.min(0), Validators.max(100)]],
      installationDate: [this.oil?.installationDate, [Validators.required]],
      operatingHours: [this.oil?.operatingHours, [Validators.required, Validators.min(0)]],
      startStopCycles: [this.oil?.startStopCycles, [Validators.required, Validators.min(0)]]
    });
  }
  updateOil() {
    if (this.oilForm.valid) {
      const updatedOil: OilUpdateRequest = this.oilForm.value;
      this.oilChanged.emit(updatedOil);
    } else {
      console.warn('Форма невалидна!');
    }
  }
  getError(fieldName: string): string | null {
    const control = this.oilForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      if (control.hasError('required')) return 'Обязательное поле';
      if (control.hasError('min')) return `Минимум: ${control.getError('min').min}`;
      if (control.hasError('max')) return `Максимум: ${control.getError('max').max}`;
    }
    return null;
  }
  getDaysFromInstallation(): number {
    if (!this.oil?.installationDate) return 0;
    const installationDate = new Date(this.oil.installationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - installationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
