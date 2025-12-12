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

  getPumpById(id: number){
    return this.http.get<PumpInterface>(`${this.baseApiUrl}Pumps/${id}`);
  }

  updatePump(pump: PumpInterface) {
  return this.http.put<PumpInterface>(`${this.baseApiUrl}Pumps/${pump.id}`, pump);
  }

  createPump(pump: Omit<PumpInterface, 'id'>) {
    return this.http.post<PumpInterface>(`${this.baseApiUrl}Pumps`, pump);
  }

  deletePump(id: number) {
    return this.http.delete<void>(`${this.baseApiUrl}Pumps/${id}`);
  }
}
