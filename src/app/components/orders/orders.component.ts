import { Order, OrderRow } from '../../models/OrderModel';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/service/cart/cart.service';


@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {

  private dialogRef = inject(MatDialogRef<OrdersComponent>);
  public orders: Order[] = inject(MAT_DIALOG_DATA);
  private cartService : CartService = inject(CartService);

  public currentOrderDetails: any = null;
  public isLoadingDetails: boolean = false;

  close(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'livré': return 'success';
      case 'en attente': return 'warning';
      case 'Non commandé': return 'error';
      default: return 'primary';
    }
  }


  async openDetails(order: Order) {
    this.isLoadingDetails = true;
    this.currentOrderDetails = null;

    try {
      if (order.recent_statut !== 'Non commandé') {
        this.currentOrderDetails = {
          order: order,
          products: order.products
        };
      } else {
        const details = await this.cartService.getCartDetails(order);
        this.currentOrderDetails = {
          order: order,
          products: details.products
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      this.currentOrderDetails = {
        order: order,
        products: [],
        error: 'Impossible de charger les détails'
      };
    } finally {
      this.isLoadingDetails = false;
    }
  }

  closeDetails() {
    this.currentOrderDetails = null;
  }

}



