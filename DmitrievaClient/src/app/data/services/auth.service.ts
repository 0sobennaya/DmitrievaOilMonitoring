import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, tap, throwError } from "rxjs";
import { TokenResponse } from "../interfaces/auth.interface";
import {CookieService} from "ngx-cookie-service"
@Injectable({
    providedIn: 'root'
})
export class AuthService{
    http = inject(HttpClient)
    cookieService = inject(CookieService)
    baseApiUrl = 'https://localhost:7232/api/Account/';
    token: string | null = null;
    username: string | null = null;
    role: string | null = null;

    get isAuth(){
        if (!this.token){
            this.token = this.cookieService.get('token');
            this.username = this.cookieService.get('username');
            this.role = this.cookieService.get('role');
        }
        return !!this.token
    }
    getRole(): string | null {
    if (!this.role) {
        const roleFromCookie = this.cookieService.get('role');
        if (roleFromCookie) {
        this.role = roleFromCookie;
        }
    }
    return this.role || null;
    }


    hasRole(roles: string | string[]): boolean {
    const current = this.getRole();
    if (!current) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(current);
    }


    logIn(payload: {username: string, password: string}) {
    return this.http.post<TokenResponse>(`${this.baseApiUrl}token`, payload).pipe(
        tap(val => {
                   
            const tokenData = val.value;
            this.token = tokenData.access_token;
            this.username = tokenData.username;  
            this.role = tokenData.role;
            
            this.cookieService.set('token', tokenData.access_token, { secure: false, sameSite: 'Lax' });
            this.cookieService.set('username', tokenData.username, { secure: false, sameSite: 'Lax' });
            this.cookieService.set('role', tokenData.role, { secure: false, sameSite: 'Lax' });
            
        })
    );
    }

    logOut(): void {
        this.token = null;
        this.username = null;
        this.role = null;
        
        this.cookieService.delete('token');
        this.cookieService.delete('username');
        this.cookieService.delete('role');
    }
    


    register(payload: {login: string, password: string, fullName: string, role: UserRole}) {
  return this.http.post<{login: string, role: UserRole, fullName: string}>(`${this.baseApiUrl}register`, payload).pipe(
    tap(val => {
      console.log('Регистрация успешна:', val);
    }),
    catchError(error => {
      console.error('Ошибка регистрации:', error);
      return throwError(() => error);
    })
  );
}
}
export enum UserRole {
        Technologist = 'Technologist',
        Laborant = 'Laborant',
        Engineer = 'Engineer'
    }