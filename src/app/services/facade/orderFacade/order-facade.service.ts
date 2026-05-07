import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);

  constructor() { }

  async createOrder (carts: PrestashopCart []) : Promise<void> {

    for (const cart of carts) {
      const idCart = await this.cartService.createCart(cart);
      cart.id = idCart;
      const order : PrestashopOrder = transformCartToOrder(cart);
      await this.orderService.createOrder(order);
    }
  }

}
