import { Routes } from '@angular/router';
import { PumpPage } from './app/pump-page/pump-page';
import { OilPage } from './app/oil-page/oil-page';
import { LoginPage } from './app/login-page/login-page';
import { Layout } from './layout/layout';
import { canActivateAuth } from './auth/access.guard';
export const routes: Routes = [
  { path: '', component: Layout, children:[
    { path: '', component: PumpPage },
    { path: 'pumps', component: PumpPage },
    { path: 'oils', component: OilPage }

  ],
  canActivate: [canActivateAuth]
  },
  { path: 'login', component: LoginPage }
];
