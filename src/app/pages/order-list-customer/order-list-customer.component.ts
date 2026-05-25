import { Component, OnInit, inject } from '@angular/core';
import { OrdersComponent } from '../../components/orders/orders.component';
import { Order } from '../../models/OrderModel';
import { SessionService } from '../../services/service/session/session.service';
import { OrderService } from '../../services/service/orders/order.service';
import { CartService } from '../../services/service/cart/cart.service';
import { NavbarFrontComponent } from "../../shared/navbar-front/navbar-front.component";

@Component({
  selector: 'app-order-list-customer',
  imports: [OrdersComponent, NavbarFrontComponent],
  templateUrl: './order-list-customer.component.html',
  styleUrl: './order-list-customer.component.scss'
})
export class OrderListCustomerComponent implements OnInit {

  orders : Order [] = [];

  private sessionService : SessionService = inject(SessionService);
  private orderService : OrderService = inject(OrderService);
  private cartService : CartService = inject(CartService);

  constructor () {
  }

  async ngOnInit(): Promise<void> {
    const idCustomer = this.sessionService.getCustomer()?.id;
    const orders : Order [] = await this.orderService.getOrdersFull(undefined,idCustomer,true);
    const carts : Order [] = await this.cartService.getCartMapped(idCustomer) || [];

    this.orders = [...orders, ... carts];
  }

}
