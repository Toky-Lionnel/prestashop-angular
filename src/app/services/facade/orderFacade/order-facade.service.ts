import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';
import { OrderStateService } from '../../service/order-state/order-state.service';
import { PrestashopOrderHistory, transformOrderToOrderHistory } from '../../../models/order-history.model';
import { CustomerService } from '../../service/customer/customer.service';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';
import { PrestashopProduct } from '../../../models/product.model';
import { PrestashopCustomer } from '../../../models/customer.model';
import { ProductService } from '../../service/product/product.service';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);
  private orderHistoryService: OrderStateService = inject(OrderStateService);
  private customerService : CustomerService = inject(CustomerService);
  private productService : ProductService = inject(ProductService);

  constructor() { }

  async createOrder (carts: PrestashopCart []) : Promise<void> {

    for (const cart of carts) {

      try {
        const idCustomer = await this.customerService.getIdCustomerByEmail(cart.customer_email ?? '');
        if (!idCustomer) {
          throw new Error(`Cannot create order: Customer not found for email ${cart.customer_email}`);
        }

        const idAddress = await this.customerService.getAddressByIdCustomer(idCustomer);
        if (!idAddress) {
          throw new Error(`Cannot create order: Address not found for customer ID ${idCustomer}`);
        }
        cart.id_address_delivery = idAddress;
        cart.id_address_invoice = idAddress;
        cart.id_customer = idCustomer;

        for (const row of cart.associations.cart_rows) {
          const idProduct = await this.productService.getIdProductByName(row.product_name);
          if (!idProduct) {
            throw new Error(`Cannot create order: Product not found for cart line with product name ${row.product_name}`);
          }
          row.id_product = idProduct;
        }

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

      } catch (error) {
        console.error('Error creating order for cart with line number', cart.line_number, ':', error);
        throw error;
      }
    }
  }

  async validateOrders(carts: PrestashopCart[], file_name: string,
    products : ImportValidationResult <PrestashopProduct> , customers : ImportValidationResult <PrestashopCustomer>
  ): Promise<ImportValidationResult<PrestashopCart>> {

    const validationResult = createEmptyValidationResult<PrestashopCart>();

    const validCustomers : PrestashopCustomer [] = customers.validData;
    const validProducts : PrestashopProduct [] = products.validData;

    // chargement des statuts
    await this.orderHistoryService.loadOrderStates();

    for (let i = 0; i < carts.length; i++) {

      const fieldErrors: FieldValidationError[] = [];
      const cart = carts[i];
      const lineNumber = cart.line_number;

      // verification de l'existence du client
      const customerEmail = cart.customer_email ?? '';
      const customer = validCustomers.find(c => c.email === customerEmail);
      if (!customer) {
        fieldErrors.push({ field : 'customer', code : 'invalid_value',
        message : `Le client avec l'email ${customerEmail} n'existe pas.`});
      }

      // verification de l'existence des produits
      for (const produit of cart.associations.cart_rows) {
        const product = validProducts.find(p => this.nameMatches(p, produit.product_name));
        if (!product) {
          fieldErrors.push({ field : 'product', code : 'invalid_value',
          message : `Le produit avec le nom ${produit.product_name} n'existe pas.`});
        }
      }

      // verification de l'existence du statut de commande
      const idOrderState = this.orderHistoryService.getOrderStateIdByName(cart.order_state ?? '');
      if (!idOrderState) {
        fieldErrors.push({ field : 'order_state', code : 'invalid_value',
        message : `Le statut de commande ${cart.order_state} n'existe pas.`});
      }


      if (fieldErrors.length > 0) {
        validationResult.invalidData.push({
          lineNumber,
          data: cart,
          errors: fieldErrors
        });
      } else {
        validationResult.validData.push(cart);
      }
    }

    validationResult.file_name = file_name;
    validationResult.summary.valid = validationResult.validData.length;
    validationResult.summary.invalid = validationResult.invalidData.length;
    validationResult.summary.total = carts.length;
    return validationResult;
  }


  private nameMatches(product: PrestashopProduct, productName: string): boolean {
    const nameField: any = (product as any).name;
    if (!nameField) return false;
    if (typeof nameField === 'string') return nameField === productName;
    if (typeof nameField === 'object') {
      // try to match any localized value
      for (const key of Object.keys(nameField)) {
        const v = (nameField as any)[key];
        if (typeof v === 'string' && v === productName) return true;
      }
    }
    return false;
  }

}
