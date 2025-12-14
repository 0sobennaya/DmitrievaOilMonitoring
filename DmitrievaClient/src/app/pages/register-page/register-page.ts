import { Component, inject } from '@angular/core';
import { AuthService, UserRole } from '../../data/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-page',
  imports:[ReactiveFormsModule, RouterModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  authService = inject(AuthService)
  router = inject(Router)
  isError = false;
  errorMessage = '';
  
  form = new FormGroup({
    login: new FormControl(null, [Validators.required, Validators.minLength(3)]),
    password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
    fullName: new FormControl(null, Validators.required),
    role: new FormControl<UserRole>(UserRole.Laborant, Validators.required)
  })

  onSubmit(event: Event): void {  
    this.isError = false;
    
    if (this.form.valid) {    
      //@ts-ignore
      this.authService.register(this.form.value).subscribe({
        next: (data) => {
          this.router.navigate(['/pumps']);
        },
        error: (error) => {        
          this.isError = true;
          this.errorMessage = error.error?.message || 'Ошибка регистрации';
          this.form.patchValue({
            password: null
          });
          
          setTimeout(() => {
            this.isError = false;
          }, 4000);
        }
      });
    } else {
      console.log('Ошибка валидации формы');
    }
  }
}