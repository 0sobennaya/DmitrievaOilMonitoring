import { Component, inject } from '@angular/core';
import { PumpsService } from '../../data/services/pumps';
import {CommonModule} from '@angular/common'
import { PumpInterface } from '../../data/interfaces/pumps.interface';
import { PumpCard } from './pump-card/pump-card';
@Component({
  selector: 'app-pump-page',
  imports: [PumpCard, CommonModule],
  templateUrl: './pump-page.html',
  styleUrl: './pump-page.css',
})
export class PumpPage {
  PumpsService = inject(PumpsService)
  pumps: PumpInterface[] = []
  error: any = null

  constructor(){
  this.PumpsService.getPumps().subscribe({
    next: value => {
      console.log('Данные получены:', value);
      this.pumps = value;
      console.log('this.pumps после присваивания:', this.pumps);  // ← добавь эту строку
      console.log('Длина массива:', this.pumps.length);
    },
    error: err => {
      console.error('Ошибка при получении данных:', err);
      this.error = err.message
    }
  })
  console.log('PumpCard:', PumpCard);  // должно быть не undefined
  console.log('imports в компоненте:', [PumpCard, CommonModule]);

}


}
