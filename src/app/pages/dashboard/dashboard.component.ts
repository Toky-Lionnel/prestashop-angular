import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/service/orders/order.service';
import { Order } from '../../models/OrderModel';
import { CategoryStockSummary } from '../../components/category-stock-list/category-stock-list.component';
import { StockStatService } from '../../services/service/stock-stat/stock-stat.service';
import { CategoryStockListComponent } from '../../components/category-stock-list/category-stock-list.component';
import { SalesComponent } from '../../components/sales/sales.component';
import { CategorySalesSummary } from '../../models/category-sales-summary.model';
import { VenteService } from '../../services/service/vente/vente.service';
import { NavbarBackComponent } from '../../shared/navbar-back/navbar-back.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryStockListComponent, SalesComponent,NavbarBackComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  total_orders_jour : number = 0;
  total_orders_general : number = 0;
  nb_orders_jour : number = 0;
  nb_orders_general : number = 0;

  salesCategorySummary : CategorySalesSummary[] = [];
  stocksCategorySummary : CategoryStockSummary[] = [];

  stocksLoaded = false;
  salesLoaded = false;
  stocksLoading = false;
  salesLoading = false;


  // Date par défaut : aujourd'hui
  selectedDate: string = new Date().toISOString().split('T')[0];

  private orderService : OrderService = inject(OrderService);
  private stockStatService : StockStatService = inject(StockStatService);
  private venteService : VenteService = inject(VenteService);

  async onFilterDate() {
    const orders_date = await this.orderService.getOrdersFull(this.selectedDate);
    this.total_orders_jour = this.calculTotalOrders(orders_date);
    this.nb_orders_jour = orders_date.length;
  }

  async ngOnInit() {
    const [orders, ordersToday] = await Promise.all([
      this.orderService.getOrdersFull(),
      this.orderService.getOrdersFull(this.selectedDate)
    ]);

    this.total_orders_general = this.calculTotalOrders(orders);
    this.nb_orders_general = orders.length;

    this.total_orders_jour = this.calculTotalOrders(ordersToday);
    this.nb_orders_jour = ordersToday.length;
  }

  async loadStocks() {
    if (this.stocksLoaded || this.stocksLoading) {
      return;
    }

    this.stocksLoading = true;

    try {
      this.stocksCategorySummary = await this.stockStatService.getCategoryStockSummary();
      this.stocksLoaded = true;
    } finally {
      this.stocksLoading = false;
    }
  }

  async loadSales() {
    if (this.salesLoaded || this.salesLoading) {
      return;
    }

    this.salesLoading = true;

    try {
      this.salesCategorySummary = await this.venteService.getSalesByCategory();
      this.salesLoaded = true;
    } finally {
      this.salesLoading = false;
    }
  }


  calculTotalOrders (orders : Order []) : number {
    let total = 0;
    for (let i = 0; i < orders.length; i++) {
      total += orders[i].total_paid;
    }
    return total;
  }


}
