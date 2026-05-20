import { inject, Injectable } from '@angular/core';
import { Order } from '../../../models/OrderModel';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { xmlToJson } from '../../../utils/parse-xml.utils';
import { PrestashopOrder, buildOrderXML, buildUpdateOrderXML, buildUpdateOrderXMLFromResponse } from '../../../models/order.model';
import { parseStringPromise } from 'xml2js';
import { OrderStateService, PrestashopOrderStateLanguage } from '../order-state/order-state.service';
import { CustomerService } from '../customer/customer.service';
import { PrestashopCartRow } from '../../../models/cart.model';
import { StockFacadeService } from '../../facade/stockFacade/stock-facade.service';
import { formatPrestashopDate } from '../../../utils/prestashop-date.utils';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private authInterceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private orderStateService : OrderStateService = inject(OrderStateService);
  private customerService : CustomerService = inject(CustomerService);
  private stockFacadeService : StockFacadeService = inject(StockFacadeService);

  constructor() {}

  async getOrdersFull(date?: string, id_customer?: number, full?: boolean): Promise<Order[]> {
    this.orderStateService.loadOrderStates();

    const ids = await this.getOrderIds(date, id_customer, full);
    const promises: Promise<Order>[] = [];

    for (let i = 0; i < ids.length; i++) {
      promises.push(this.getOrderMapped(ids[i]));
    }

    return Promise.all(promises);
  }


  private async getOrderIds(date?: string, id_customer?: number , full ?: boolean): Promise<number[]> {
    const api = this.authInterceptor.getApi();
    let url = '/api/orders';

    const filters: string[] = [];
    if (date) {
      filters.push(
        `date=1`,
        `filter[date_add]=[${date} 00:00:00,${date} 23:59:59]`
      );
    }

    if (!full) {
      filters.push(`filter[current_state]=![6]`);
    }

    if (id_customer) {
      filters.push(`filter[id_customer]=[${id_customer}]`);
    }

    if (filters.length > 0) {
      url += `?${filters.join('&')}`;
    }

    const response = await api.get(url, {
      responseType: 'text'
    });

    const json = await xmlToJson(response.data);
    const orders = json.prestashop.orders?.order;

    if (!orders) {
      return [];
    }

    const list = Array.isArray(orders) ? orders : [orders];
    return list.map((o: any) => Number(o.$.id));
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


  async createOrderData(order: PrestashopOrder, id_current_state?: number): Promise<any | null> {
    const api = this.authInterceptor.getApi();
    const orderXML = buildOrderXML(order, id_current_state);
    try {
      const response = await api.post('/api/orders', orderXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      const responseData = await parseStringPromise(response.data);
      const order = responseData?.prestashop?.order?.[0];

      await this.orderStateService.updateOrderState(order?.id?.[0], Number(id_current_state));

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async updateOrder(order: PrestashopOrder, id_order : number): Promise<number | null> {
    const api = this.authInterceptor.getApi();
    const orderXML = buildUpdateOrderXML(order, id_order);

    try {
      const response = await api.put('/api/orders/' + id_order, orderXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      const responseData = await parseStringPromise(response.data);
      const order = responseData?.prestashop?.order?.[0];
      return order?.id?.[0];
    } catch (error) {
      console.error('Error updating order:', error);
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


  async getOrderByIdOrder(id: number): Promise<any | null> {
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
        console.warn('No order found for cart ID:', idCart);
        return null;
      }
      const fullOrder = await this.getOrderById(id);

      return fullOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async getAllOrdersForCart(): Promise<any | null> {
    const api = this.authInterceptor.getApi();
    try {
      const response = await api.get('/api/orders?display=[id,id_cart]', {
        responseType: 'text'
      });

      const orderData = await parseStringPromise(response.data);
      return orderData.prestashop.orders[0].order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async verifCart (idCart: number): Promise<any | null> {
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
        console.warn('No order found for cart ID:', idCart);
        return null;
      }
      return id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }


  async patchCurrentState(id_order: number, id_order_state: number, date_add : string): Promise<void> {
    const api = this.authInterceptor.getApi();

    const date = formatPrestashopDate(date_add);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
          <order>
              <id>${id_order}</id>
              <current_state>${id_order_state}</current_state>
              <date_add>${date_add}</date_add>
          </order>
      </prestashop>`

    try {
      await api.patch('/api/orders/' + id_order, xml, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
    } catch (error) {
      console.error('Error updating order state:', error);
    }
  }

  async updateOrderWithFullData(id_order: number, newDateAdd: string, id_order_state: number): Promise<number | null> {
    const api = this.authInterceptor.getApi();

    try {
      // Step 1: GET l'order complet
      const getResponse = await api.get(`/api/orders/${id_order}`, {
        responseType: 'text'
      });

      const getResponseParsed = await parseStringPromise(getResponse.data);
      const orderData = getResponseParsed?.prestashop?.order?.[0];

      orderData.current_state = [{ _: String(id_order_state) }];

      if (!orderData) {
        console.error('Failed to retrieve order:', id_order);
        return null;
      }

      // Step 2: Construire le XML avec tous les champs récupérés et modifier la date_add
      const orderXML = buildUpdateOrderXMLFromResponse(orderData, id_order, newDateAdd);
      // Step 3: PUT avec les données modifiées
      const putResponse = await api.put('/api/orders/' + id_order, orderXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      const putResponseParsed = await parseStringPromise(putResponse.data);
      const updatedOrder = putResponseParsed?.prestashop?.order?.[0];
      return updatedOrder?.id?.[0];
    } catch (error) {
      console.error('Error updating order with full data:', error);
      return null;
    }
  }


  async getCartsPaiementEffectue(): Promise<any[] | null> {
    const api = this.authInterceptor.getApi();
    try {
      const response = await api.get('/api/orders?filter[current_state]=[2]&display=[id_cart]', {
        responseType: 'text'
      });

      const lists = [];

      const orderData = await parseStringPromise(response.data);
      const orders = orderData?.prestashop?.orders?.[0]?.order;
      for (const o of orders) {
        const id_cart = o.id_cart?.[0]?._;
        if (id_cart) {
          lists.push(Number(id_cart));
        }
      }

      return lists;

    } catch (error) {
      console.error('Error fetching carts with payment:', error);
      return null;
    }
  }

  async getReservedOrders () : Promise<any> {
    const api = this.authInterceptor.getApi();
    try {
      const response = await api.get('/api/orders?filter[current_state]=[2]&display=full', {
        responseType: 'text'
      });

      const orderData = await parseStringPromise(response.data);
      const orders = orderData.prestashop.orders[0].order;
      const rows = [];

      for (const o of orders) {
        const data = o.associations[0].order_rows[0].order_row;
        if(Array.isArray(data)) {
          rows.push(...data);
        } else {
        rows.push(data);
        }
      }
      return rows;
    } catch (error) {
      console.error('Error fetching carts with payment:', error);
      return null;
    }
  }


  async getOrderCartRows(id_order: number): Promise<PrestashopCartRow[]> {
    const api = this.authInterceptor.getApi();

    try {
      // Récupérer d'abord l'ordre pour obtenir son id_cart
      const orderResponse = await api.get(`/api/orders/${id_order}?display=[id,id_cart]`);
      const orderJson = await xmlToJson(orderResponse.data);

      const order = Array.isArray(orderJson?.prestashop?.order)
        ? orderJson.prestashop.order[0]
        : orderJson?.prestashop?.order;

      if (!order) {
        console.warn(`Commande ${id_order} non trouvée`);
        return [];
      }

      const id_cart = this.toNumber(this.extractXmlText(order?.id_cart), 0);
      if (!id_cart) {
        console.warn(`Pas de panier trouvé pour la commande ${id_order}`);
        return [];
      }

      const cartResponse = await api.get(`/api/carts/${id_cart}?display=full`);
      const cartJson = await parseStringPromise(cartResponse.data);

      const cart = cartJson?.prestashop?.cart?.[0];
      if (!cart) {
        console.warn(`Panier ${id_cart} non trouvé`);
        return [];
      }

      const cartRowsData = cart?.associations?.[0]?.cart_rows?.[0]?.cart_row ?? [];
      const cartRows = this.normalizeList(cartRowsData).map((row: any) => ({
        product_name: this.extractXmlText(row?.product_name),
        id_product: this.toNumber(this.extractXmlText(row?.id_product[0]._), 0),
        product_attribute: this.extractXmlText(row?.product_attribute),
        id_product_attribute: this.toNumber(this.extractXmlText(row?.id_product_attribute[0]._), 0) || 0,
        id_address_delivery: this.toNumber(this.extractXmlText(row?.id_address_delivery), 0),
        quantity: this.toNumber(this.extractXmlText(row?.quantity), 0),
      }));

      return cartRows;
    } catch (error) {
      console.error(`Erreur lors de la récupération des cart rows pour la commande ${id_order}:`, error);
      return [];
    }
  }


  private toNumber(value: unknown, fallback: number): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  private normalizeList<T>(value: T | T[] | null | undefined): T[] {
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  private extractXmlText(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object' && '_' in value) {
      return String(value._ ?? '');
    }

    return String(value);
  }

  private extractNameValue(name: any): PrestashopOrderStateLanguage[] {
    const rawLanguages = name?.language;

    const languages = Array.isArray(rawLanguages)
      ? rawLanguages
      : rawLanguages
        ? [rawLanguages]
        : [];

    return languages.map((language: any) => ({
      id: this.toNumber(language?.$?.id, 0),
      value: String(language?._ ?? '')
    }));
  }


  async insertMouvementStocks (id_order : number) : Promise <any> {
    const carts = await this.getOrderCartRows(id_order);

    for (const cart of carts) {
      await this.stockFacadeService.createStockMouvement(
        cart.id_product,
        cart.id_product_attribute ?? 0,
        -cart.quantity,
        'Order livraison',
        new Date().toISOString()
      );
    }
  }

}
