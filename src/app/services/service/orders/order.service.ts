import { inject, Injectable } from '@angular/core';
import { Order } from '../../../models/OrderModel';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { xmlToJson } from '../../../utils/parse-xml.utils';
import { PrestashopOrder, buildOrderXML } from '../../../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private authInterceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  constructor() {}


  async getOrdersFull(): Promise<Order[]> {
    const ids = await this.getOrderIds();
    const promises: Promise<Order>[] = [];

    for (let i = 0; i < ids.length; i++) {
      promises.push(this.getOrderMapped(ids[i]));
    }

    return Promise.all(promises);
  }

  private async getOrderIds(): Promise<number[]> {
    const api = this.authInterceptor.getApi();

    const response = await api.get('/api/orders', {
      responseType: 'text'
    });

    const json = await xmlToJson(response.data);
    const orders = json.prestashop.orders.order;

    const list = Array.isArray(orders) ? orders : [orders];
    const ids: number[] = [];

    for (let i = 0; i < list.length; i++) {
      ids.push(Number(list[i].$.id));
    }

    return ids;
  }


  private async getOrderMapped(id: number): Promise<Order> {
    const api = this.authInterceptor.getApi();

    const response = await api.get(`/api/orders/${id}`, {
      responseType: 'text'
    });

    const json = await xmlToJson(response.data);
    return this.mapOrder(json.prestashop.order);
  }


  private mapOrder(o: any): Order {
    return {
      id: Number(o.id),
      total_paid: Number(o.total_paid),
      date_add: o.date_add,
      products: this.mapProducts(o.associations?.order_rows?.order_row)
    };
  }

  private mapProducts(rows: any): any[] {
    if (!rows) return [];

    const list = Array.isArray(rows) ? rows : [rows];
    const products: any[] = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];

      products.push({
        product_id: Number(p.product_id),
        product_name: p.product_name,
        product_price: Number(p.product_price),
        quantity: Number(p.product_quantity)
      });
    }

    return products;
  }


  async createOrder(order: PrestashopOrder): Promise<number | null> {
    const api = this.authInterceptor.getApi();
    const orderXML = buildOrderXML(order);

    try {
      const response = await api.post('/api/orders', orderXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      return response.data?.order?.id ?? null;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }



}
