import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
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
            this.role = this.cookieService.get('role') || null;
        }
        return this.role;
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
}