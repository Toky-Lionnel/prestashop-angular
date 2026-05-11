import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: "orders", loadComponent: () => import('./pages/orders-list/orders-list.component').then(m => m.OrdersListComponent) , canActivate: [AuthGuard] },
  { path: "payment", loadComponent: () => import('./pages/payment-form/payment-form.component').then(m => m.PaymentFormComponent) , canActivate: [AuthGuard] },
  { path: "import", loadComponent: () => import('./pages/import-file/import-file.component').then(m => m.ImportFileComponent), canActivate: [AuthGuard] }
];
