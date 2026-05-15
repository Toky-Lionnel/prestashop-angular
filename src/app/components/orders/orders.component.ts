import { Order, OrderRow } from '../../models/OrderModel';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';


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
    MatChipsModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  
  private dialogRef = inject(MatDialogRef<OrdersComponent>);
  public orders: Order[] = inject(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'livré': return 'success';
      case 'en attente': return 'warning';
      case 'annulé': return 'error';
      default: return 'primary';
    }
  }

}
