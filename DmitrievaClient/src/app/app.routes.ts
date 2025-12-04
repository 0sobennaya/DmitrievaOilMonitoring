import { Routes } from '@angular/router';
import { PumpsPage } from './app/pumps-page/pumps-page';
import { OilsPage } from './app/oils-page/oils-page';

export const routes: Routes = [
    { path: '', redirectTo: 'pumps', pathMatch: 'full' },
    { path: 'pumps', component: PumpsPage },
    { path: 'oils', component: OilsPage }
];
