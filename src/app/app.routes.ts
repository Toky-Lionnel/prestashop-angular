import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { ReinitialisationComponent } from './pages/reinitialisation/reinitialisation.component';
import { OrderListCustomerComponent } from './pages/order-list-customer/order-list-customer.component';
import { ValidationPageComponent } from './pages/validation-page/validation-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
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
    path : 'accueil', component : AccueilComponent
  },
  {
    path : 'orders' , component : OrderListCustomerComponent
  },
  {
    path : 'validation' , component : ValidationPageComponent
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
        {
          path : 'dashboard',
          loadComponent: () =>
            import('./pages/dashboard/dashboard.component')
              .then(m => m.DashboardComponent)
        },
        {
          path : 'products',
          component : ProductListComponent,
          data: {
            isAdmin: true
          }
        },
        {
          path : 'add-stock/:id',
          loadComponent: () =>
            import('./pages/add-stock/add-stock.component')
              .then(m => m.AddStockComponent)
        },
        {
          path : 'reinit',
          component : ReinitialisationComponent
        },
      ]
  },

];
