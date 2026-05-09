import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';
import { OrderStateService } from '../../service/order-state/order-state.service';
import { PrestashopOrderHistory, transformOrderToOrderHistory } from '../../../models/order-history.model';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);
  private orderHistoryService: OrderStateService = inject(OrderStateService);

  constructor() { }

  async createOrder (carts: PrestashopCart []) : Promise<void> {

    for (const cart of carts) {
      const idCart = await this.cartService.createCart(cart);
      cart.id = idCart;


      const order : PrestashopOrder = transformCartToOrder(cart);
      const idOrder = await this.orderService.createOrder(order);

      await this.orderHistoryService.loadOrderStates();

      // eto mila validation
      const idState = this.orderHistoryService.getOrderStateIdByName(order.order_state ?? '');

      console.log(idState);

      console.log(idOrder);



      const orderState : PrestashopOrderHistory = transformOrderToOrderHistory(order);
      orderState.id_order_state = idState ?? 0;
      orderState.id_order = idOrder?? 0;
      await this.orderHistoryService.createOrderState(orderState);
    }
  }

}
