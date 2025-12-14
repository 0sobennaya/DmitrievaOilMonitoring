import { Component, EventEmitter, inject, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { PumpInterface } from '../../../data/interfaces/pumps.interface';
import { OilInterface } from '../../../data/interfaces/oils.interface';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { OilsService } from '../../../data/services/oils';
import { signal } from '@angular/core';

@Component({
  selector: 'app-pump-card',
  standalone: true, 
  imports: [
    MatCard, 
    CommonModule, 
    RouterLink, 
    ReactiveFormsModule,
    MatOptionModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './pump-card.html',
  styleUrl: './pump-card.css',
})
export class PumpCard implements OnInit {
  @Input() pump!: PumpInterface;
  @Input() isEditing = false; // режим редактирования
  @Output() pumpChanged = new EventEmitter<PumpInterface>(); // эмитит изменения

  pumpForm!: FormGroup;

  // Сигналы для масел
  oils = signal<OilInterface[]>([]);
  loadingOils = signal(false);

  constructor(
    private fb: FormBuilder,
    private oilsService: OilsService
  ) {}
   
  ngOnInit() {
    this.initForm();
    this.loadOils();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['pump'] || changes['isEditing']) && this.pump) {
      this.initForm();
    }
  }

  loadOils() {
    this.loadingOils.set(true);
    this.oilsService.getOils().subscribe({
      next: (response: any) => {
        console.log('Загруженные масла:', response);
        // Преобразуем ответ в массив OilInterface
        const oilsArray = Array.isArray(response) ? response : (response.data || []);
        this.oils.set(oilsArray as OilInterface[]);
        this.loadingOils.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки масел:', err);
        this.oils.set([]);
        this.loadingOils.set(false);
      },
    });
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
      oilId: [this.pump?.oilId, Validators.required]
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

  // Вспомогательный метод для отображения информации о масле
  getOilInfo(oilId: number | undefined): OilInterface | undefined {
    if (!oilId) return undefined;
    return this.oils().find(oil => oil.id === oilId);
  }
}
