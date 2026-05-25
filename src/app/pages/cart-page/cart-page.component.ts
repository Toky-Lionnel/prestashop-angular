import { Component } from '@angular/core';
import { CartComponent } from '../../components/cart/cart.component';
import { NavbarFrontComponent } from '../../shared/navbar-front/navbar-front.component';

@Component({
  selector: 'app-cart-page',
  imports: [CartComponent,NavbarFrontComponent],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {

}
