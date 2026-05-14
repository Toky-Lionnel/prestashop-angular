import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopCart, buildCartUpdateXML, buildCartXML, buildUserCartXML, buildUserCartXMLUpdate } from '../../../models/cart.model';
import { parseStringPromise } from 'xml2js';
import { CartItem } from '../user-cart/user-cart.service';
import { OrderService } from '../orders/order.service';
import { Order } from '../../../models/OrderModel';
import { CustomerService } from '../customer/customer.service';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private orderService : OrderService = inject(OrderService);
  private customerService : CustomerService = inject(CustomerService);

  /**
   * Extrait la valeur string d'un champ XML2JS (qui est toujours un tableau)
   */
  private extractValue(value: any): string | null {
    if (!value) return null;
    if (Array.isArray(value)) {
      return String(value[0]).trim();
    }
    return String(value).trim();
  }

  /**
   * Extrait et convertit la valeur en nombre
   */
  private extractNumeric(value: any): number | null {
    const stringValue = this.extractValue(value);
    if (!stringValue) return null;
    const num = Number(stringValue);
    return isNaN(num) ? null : num;
  }

  async createCart(cart: PrestashopCart): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildCartXML(cart);

    try {
      const response = await api.post('/api/carts', cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }


  async updateCart(cart: PrestashopCart , cartId: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildCartUpdateXML(cart);

    try {
      const response = await api.put(`/api/carts/${cartId}`, cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error updating cart:', error);
      return null;
    }
  }


  async createCartUser(carts : CartItem[]): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildUserCartXML(carts);

    try {
      const response = await api.post('/api/carts', cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }

  async updateCartUser(carts : CartItem[], cartId: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildUserCartXMLUpdate(carts, cartId);

    console.log(cartXML);


    try {
      const response = await api.put(`/api/carts/${cartId}`, cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);

      console.log(`Response data : ${responseData}`);


      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error updating cart:', error);
      return null;
    }
  }


  async getAllCarts() : Promise<any[] | null> {
    const api = this.interceptor.getApi();
    const response = await api.get('/api/carts?display=full', {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const carts = json?.prestashop?.carts?.[0]?.cart || [];
    return carts;
  }


  async getCartNonCommandes(): Promise<any[] | null> {
    try {
      const carts = await this.getAllCarts() || [];
      let orders = await this.orderService.getAllOrdersForCart() || [];

      const orderedId = new Set <number>();
      for (const order of orders) {
        const idCart = order.id_cart[0]._;
        console.log(idCart);

        if (idCart !== null) {
          orderedId.add(idCart);
        }
      }

      const nonOrderedCarts = carts.filter((cart: any) => {
        const cartId = cart.id[0];
        return cartId !== null && !orderedId.has(cartId);
      });

      return nonOrderedCarts;
    } catch (error) {
      console.error('Error getting non-ordered carts:', error);
      return [];
    }
  }


  async getCartMapped (): Promise<any[] | null> {
    const carts = await this.getCartNonCommandes() || [];
    const products = [];

    for (const cart of carts) {
      const mappedCart = await this.mapOrder(cart);
      products.push(mappedCart);
    }
    return products;
  }


  private async mapOrder(o: any): Promise<Order> {
    let email = 'Anonyme';

    if (Number(o.id_customer[0]) !== Number(0)) {
      let id_customer = Number(o.id_customer[0]._);
      const customer = await this.customerService.getCustomerById(id_customer);
      email = customer?.email[0] || 'Anonyme';
    }

    console.log(o.associations[0].cart_rows[0].cart_row);


    return {
      id: Number(o.id),
      total_paid: Number(o.total_paid),
      date_add: o.date_add,
      customer_email: email,
      recent_statut: 'Non commandé',
      products: this.mapProducts(o.associations[0].cart_rows[0].cart_row)
    };
  }

  private mapProducts(rows: any): any[] {
    if (!rows) return [];

    const list = Array.isArray(rows) ? rows : [rows];
    const products: any[] = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];

      products.push({
        product_id: Number(p.id_product[0]._),
        product_name: p.product_name,
        product_price: Number(p.product_price),
        quantity: Number(p.quantity[0])
      });
    }

    return products;
  }

}
