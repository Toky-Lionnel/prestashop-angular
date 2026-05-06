import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PayementOrder, buildOrderPaymentXML } from '../../../models/payement-order.model';
import { parseStringPromise } from 'xml2js'; // Pour parser la réponse XML


@Injectable({
  providedIn: 'root'
})
export class PayementService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  async createPayment(payload: PayementOrder) {
      const xml = buildOrderPaymentXML(payload);
      const api = this.interceptor.getApi();

      try {
        const response = await api.post('/api/order_payments', xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Accept': 'application/xml'
          }
        });

        // Si la réponse est en XML et que vous voulez la parser en JSON
        if (typeof response.data === 'string' && response.data.trim().startsWith('<?xml')) {
          const parsedResponse = await parseStringPromise(response.data);
          return parsedResponse;
        }

        return response.data;
      } catch (error) {
        console.error('Error creating payment', error);
        throw error;
      }
  }
}
