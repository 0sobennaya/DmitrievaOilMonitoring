import { Component } from '@angular/core';

@Component({
  selector: 'app-oils-page',
  standalone: true,
  template: `
    <h1>Масла</h1>
    <p>Здесь будет список и карточки масел.</p>
  `,
  styles: [`
    h1 { margin-bottom: 16px; }
  `]
})
export class OilsPage {}
