import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'loginadmin', pathMatch: 'full' },
  {
    path: 'loginadmin', component: LoginComponent ,
  },
  {
    path: 'admin',
      canActivate: [AuthGuard],
      children: [
        {
          path: 'orders',
          loadComponent: () =>
            import('./pages/orders-list/orders-list.component')
              .then(m => m.OrdersListComponent)
        },
        {
          path: 'import',
          loadComponent: () =>
            import('./pages/import-file/import-file.component')
              .then(m => m.ImportFileComponent)
        },
      ]
  },

];
