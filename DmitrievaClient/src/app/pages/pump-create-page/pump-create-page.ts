import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import { PumpsService } from '../../data/services/pumps';
import { Router } from '@angular/router';
import { PumpInterface } from '../../data/interfaces/pumps.interface';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OilsService } from '../../data/services/oils';
import { OilInterface } from '../../data/interfaces/oils.interface';

@Component({
  selector: 'app-pump-create-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './pump-create-page.html',
  styleUrl: './pump-create-page.css',
})
export class PumpCreatePage implements OnInit {
  private router = inject(Router);
  private pumpsService = inject(PumpsService);
  private fb = inject(FormBuilder);
  private oilsService = inject(OilsService); 
  
  loading = signal(false);
  pumpForm!: FormGroup;
  oils: OilInterface[] = [];             

  ngOnInit() {
    this.initForm();
    this.loadOils();                     
      }
  loadOils() {
    this.oilsService.getOils().subscribe({
      next: (response: any) => {
        const allOils = response as OilInterface[];
        // Фильтруем только масла без насоса
        this.oils = allOils.filter(oil => !oil.pumpUsage?.pumpId);
      },
      error: err => {
                this.oils = [];
      }
    });
  }

  initForm() {
    this.pumpForm = this.fb.group({
      mode: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      pressureIn: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
      pressureOut: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
      temperatureBody: [0, [Validators.required, Validators.min(-50), Validators.max(200)]],
      temperatureBearing: [0, [Validators.required, Validators.min(-50), Validators.max(200)]],
      power: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      shaftRotationFrequency: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      oilLevel: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      oilTemperature: [0, [Validators.required, Validators.min(0), Validators.max(150)]],
      oilPressure: [0, [Validators.required, Validators.min(0), Validators.max(500)]],
      vibration: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      oilId: [null, Validators.required],
    });
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

  createPump() {    
    Object.keys(this.pumpForm.controls).forEach(key => {
      this.pumpForm.get(key)?.markAsTouched();
    });

    if (!this.pumpForm.valid) {
            return;
    }

    const pump = this.pumpForm.value as PumpInterface;
    this.loading.set(true);

    this.pumpsService.createPump(pump).subscribe({
      next: (createdPump) => {
        this.loading.set(false);
        this.router.navigate(['/pumps']);
      },
      error: (err) => {
                this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/pumps']);
  }
}