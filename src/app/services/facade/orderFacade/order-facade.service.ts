import { inject, Injectable } from '@angular/core';
import { OrderService } from '../../service/orders/order.service';
import { CartService } from '../../service/cart/cart.service';
import { PrestashopCart, transformCartCsvRowsToPrestashopCarts } from '../../../models/cart.model';
import { PrestashopOrder, transformCartToOrder } from '../../../models/order.model';
import { OrderStateService } from '../../service/order-state/order-state.service';
import { CustomerService } from '../../service/customer/customer.service';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';
import { PrestashopProduct } from '../../../models/product.model';
import { PrestashopCustomer, transformCustomerCsvToModels } from '../../../models/customer.model';
import { ProductService } from '../../service/product/product.service';
import { AttributeService } from '../../service/attribute/attribute.service';
import { CustomerCsvModel, uniqueCustomerCsvRows } from '../../../models/customer-csv.model';
import { CustomerFacadeService } from '../customerFacade/customer-facade.service';
import { CartCsvModel, transformCustomersCsvToCartCsvRows } from '../../../models/cart-csv.model';
import { StockFacadeService } from '../stockFacade/stock-facade.service';
import { PrestashopOrderHistory } from '../../../models/order-history.model';

@Injectable({
  providedIn: 'root'
})
export class OrderFacadeService {

  private orderService: OrderService = inject(OrderService);
  private cartService: CartService = inject(CartService);
  private orderHistoryService: OrderStateService = inject(OrderStateService);
  private customerService : CustomerService = inject(CustomerService);
  private productService : ProductService = inject(ProductService);
  private attributeService : AttributeService = inject(AttributeService);
  private stockFacadeService : StockFacadeService = inject(StockFacadeService);
  private customerFacade : CustomerFacadeService = inject(CustomerFacadeService);

  constructor() { }


  async importOrders (customers : CustomerCsvModel []) {

    const uniqueCustomers : CustomerCsvModel [] = uniqueCustomerCsvRows(customers);
    const customersModel : PrestashopCustomer [] = transformCustomerCsvToModels(uniqueCustomers);
    await this.customerFacade.importCustomers(customersModel);

    const cartsCSV: CartCsvModel [] = transformCustomersCsvToCartCsvRows(customers);
    const cartsPrestashop : PrestashopCart [] = transformCartCsvRowsToPrestashopCarts(cartsCSV);

    await this.createOrder(cartsPrestashop);
  }


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
          const idProduct = await this.productService.getIdProductByReference(row.product_name);
          if (!idProduct) {
            throw new Error(`Cannot create order: Product not found for cart line with product name ${row.product_name}`);
          }
          row.id_product = idProduct;

          let idProductAttribute: number | null = 0;

          if ((row.product_attribute ?? '') !== '') {
            idProductAttribute = await this.attributeService.getIdCombination(idProduct,row.product_attribute);
            if (!idProductAttribute) {
              throw new Error(`Cannot create order: Combination not found for cart line with product name ${row.product_name} and attribute ${row.product_attribute}`);
            }
          }
          row.id_product_attribute = idProductAttribute ?? 0;
        }

        const idCart = await this.cartService.createCart(cart);
        cart.id = idCart;
        await this.cartService.updateCart(cart, idCart ?? 0);

        if ((cart.order_state ?? '').trim() !== '') {
          const order : PrestashopOrder = transformCartToOrder(cart);

          await this.orderHistoryService.loadOrderStates();
          const id_order_state = this.orderHistoryService.getOrderStateIdByName(cart.order_state ?? '');


          const orderData = await this.orderService.createOrderData(order,id_order_state ?? undefined);
          const idOrder = orderData?.id?.[0];

          // update de la date via GET + PUT
          await this.orderService.updateOrderWithFullData(Number(idOrder), cart.date_add ?? '', id_order_state ?? 0);
          await this.createOrderState(idOrder ?? 0, cart.order_state ?? '', cart.associations, cart.date_add ?? '');
        }

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

    console.log(firstOrderHistoryId);


    if (!firstOrderHistoryId) {
      return false;
    }

    await this.orderHistoryService.loadOrderStates();
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
    await this.orderHistoryService.loadOrderStates();

    const id_order_state = this.orderHistoryService.getOrderStateIdByName(order_state_name);
    if (!id_order_state) {
      throw new Error(`Cannot create order state: Order state not found for name ${order_state_name}`);
    }

    const updated = await this.updateFirstOrderState(id_order, order_state_name, date_add);

    const orderHistoryData: PrestashopOrderHistory = {
      id_order: id_order,
      id_order_state: id_order_state,
      order_state: order_state_name,
      date_add: date_add,
      line_number: cart_associations?.cart_rows?.order_row?.[0]?.line_number
    };

    // await this.orderHistoryService.createOrderState(orderHistoryData);

  }

  async updateOrderStatus(orderId: number, status: number) {
      await this.orderHistoryService.updateOrderState(orderId, status);
  }


}
