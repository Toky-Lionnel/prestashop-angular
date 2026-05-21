import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopOrderHistory, PrestashopOrderHistoryUpdate, buildOrderHistoryXML, buildUpdateOrderHistoryXML } from '../../../models/order-history.model';
import { xmlToJson } from '../../../utils/parse-xml.utils';
import { parseStringPromise } from 'xml2js';
import { PrestashopCartRow } from '../../../models/cart.model';
import { PrestashopStockMovement } from '../../../models/stock-mvt.model';
import { StocksService } from '../stocks/stocks.service';
import { OrderService } from '../orders/order.service';

export interface PrestashopOrderStateLanguage {
  id: number;
  value: string;
}

export interface PrestashopOrderState {
  id: number;
  names: PrestashopOrderStateLanguage[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderStateService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private stocksService : StocksService = inject(StocksService);
  private orderStates: PrestashopOrderState[] = [];


  private transformOrderStates(rawOrderStates: any): PrestashopOrderState[] {
    const states = Array.isArray(rawOrderStates)
      ? rawOrderStates
      : [];

    return states
      .map((state: any) => {
        const id = this.toNumber(state?.id, 0);

        return {
          id,
          names: this.extractNameValue(state?.name)
        };
      })
      .filter((state: PrestashopOrderState) => state.id > 0);
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


  private getOrderStateById(id: number): PrestashopOrderState | undefined {
    return this.orderStates.find((state) => state.id === id);
  }

  getOrderStateIdByName(name: string, languageId: number = 1): number | null {
    const normalizedName = name.trim().toLowerCase();

    const matchedState = this.orderStates.find((state) =>
      state.names.some((entry) => entry.id === languageId && entry.value.trim().toLowerCase() === normalizedName)
    );

    return matchedState?.id ?? null;
  }

  getOrderStateNameById(id: number, languageId: number = 1): string | null {
    const state = this.getOrderStateById(id);

    if (!state) {
      return null;
    }

    const nameEntry = state.names.find((entry) => entry.id === languageId);
    return nameEntry ? nameEntry.value : null;
  }

  getStoredOrderStates(): PrestashopOrderState[] {
    return [...this.orderStates];
  }


  async loadOrderStates(): Promise<PrestashopOrderState[]> {
    const api = this.interceptor.getApi();
    const response = await api.get('/api/order_states?display=[id,name]');

    const json = await xmlToJson(response.data);

    const rawOrderStates =
    json?.prestashop?.order_states?.order_state ?? [];
    this.orderStates = this.transformOrderStates(rawOrderStates);
    return this.getStoredOrderStates();
  }

  async createOrderState(orderHistory : PrestashopOrderHistory): Promise<void> {
    const api = this.interceptor.getApi();
    const xml = buildOrderHistoryXML(orderHistory);

    await api.post('/api/order_histories', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

  async getFirstOrderHistoryId(id_order: number): Promise<number | null> {
    const api = this.interceptor.getApi();

    const response = await api.get(`/api/order_histories?filter[id_order]=[${id_order}]&display=[id,id_order_state,date_add]`);
    const json = await xmlToJson(response.data);

    const rawOrderHistories = json?.prestashop?.order_histories?.order_history;
    const histories = this.sortOrderHistoriesByDate(this.normalizeList(rawOrderHistories));
    const firstHistory = histories[0];

    return this.toNumber(this.extractXmlText(firstHistory?.id), 0) || null;
  }

  private extractHistoryDate(history: any): string {
    return this.extractXmlText(history?.date_add);
  }

  private sortOrderHistoriesByDate(histories: any[]): any[] {
    return [...histories].sort((left, right) =>
      this.extractHistoryDate(left).localeCompare(this.extractHistoryDate(right))
    );
  }

  async getFirstOrderStateOrder(id_order: number): Promise<PrestashopOrderState | null> {
    const api = this.interceptor.getApi();

    if (this.orderStates.length === 0) {
      await this.loadOrderStates();
    }

    const response = await api.get(`/api/order_histories?filter[id_order]=[${id_order}]&display=[id_order_state,date_add]`);
    const json = await xmlToJson(response.data);

    const rawOrderHistories = json?.prestashop?.order_histories?.order_history;
    const histories = this.sortOrderHistoriesByDate(this.normalizeList(rawOrderHistories));

    const firstHistory = histories[0];
    const idOrderState = this.toNumber(this.extractXmlText(firstHistory?.id_order_state), 0);

    if (!idOrderState) {
      return null;
    }

    return this.getOrderStateById(idOrderState) ?? null;
  }

  async getOrderStateOrder(id_order: number): Promise<PrestashopOrderState | null> {
    return this.getFirstOrderStateOrder(id_order);
  }

  async updateOrderHistoryState(id_order_history: number, orderHistory: PrestashopOrderHistoryUpdate): Promise<void> {
    const api = this.interceptor.getApi();
    const xml = buildUpdateOrderHistoryXML(orderHistory);

    console.log(xml);
    await api.put(`/api/order_histories/${id_order_history}`, xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

  async deleteOrderState(id_order_history: number): Promise<void> {
    const api = this.interceptor.getApi();
    await api.delete(`/api/order_histories/${id_order_history}`);
  }

  async getAllOrderStateByName(): Promise<any> {
    return this.loadOrderStates();
  }

  async updateOrderState (id_order: number, id_order_state: number): Promise<void> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <request>
              <id_order>${id_order}</id_order>
              <idOrderState>${id_order_state}</idOrderState>
            </request>`;

    const api = this.interceptor.getApi();
    await api.post('/index.php?fc=module&module=mon_module&controller=shiporder', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

}
