import { Component, inject, signal } from '@angular/core';
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
  pumps = signal<PumpInterface[]>([]);

  constructor(){
  this.PumpsService.getPumps().subscribe({
    next: (value : PumpInterface[])=> {
      this.pumps.set(value);
    },
    error: err => {
      console.error('Ошибка при получении данных:', err);
    }
  })

}


}
