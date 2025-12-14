import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../data/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header{
  authService = inject(AuthService);
  cookieService = inject(CookieService);
  router = inject(Router);
  
  constructor() {
    this.authService.isAuth;  
  }

  get username(): string {
    if (!this.authService.username) {
      this.authService.username = this.authService.cookieService?.get('username') || null;
    }
    return this.authService.username || 'Пользователь';
  }

  get role(): string {
    return this.authService.getRole() || 'User';
  }

  onLogout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
