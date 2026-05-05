import { Component, inject } from '@angular/core';
import { Order } from '../../models/OrderModel';
import { OrderService } from '../../services/service/orders/order.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-list',
  imports: [CommonModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss'
})
export class OrdersListComponent {

  // order-list.component.ts

orders: Order[] = [];

private orderService : OrderService = inject(OrderService);

async ngOnInit() {
  this.orders = await this.orderService.getOrdersFull();
}

}
