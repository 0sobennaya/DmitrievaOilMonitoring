import { Component } from '@angular/core';

@Component({
  selector: 'app-pumps-page',
  standalone: true,
  template: `
    <h1>Насосы</h1>
    <p>Здесь будет список и карточки насосов.</p>
  `,
  styles: [`
    h1 { margin-bottom: 16px; }
  `]
})
export class PumpsPage {}
