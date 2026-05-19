import { Order } from '../../models/OrderModel';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/service/cart/cart.service';
import { OrderStateService } from '../../services/service/order-state/order-state.service';
import { PrestashopCart, PrestashopCartAssociations, PrestashopCartRow } from '../../models/cart.model';
import { SessionService } from '../../services/service/session/session.service';
import { CustomerService } from '../../services/service/customer/customer.service';
import { PrestashopOrder, transformCartToOrder } from '../../models/order.model';
import { OrderService } from '../../services/service/orders/order.service';
import { FormsModule } from "@angular/forms";
import { ValidationComponent } from '../validation/validation.component';
import { Router } from '@angular/router';


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
    MatProgressSpinnerModule,
    FormsModule
],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {

  private dialogRef = inject(MatDialogRef<OrdersComponent>);
  public orders: Order[] = inject(MAT_DIALOG_DATA);
  private cartService : CartService = inject(CartService);
  private orderStateService : OrderStateService = inject(OrderStateService);
  private sessionService : SessionService = inject(SessionService);
  private customerService : CustomerService = inject(CustomerService);
  private orderService : OrderService = inject(OrderService);


  private router : Router = inject(Router);
  private dialog = inject(MatDialog);

  public currentOrderDetails: any = null;
  public isLoadingDetails: boolean = false;

  nombreDuplicate : number = 1;


  onQtyChange(event: Event, item: number): void {
      const input = event.target as HTMLInputElement;
      const newQty = parseInt(input.value, 10);
      this.nombreDuplicate = newQty;
  }

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

  async updateOrderStatus(order: Order, status: number) {
    await this.orderStateService.updateOrderState(order.id, status);
    // Mettre à jour le statut localement pour refléter le changement immédiatement
    const updatedStatusName = this.orderStateService.getOrderStateNameById(status);
    if (updatedStatusName) {
      order.recent_statut = updatedStatusName;
    }
  }

  async transformToOrder(order: Order) {
    const idCart = order.id; // Utiliser l'ID du panier pour créer la commande

    const customerAdress = await this.customerService.getAddressByIdCustomer(this.sessionService.getCustomer()?.id ?? 0);
    const cartsItems = await this.cartService.getCartById(idCart ?? 0);
    const cartRows = cartsItems?.associations[0].cart_rows[0].cart_row;

    const carts : PrestashopCartRow [] = cartRows.map((item : any) => ({
      product_name: '', // Récupérer la référence du produit
      id_product: item.id_product[0]._,
      product_attribute: '', // Récupérer la référence de l'attribut si nécessaire
      id_product_attribute: item.id_product_attribute[0]._,
      id_address_delivery: customerAdress ?? 0,
      quantity: item.quantity
    }));

    const prestashopAssociations : PrestashopCartAssociations = {
      cart_rows: carts
    }

    const prestashopCart : PrestashopCart = {
      id : idCart ?? undefined,
      id_currency: 1,
      id_lang: 1,
      id_customer: this.sessionService.getCustomer()?.id ?? 0,
      id_address_delivery: customerAdress ?? 0,
      id_address_invoice: customerAdress ?? 0,
      order_state : 'Paiement accepté',
      line_number: 0,
      associations: prestashopAssociations
    };
    await this.cartService.updateCart(prestashopCart, idCart ?? 0);
    const orders : PrestashopOrder = transformCartToOrder(prestashopCart);
    await this.orderService.createOrderData(orders,2);

    alert('La commande a été créée avec succès !');

     // Optionnel : Fermer le dialogue après la création de la commande
    this.close();
  }


  async onDuplicate(o : Order) {
    const order = await this.orderService.getOrderByIdOrder(o.id);
    const idCart = order?.prestashop?.order.id_cart._;

    const customerAdress = await this.customerService.getAddressByIdCustomer(this.sessionService.getCustomer()?.id ?? 0);
    const cartsItems = await this.cartService.getCartById(idCart ?? 0);
    const cartRows = cartsItems?.associations[0].cart_rows[0].cart_row;

    const carts : PrestashopCartRow [] = cartRows.map((item : any) => ({
      product_name: '', // Récupérer la référence du produit
      id_product: item.id_product[0]._,
      product_attribute: '', // Récupérer la référence de l'attribut si nécessaire
      id_product_attribute: item.id_product_attribute[0]._,
      id_address_delivery: customerAdress ?? 0,
      quantity: item.quantity * this.nombreDuplicate
    }));

    const prestashopAssociations : PrestashopCartAssociations = {
      cart_rows: carts
    }

    const prestashopCart : PrestashopCart = {
      id : idCart ?? undefined,
      id_currency: 1,
      id_lang: 1,
      id_customer: this.sessionService.getCustomer()?.id ?? 0,
      id_address_delivery: customerAdress ?? 0,
      id_address_invoice: customerAdress ?? 0,
      order_state : 'Livré',
      line_number: 0,
      associations: prestashopAssociations
    };

    this.dialog.open(ValidationComponent, {
      data: prestashopCart, // On passe l'objet product au composant
      width: '1700px',
      maxHeight: '120vh',
      panelClass: 'custom-dialog-container' // Optionnel pour du CSS personnalisé
    });

    this.close(); // Fermer le dialogue actuel après l'ouverture du nouveau dialogue de validation
  }


}



