import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../data/services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  authService = inject(AuthService)
  router = inject(Router)
  isError = false; 
  
  form = new FormGroup({
    username: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required)
  })
  onSubmit(event: Event): void {  
  this.isError = false;
  
  if (this.form.valid) {    
    //@ts-ignore
    this.authService.logIn(this.form.value).subscribe({
      next: (data) => {
        this.router.navigate(['/pumps']);
      },
      error: (error) => {        
        this.isError = true;
        this.form.patchValue({
          password: null
        });
                
        setTimeout(() => {
          this.isError = false;
        }, 4000);
      }
    });
  } else {
    console.log('Ошибка авторизации');
  }
}

}
