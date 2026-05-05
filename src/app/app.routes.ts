import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "orders", loadComponent: () => import('./pages/orders-list/orders-list.component').then(m => m.OrdersListComponent) }
];
