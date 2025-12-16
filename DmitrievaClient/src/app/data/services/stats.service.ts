import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { CriticalWear, OilStatistics, PumpDetails, PumpHealth } from '../interfaces/stats.interface';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class StatsService {
    
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private baseApiUrl = 'https://localhost:7232/api/';
  
  getOilStatistics() {
  const token = this.authService.token;
  return this.http.get<OilStatistics>(
    `${this.baseApiUrl}Oils/oil-statistics`,
    {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    }
  ).pipe(
    tap(data => console.log('Ответ:', data)),
    catchError(error => {
      console.error('Ошибка:', error);
      return throwError(() => error);
    })
  );
}


getCriticalWear() {
  return this.http.get<CriticalWear[]>(`${this.baseApiUrl}Oils/critical-wear`).pipe(
    tap(data => console.log('Критический износ:', data)),
    catchError(error => {
      console.error('Ошибка загрузки критического износа:', error);
      return throwError(() => error);
    })
  );
}

getPumpsHealth(){
    return this.http.get<PumpHealth[]>(`${this.baseApiUrl}Pumps/pumps-and-oils-health`)
  }

getPumpDetails(){
  return this.http.get<PumpDetails[]>(`${this.baseApiUrl}Pumps/pump-vibration-and-oil-contanimation`)
}

}
