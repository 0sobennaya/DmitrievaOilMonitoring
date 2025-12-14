import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OilInterface, OilResponse, OilUpdateRequest } from '../interfaces/oils.interface';

@Injectable({
  providedIn: 'root',
})
export class OilsService {
  http = inject(HttpClient)
  baseApiUrl = 'https://localhost:7232/api/';

  getOils() {
    console.log('Запрос на:', `${this.baseApiUrl}Oils`);
    return this.http.get<OilResponse[]>(`${this.baseApiUrl}Oils`);
  }

  getOilById(id: number){
    return this.http.get<OilResponse>(`${this.baseApiUrl}Oils/${id}`);
  }

  updateOil(oil: OilUpdateRequest) {
  return this.http.put<OilResponse>(`${this.baseApiUrl}Oils/${oil.id}`, oil);
  }

  createOil(oil: OilUpdateRequest) {
    return this.http.post<OilResponse>(`${this.baseApiUrl}Oils`, oil);
  }

  deleteOil(id: number) {
    return this.http.delete<void>(`${this.baseApiUrl}Oils/${id}`);
  }

  private convertToInterface(response: OilResponse): OilInterface {
  return {
    id: response.id,
    tan: response.tan,
    viscosity: response.viscosity,
    waterContent: response.waterContent,
    installationDate: response.installationDate,
    operatingHours: response.operatingHours,
    startStopCycles: response.startStopCycles,
    wear: response.wear,
    contamination: response.contamination,
    status: response.status,
    pumpUsage: response.pumpUsage,
  };
  } 
}
