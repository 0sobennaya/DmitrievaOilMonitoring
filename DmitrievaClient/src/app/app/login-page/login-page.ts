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
  
  form = new FormGroup({
    username: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required)
  })
  onSubmit(event: Event){
    if (this.form.valid) {
      //@ts-ignore
      this.authService.logIn(this.form.value)
      .subscribe({
        next: (data) =>{
          this.router.navigate(['/pumps']);
          console.log(data);
      }
    })
    } else {
      console.log('Ошибка авторизации - поля пустые');
    }
  }

}
