import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { OilsService } from '../../data/services/oils';
import { OilUpdateRequest } from '../../data/interfaces/oils.interface';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-oil-create-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
    ],
  templateUrl: './oil-create-page.html',
  styleUrl: './oil-create-page.css',
})
export class OilCreatePage implements OnInit  {
  private router = inject(Router);
  private  oilsService = inject(OilsService);
  private fb = inject(FormBuilder);
  
  loading = signal(false);
  oilForm!: FormGroup;

  ngOnInit() {
    this.initForm();
      }
  initForm() {
    this.oilForm = this.fb.group({
      tan: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      viscosity: [0, [Validators.required, Validators.min(3.8), Validators.max(26.1)]],
      waterContent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      installationDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      operatingHours: [0, [Validators.required, Validators.min(0)]],
      startStopCycles: [0, [Validators.required, Validators.min(0)]],
  });
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
  createOil() {
  // помечаем все поля как тронутые, чтобы показать ошибки
  Object.keys(this.oilForm.controls).forEach(key => {
    this.oilForm.get(key)?.markAsTouched();
  });

  if (!this.oilForm.valid) {
        return;
  }

  const oil = this.oilForm.value as OilUpdateRequest;
  this.loading.set(true);

  this.oilsService.createOil(oil).subscribe({
    next: (createdOil) => {
      this.loading.set(false);
      this.router.navigate(['/oils']);
    },
    error: (err) => {
            this.loading.set(false);
    }
  });
  }
  cancel() {
    this.router.navigate(['/oils']);
  }
}
