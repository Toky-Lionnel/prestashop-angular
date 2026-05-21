import { Component, inject, Inject, Input, OnInit, Optional } from '@angular/core';
import { PrestashopCart, PrestashopCartAssociations } from '../../models/cart.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { StocksService } from '../../services/service/stocks/stocks.service';
import { CartService } from '../../services/service/cart/cart.service';
import { PrestashopOrder, transformCartToOrder } from '../../models/order.model';
import { OrderService } from '../../services/service/orders/order.service';
import { OrderFacadeService } from '../../services/facade/orderFacade/order-facade.service';

export interface CartElements {
  product_id : number,
  product_id_attribute : number,
  product_name ?: string
  product_quantity : number,
  stock_disponible : number,
  prix_unitaire : number,
  prix_total : number
}


@Component({
  selector: 'app-validation',
  imports: [CommonModule],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.scss'
})
export class ValidationComponent implements OnInit {

  associations : PrestashopCartAssociations = {
    cart_rows: []
  }

  elements : CartElements [] = [];
  indisponible : boolean = false;

  private stockService : StocksService = inject(StocksService);
  private cartService : CartService = inject(CartService);
  private orderService : OrderService = inject(OrderService);
  private dialogRef = inject(MatDialogRef<ValidationComponent>);
  private orderFacade : OrderFacadeService = inject(OrderFacadeService);

  @Input ({required : true}) carts : PrestashopCart = {
    id_currency: 0,
    id_lang: 0,
    id_customer: 0,
    id_address_delivery: 0,
    id_address_invoice: 0,
    line_number: 0,
    associations: this.associations
  }

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data?: PrestashopCart) {
    if (data) {
      this.carts = data;
    }

    const cartRows = this.carts.associations.cart_rows;
    const elements : CartElements [] = [];

      for (const c of cartRows) {
        elements.push({
          product_id : c.id_product,
          product_id_attribute : c.id_product_attribute ?? 0,
          product_name : c.product_name,
          product_quantity : c.quantity,
          stock_disponible : 0,
          prix_unitaire : 0,
          prix_total : 0,
      });
    }

    this.elements = elements;
  }

  async ngOnInit() {
    for (const e of this.elements) {
      const info = await this.cartService.getProductNameAndCombinationAndPriceTTC(e.product_id,e.product_id_attribute);
      e.product_name = info.productName ?? '' + info.combinationName;
      e.prix_unitaire = info.price_ttc ?? 0;
      e.prix_total = e.prix_unitaire * e.product_quantity;
      e.stock_disponible = await this.stockService.getStockQuantity(e.product_id,e.product_id_attribute);

      if (e.product_quantity > e.stock_disponible) {
        this.indisponible = true;
      }
    }
  }

  calculateSubtotal(): number {
    return this.elements.reduce((sum, e) => sum + e.prix_total, 0);
  }

  calculateTotalQuantity(): number {
    return this.elements.reduce((sum, e) => sum + e.product_quantity, 0);
  }

  getUnavailableCount(): number {
    return this.elements.filter(e => e.product_quantity > e.stock_disponible).length;
  }

  getUnavailableItems(): CartElements[] {
    return this.elements.filter(e => e.product_quantity > e.stock_disponible);
  }

  async onValidate () {
    try {
      const id_cart = await this.cartService.createCart(this.carts);
      this.carts.id = id_cart ?? 0;

      const orders : PrestashopOrder = transformCartToOrder(this.carts);
      await this.orderFacade.insertOrderAndMouvementStock(orders);

      alert('Commande confirmée !');
      this.dialogRef.close({ success: true, orderId: this.carts.id });
    } catch (error) {
      console.error('Erreur lors de la validation :', error);
      this.dialogRef.close({ success: false, error });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false, cancelled: true });
  }
}
