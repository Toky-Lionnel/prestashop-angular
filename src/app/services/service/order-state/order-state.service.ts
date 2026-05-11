import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopOrderHistory, buildOrderHistoryXML } from '../../../models/order-history.model';
import { xmlToJson } from '../../../utils/parse-xml.utils';

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

    console.log(xml);


    const response = await api.post('/api/order_histories', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

  async getAllOrderStateByName(): Promise<any> {
    return this.loadOrderStates();
  }

}
