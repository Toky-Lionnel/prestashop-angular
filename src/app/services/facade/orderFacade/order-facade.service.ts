import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';
import { OrderStateService } from '../../service/order-state/order-state.service';
import { PrestashopOrderHistory, transformOrderToOrderHistory } from '../../../models/order-history.model';
import { CustomerService } from '../../service/customer/customer.service';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);
  private orderHistoryService: OrderStateService = inject(OrderStateService);
  private customerService : CustomerService = inject(CustomerService);

  constructor() { }

  async createOrder (carts: PrestashopCart []) : Promise<void> {

    for (const cart of carts) {

      const idCustomer = await this.customerService.getIdCustomerByEmail(cart.customer_email ?? '');
      if (!idCustomer) {
        console.error('Cannot create order: Customer not found for email:', cart.customer_email);
        continue; // Skip this order and move to the next one
      }

      const idAddress = await this.customerService.getAddressByIdCustomer(idCustomer);
      if (!idAddress) {
        console.error('Cannot create order: Address not found for customer ID:', idCustomer);
        continue; // Skip this order and move to the next one
      }
      cart.id_address_delivery = idAddress;
      cart.id_address_invoice = idAddress;
      cart.id_customer = idCustomer;

      
      const idCart = await this.cartService.createCart(cart);
      cart.id = idCart;

      const order : PrestashopOrder = transformCartToOrder(cart);
      const idOrder = await this.orderService.createOrder(order);
      await this.orderHistoryService.loadOrderStates();

      const idState = this.orderHistoryService.getOrderStateIdByName(order.order_state ?? '');
      const orderState : PrestashopOrderHistory = transformOrderToOrderHistory(order);
      orderState.id_order_state = idState ?? 0;
      orderState.id_order = idOrder?? 0;
      await this.orderHistoryService.createOrderState(orderState);
    }
  }

}
