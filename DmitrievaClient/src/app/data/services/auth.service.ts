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

    get isAuth(){
        if (!this.token){
            this.token = this.cookieService.get('token')
        }
        return !!this.token
    }

    logIn(payload: {username: string, password: string}){
        return this.http.post<TokenResponse>(`${this.baseApiUrl}token`, payload).pipe(
            tap(val => {
                this.token = val.access_token
                this.cookieService.set('token',this.token)
            })
        );
    }
}