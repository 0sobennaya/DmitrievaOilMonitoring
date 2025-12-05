import { Component, Input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { PumpInterface } from '../../../data/interfaces/pumps.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pump-card',
  standalone: true, 
  imports: [MatCard, CommonModule],
  templateUrl: './pump-card.html',
  styleUrl: './pump-card.css',
})
export class PumpCard {
  @Input() pump!: PumpInterface;
}