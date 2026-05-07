import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "orders", loadComponent: () => import('./pages/orders-list/orders-list.component').then(m => m.OrdersListComponent) },
  { path: "payment", loadComponent: () => import('./pages/payment-form/payment-form.component').then(m => m.PaymentFormComponent) },
  { path: "import", loadComponent: () => import('./pages/import-file/import-file.component').then(m => m.ImportFileComponent) }
];
