import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart, transformCartCsvRowsToPrestashopCarts } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';
import { OrderStateService, PrestashopOrderState } from '../../service/order-state/order-state.service';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';
import { PrestashopProduct } from '../../../models/product.model';
import { PrestashopCustomer, transformCustomerCsvToModels } from '../../../models/customer.model';
import { AttributeService } from '../../service/attribute/attribute.service';
import { CustomerCsvModel, uniqueCustomerCsvRows } from '../../../models/customer-csv.model';
import { CustomerFacadeService } from '../customerFacade/customer-facade.service';
import { CartCsvModel, transformCustomersCsvToCartCsvRows } from '../../../models/cart-csv.model';
import { StockFacadeService } from '../stockFacade/stock-facade.service';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);
  private orderHistoryService: OrderStateService = inject(OrderStateService);
  private attributeService : AttributeService = inject(AttributeService);
  private stockFacadeService : StockFacadeService = inject(StockFacadeService);
  private customerFacade : CustomerFacadeService = inject(CustomerFacadeService);

  productMap : Map <string,number> = new Map <string,number> ();

  private customerCache = new Map<string, number>();
  private addressCache = new Map<number, number>();
  private combinationCache = new Map<string, number>();
  private orderStateCache : PrestashopOrderState [] = [];

  async getCachedCombinationId(productId: number,attribute: string): Promise<number> {
    const key = `${productId}_${attribute}`;

    const cached = this.combinationCache.get(key);
    if (cached) return cached;

    const id = await this.attributeService.getIdCombination(productId, attribute);

    if (!id) {
      throw new Error(`Combination not found: ${key}`);
    }

    this.combinationCache.set(key, id);
    return id;
  }


  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    this.orderStateCache = await this.orderHistoryService.loadOrderStates();
  }

  async importOrders (customers : CustomerCsvModel [], productMap : Map<string, number>) : Promise<void> {
    const uniqueCustomers : CustomerCsvModel [] = uniqueCustomerCsvRows(customers);
    const customersModel : PrestashopCustomer [] = transformCustomerCsvToModels(uniqueCustomers);

    this.productMap = productMap;

    const { customerMap, adressMap } = await this.customerFacade.importCustomers(customersModel);
    this.customerCache = customerMap;
    this.addressCache = adressMap;

    const cartsCSV: CartCsvModel [] = transformCustomersCsvToCartCsvRows(customers);
    const cartsPrestashop : PrestashopCart [] = transformCartCsvRowsToPrestashopCarts(cartsCSV);
    await this.createOrder(cartsPrestashop);
  }


  async createOrder (carts: PrestashopCart []) : Promise<void> {

    for (const cart of carts) {

      try {
        const idCustomer = this.customerCache.get(cart.customer_email ?? '');
        if (!idCustomer) {
          throw new Error(`Cannot create order: Customer not found for email ${cart.customer_email}`);
        }

        const idAddress = this.addressCache.get(idCustomer);
        if (!idAddress) {
          throw new Error(`Cannot create order: Address not found for customer ID ${idCustomer}`);
        }
        cart.id_address_delivery = idAddress;
        cart.id_address_invoice = idAddress;
        cart.id_customer = idCustomer;

        await Promise.all(
          cart.associations.cart_rows.map(async (row) => {
            const idProduct = this.productMap.get(row.product_name);

            if (!idProduct) {
              throw new Error(`Product not found: ${row.product_name}`);
            }

            row.id_product = idProduct;
            row.id_address_delivery = idAddress;
            if (row.product_attribute) {
              row.id_product_attribute = await this.getCachedCombinationId(idProduct, row.product_attribute);
            } else {
              row.id_product_attribute = 0;
            }
          })
        );

        const idCart = await this.cartService.createCart(cart);
        cart.id = idCart;
        await this.cartService.updateCart(cart, idCart ?? 0);

        if ((cart.order_state ?? '').trim() !== '') {
          const order : PrestashopOrder = transformCartToOrder(cart);

          const id_order_state = this.orderHistoryService.getOrderStateIdByName(cart.order_state ?? '');

          const orderData = await this.orderService.createOrderData(order,id_order_state ?? undefined);
          const idOrder = orderData?.id?.[0];

          // update de la date via GET + PUT
          await this.orderService.patchCurrentState(idOrder ?? 0, id_order_state ?? 0, cart.date_add ?? '');
          await this.createOrderState(idOrder ?? 0, cart.order_state ?? '', cart.associations, cart.date_add ?? '');
        }

      } catch (error) {
        console.error('Error creating order for cart with line number', cart.line_number, ':', error);
        throw error;
      }
      console.log(`=== FIN CREATION CART ${cart.line_number} ===`);
    }

    console.log("=== FIN CREATION FEUILLE 3");
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
      // for (const produit of cart.associations.cart_rows) {
      //   const product = validProducts.find(p => this.nameMatches(p, produit.product_name));
      //   if (!product) {
      //     fieldErrors.push({ field : 'product', code : 'invalid_value',
      //     message : `Le produit avec le nom ${produit.product_name} n'existe pas.`});
      //   }
      // }

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

  private async getFirstOrderStateId(id_order: number, fallbackId: number): Promise<number> {
    const firstOrderState = await this.orderHistoryService.getFirstOrderStateOrder(id_order);
    return firstOrderState?.id ?? fallbackId;
  }

  private async updateFirstOrderState(id_order: number, order_state_name: string, date_add: string): Promise<boolean> {
    const firstOrderHistoryId = await this.orderHistoryService.getFirstOrderHistoryId(id_order);

    if (!firstOrderHistoryId) {
      return false;
    }

    const id_order_state = this.orderHistoryService.getOrderStateIdByName(order_state_name);
    if (!id_order_state) {
      throw new Error(`Cannot update order state: Order state not found for name ${order_state_name}`);
    }

    await this.orderHistoryService.updateOrderHistoryState(firstOrderHistoryId, {
      id: firstOrderHistoryId,
      id_order,
      id_order_state,
      order_state: order_state_name,
      date_add
    });

    return true;
  }


  async createOrderState(id_order: number, order_state_name: string, cart_associations: any , date_add : string): Promise<void> {
    const id_order_state = this.orderHistoryService.getOrderStateIdByName(order_state_name);
    if (!id_order_state) {
      throw new Error(`Cannot create order state: Order state not found for name ${order_state_name}`);
    }

    await this.updateFirstOrderState(id_order, order_state_name, date_add);

    if (id_order_state == 5) {
      for (const cart of cart_associations.cart_rows) {
        const id_product = cart.id_product;
        const id_product_attribute = cart.id_product_attribute ?? 0;
        const quantity = cart.quantity;
        await this.stockFacadeService.createStockMouvement(id_product, id_product_attribute, -quantity, 'Order creation', date_add);
      }
    }
  }

  async createOrderStateOrder(id_order: number, order_state_name: string, cart_associations: any , date_add : string): Promise<void> {
    const id_order_state = this.orderHistoryService.getOrderStateIdByName(order_state_name);
    if (!id_order_state) {
      throw new Error(`Cannot create order state: Order state not found for name ${order_state_name}`);
    }

    await this.updateFirstOrderState(id_order, order_state_name, date_add);

    if (id_order_state == 5) {
      for (const cart of cart_associations.order_rows) {
        const id_product = cart.product_id;
        const id_product_attribute = cart.product_attribute_id ?? 0;
        const quantity = cart.product_quantity;
        await this.stockFacadeService.createStockMouvement(id_product, id_product_attribute, -quantity, 'Order creation', date_add);
      }
    }
  }


  async insertOrderAndMouvementStock (order : PrestashopOrder) {

    const id_order_state = this.orderHistoryService.getOrderStateIdByName(order.order_state ?? '');
    const orderData = await this.orderService.createOrderData(order,id_order_state ?? undefined);
    const idOrder = orderData?.id?.[0];

    if (!order.date_add) {
      order.date_add = new Date().toISOString();
    }

    // update de la date via GET + PUT
    await this.orderService.patchCurrentState(idOrder ?? 0, id_order_state ?? 0, order.date_add ?? '');
    await this.createOrderStateOrder(idOrder ?? 0, order.order_state ?? '', order.associations, order.date_add ?? '');
  }
}
