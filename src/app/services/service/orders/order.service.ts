import { inject, Injectable } from '@angular/core';
import { Order } from '../../../models/OrderModel';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { xmlToJson } from '../../../utils/parse-xml.utils';
import { PrestashopOrder, buildOrderXML } from '../../../models/order.model';
import { parseStringPromise } from 'xml2js';
import { OrderStateService } from '../order-state/order-state.service';
import { CustomerService } from '../customer/customer.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private authInterceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private orderStateService : OrderStateService = inject(OrderStateService);
  private customerService : CustomerService = inject(CustomerService);

  constructor() {}

  async getOrdersFull(): Promise<Order[]> {
    this.orderStateService.loadOrderStates();

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


  private async mapOrder(o: any): Promise<Order> {
    const email = await this.customerService.getCustomerById(o.id_customer._).then((customer) => customer?.email || 'Email non trouvé');

    return {
      id: Number(o.id),
      total_paid: Number(o.total_paid),
      date_add: o.date_add,
      customer_email: email[0],
      recent_statut: this.orderStateService.getOrderStateNameById(Number(o.current_state._)) || '',
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

    console.log(orderXML);


    try {
      const response = await api.post('/api/orders', orderXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      const responseData = await parseStringPromise(response.data);
      const order = responseData?.prestashop?.order?.[0];
      return order?.id?.[0];
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    const api = this.authInterceptor.getApi();

    try {
      const response = await api.get(`/api/orders/${id}`, {
        responseType: 'text'
      });

      const json = await xmlToJson(response.data);
      return json;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  async getOrderByIdCart (idCart: number): Promise<any | null> {
    const api = this.authInterceptor.getApi();
    try {
      const response = await api.get('/api/orders?filter[id_cart]=[' + idCart + ']&display=[id]', {
        responseType: 'text'
      });

      const orderData = await parseStringPromise(response.data);

      const orders = orderData?.prestashop?.orders?.[0];
      const order = orders?.order?.[0];

      const id = order?.id?.[0];

      // verifier que l'id existe
      if (!id) {
        console.error('No order found for cart ID:', idCart);
        return null;
      }
      const fullOrder = await this.getOrderById(id);

      return fullOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }

  }



}
