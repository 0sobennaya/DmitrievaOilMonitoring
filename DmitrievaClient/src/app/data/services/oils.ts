import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OilInterface } from '../interfaces/oils.interface';

@Injectable({
  providedIn: 'root',
})
export class OilsService {
  http = inject(HttpClient)
  baseApiUrl = 'https://localhost:7232/api/';

  getOils() {
    console.log('Запрос на:', `${this.baseApiUrl}Oils`);
    return this.http.get<OilInterface[]>(`${this.baseApiUrl}Oils`);
  }

//   getOilById(id: number){
//     return this.http.get<OilInterface>(`${this.baseApiUrl}Oils/${id}`);
//   }

  updateOil(oil: OilInterface) {
  return this.http.put<OilInterface>(`${this.baseApiUrl}Oils/${oil.id}`, oil);
  }

  createOil(oil: Omit<OilInterface, 'id'>) {
    return this.http.post<OilInterface>(`${this.baseApiUrl}Oils`, oil);
  }

  deleteOil(id: number) {
    return this.http.delete<void>(`${this.baseApiUrl}Oils/${id}`);
  }
}
