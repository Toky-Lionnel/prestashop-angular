import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'loginadmin', component: LoginComponent ,
  },
  {
    path: 'products', component : ProductListComponent
  },
  {
    path: 'cart', component : CartPageComponent
  },
  {
    path: 'checkout', component : CheckoutComponent
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
