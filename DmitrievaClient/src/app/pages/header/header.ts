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

  get username(): string {
      return this.cookieService.get('username') || 'Пользователь';
  }

  get role(): string {
      return this.cookieService.get('role') || 'User';
  }

  onLogout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
