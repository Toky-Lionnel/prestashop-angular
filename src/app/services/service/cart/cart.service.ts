import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopCart, buildCartXML, buildUserCartXML, buildUserCartXMLUpdate } from '../../../models/cart.model';
import { parseStringPromise } from 'xml2js';
import { CartItem } from '../user-cart/user-cart.service';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

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




}
