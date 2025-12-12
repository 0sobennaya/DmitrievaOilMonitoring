import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { PumpInterface } from '../../../data/interfaces/pumps.interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-pump-card',
  standalone: true, 
  imports: [MatCard, CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './pump-card.html',
  styleUrl: './pump-card.css',
})
export class PumpCard {
  @Input() pump!: PumpInterface;
  @Input() isEditing = false; //  режим редактированввия
  @Output() pumpChanged = new EventEmitter<PumpInterface>(); // эмитит изменения
  // @Input() oils: OilInterface[] = [];

  pumpForm!: FormGroup;

  constructor(private fb: FormBuilder) {}
   
  ngOnInit() {
    this.initForm();
  }
  ngOnChanges(changes: SimpleChanges) {
    if ((changes['pump'] || changes['isEditing']) && this.pump) {
    this.initForm();
  }
  }

  initForm() {
    this.pumpForm = this.fb.group({
      id: [this.pump?.id],
      mode: [this.pump?.mode, [Validators.required, Validators.min(0), Validators.max(3)]],
      pressureIn: [this.pump?.pressureIn, [Validators.required, Validators.min(0), Validators.max(1000)]],
      pressureOut: [this.pump?.pressureOut, [Validators.required, Validators.min(0), Validators.max(1000)]],
      temperatureBody: [this.pump?.temperatureBody, [Validators.required, Validators.min(-50), Validators.max(200)]],
      temperatureBearing: [this.pump?.temperatureBearing, [Validators.required, Validators.min(-50), Validators.max(200)]],
      power: [this.pump?.power, [Validators.required, Validators.min(0), Validators.max(10000)]],
      shaftRotationFrequency: [this.pump?.shaftRotationFrequency, [Validators.required, Validators.min(0), Validators.max(10000)]],
      oilLevel: [this.pump?.oilLevel, [Validators.required, Validators.min(0), Validators.max(100)]],
      oilTemperature: [this.pump?.oilTemperature, [Validators.required, Validators.min(0), Validators.max(150)]],
      oilPressure: [this.pump?.oilPressure, [Validators.required, Validators.min(0), Validators.max(500)]],
      vibration: [this.pump?.vibration, [Validators.required, Validators.min(0), Validators.max(100)]],
      oilId: [this.pump?.oilId]
    });
  }

  updatePump() {
    if (this.pumpForm.valid) {
      const updatedPump = this.pumpForm.value;
      this.pump = updatedPump;
      this.pumpChanged.emit(this.pump);
    } else {
      console.warn('Форма невалидна!');
    }
  }
  getError(fieldName: string): string | null {
    const control = this.pumpForm.get(fieldName);
    if (control?.invalid && control?.touched) {
      if (control.hasError('required')) return 'Обязательное поле';
      if (control.hasError('min')) return `Минимум: ${control.getError('min').min}`;
      if (control.hasError('max')) return `Максимум: ${control.getError('max').max}`;
    }
    return null;
  }
}