import { Component, inject } from '@angular/core';
import { Order } from '../../models/OrderModel';
import { OrderService } from '../../services/service/orders/order.service';
import { CommonModule } from '@angular/common';
import { OrderStateService } from '../../services/service/order-state/order-state.service';
import { transformToOrderHistory } from '../../models/order-history.model';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/service/cart/cart.service';

@Component({
  selector: 'app-orders-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent {
  orders: Order[] = [];
  orderStates: any[] = [];
  selectedStates: Record<number, number> = {};
  pendingValidation: Record<number, boolean> = {};
  successMessageByOrder: Record<number, string> = {};
  errorMessageByOrder: Record<number, string> = {};
  expandedOrderId: number | null = null;

  private orderService: OrderService = inject(OrderService);
  private orderStateService: OrderStateService = inject(OrderStateService);
  private cartService: CartService = inject(CartService);

  async ngOnInit() {
    this.orderStates = await this.orderStateService.loadOrderStates();
    const carts : Order [] = await this.cartService.getCartMapped();
    this.orders = await this.orderService.getOrdersFull();
    this.orders = [...this.orders, ...carts];
    this.initializeSelectedStates();
  }

  private initializeSelectedStates(): void {
    for (let i = 0; i < this.orders.length; i++) {
      const order = this.orders[i];
      const stateId = this.getOrderStateIdByCurrentName(order.recent_statut) ?? this.orderStates[0]?.id;

      if (stateId) {
        this.selectedStates[order.id] = stateId;
      }
    }
  }

  private getOrderStateIdByCurrentName(name: string): number | null {
    if (!name) {
      return null;
    }

    return this.orderStateService.getOrderStateIdByName(name) ?? null;
  }

  getStateLabelById(id: number): string {
    const state = this.orderStates.find((item) => item.id === id);
    return state?.names?.[0]?.value ?? 'Statut inconnu';
  }

  async onValidate(order: Order): Promise<void> {
    const selectedStateId = this.selectedStates[order.id];

    if (!selectedStateId) {
      this.errorMessageByOrder[order.id] = 'Selectionnez un statut avant de valider.';
      this.successMessageByOrder[order.id] = '';
      return;
    }

    this.pendingValidation[order.id] = true;
    this.successMessageByOrder[order.id] = '';
    this.errorMessageByOrder[order.id] = '';

    try {
      const orderHistory = transformToOrderHistory(order.id,selectedStateId, null);

      await this.orderStateService.createOrderState(orderHistory);

      order.recent_statut = this.getStateLabelById(selectedStateId);
      this.successMessageByOrder[order.id] = 'Statut mis a jour avec succes.';
    } catch (error) {
      console.error('Erreur lors de la mise a jour du statut de la commande :', error);
      this.errorMessageByOrder[order.id] = 'La mise a jour a echoue. Veuillez reessayer.';
    } finally {
      this.pendingValidation[order.id] = false;
    }
  }

  async toggleOrderDetails(order: Order): Promise<void> {

    if (order.recent_statut !== 'Non commandé') {
      const products = order.products.map((p) => `Produit: ${p.product_name}, Prix: ${p.product_price}, Quantité: ${p.quantity}`).join('\n');
      alert(products);
      return;
    }

    const details = await this.cartService.getCartDetails(order);
    const products = details.products.map((p) => `Produit: ${p.product_name}, Prix: ${p.product_price}, Quantité: ${p.quantity}`).join('\n');

    if (products.length === 0) {
      alert(`Aucun produit trouvé pour le panier ${order.id}.`);
      return;
    }

    alert(`Détails du panier ${order.id} :\n${products}`);
  }

  isCart(order: Order): boolean {
    return order.recent_statut === 'Non commandé';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const normalizedStatus = status?.toLowerCase() ?? '';

    if (normalizedStatus.includes('livr') || normalizedStatus.includes('complet')) return 'success';
    if (normalizedStatus.includes('cours') || normalizedStatus.includes('expédi') || normalizedStatus.includes('transit')) return 'info';
    if (normalizedStatus.includes('attente') || normalizedStatus.includes('paiement')) return 'warn';
    if (normalizedStatus.includes('annul') || normalizedStatus.includes('refus') || normalizedStatus.includes('erreur')) return 'danger';

    return 'secondary';
  }

}
