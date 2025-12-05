import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PumpInterface } from '../interfaces/pumps.interface';

@Injectable({
  providedIn: 'root',
})
export class PumpsService {
  http = inject(HttpClient)
  baseApiUrl = 'https://localhost:7232/api/';
  getPumps() {
    
    console.log('Запрос на:', `${this.baseApiUrl}Pumps`);
    return this.http.get<PumpInterface[]>(`${this.baseApiUrl}Pumps`);
  }

}
