import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopCart, buildCartXML } from '../../../models/cart.model';
import { parseStringPromise } from 'xml2js';


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

}
