import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, of, tap, throwError } from 'rxjs';
import { CriticalWear, OilForecastPointDTO, OilStatistics, PumpDetails, PumpHealth, RulForecastWithFactDTO } from '../interfaces/stats.interface';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class StatsService {
  runRulCalculation() {
    throw new Error('Method not implemented.');
  }
    
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
    catchError(error => {
      return throwError(() => error);
    })
  );
}


getCriticalWear() {
  return this.http.get<CriticalWear[]>(`${this.baseApiUrl}Oils/critical-wear`).pipe(
    catchError(error => {
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
 getForecastPoints(pumpId?: number) {
    const url = pumpId
      ? `${this.baseApiUrl}RulCalculation/forecast-points?pumpId=${pumpId}`
      : `${this.baseApiUrl}RulCalculation/forecast-points`;

    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<OilForecastPointDTO[]>(url, { headers }).pipe(
      // Используем map, чтобы вернуть пустой массив, если пришёл null или undefined
      map(response => response || []),
      catchError(error => {
        console.error(`Ошибка загрузки точек прогноза для PumpId ${pumpId}:`, error);
        // Возвращаем пустой массив в случае ошибки
        return of([]);
      })
    );
  }
  getForecastWithFact(pumpId: number) {
  const url = `${this.baseApiUrl}RulCalculation/forecast-with-fact?pumpId=${pumpId}`;
  const token = this.authService.token;
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.get<RulForecastWithFactDTO>(url, { headers });
}

}