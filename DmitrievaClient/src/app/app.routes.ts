import { Routes } from '@angular/router';
import { PumpPage } from './pages/pump-page/pump-page';
import { OilPage } from './pages/oil-page/oil-page';
import { LoginPage } from './pages/login-page/login-page';
import { Layout } from './layout/layout';
import { canActivateAuth } from './auth/access.guard';
import { PumpEditPage } from './pages/pump-edit-page/pump-edit-page';
import { PumpCreatePage } from './pages/pump-create-page/pump-create-page';
import { OilCreatePage } from './pages/oil-create-page/oil-create-page';
import { OilEditPage } from './pages/oil-edit-page/oil-edit-page';
export const routes: Routes = [
  { path: '', component: Layout, children:[
    { path: '', component: PumpPage },
    { path: 'pumps', component: PumpPage },
    { path: 'oils', component: OilPage },
    { path: 'pump/edit/:id', component: PumpEditPage},
    {path: 'pumps/create',  component: PumpCreatePage},
    { path: 'oils/create', component: OilCreatePage },
    { path: 'oil/edit/:id', component: OilEditPage },

  ],
  canActivate: [canActivateAuth]
  },
  { path: 'login', component: LoginPage }
];
