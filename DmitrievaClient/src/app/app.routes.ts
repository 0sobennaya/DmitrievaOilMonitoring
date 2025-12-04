import { Routes } from '@angular/router';
import { PumpPage } from './app/pump-page/pump-page';
import { OilPage } from './app/oil-page/oil-page';
export const routes: Routes = [
    
  { path: '', redirectTo: 'pumps', pathMatch: 'full' },
  { path: 'pumps', component: PumpPage },
  { path: 'oils', component: OilPage }
];
