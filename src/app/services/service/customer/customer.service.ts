import { Injectable, inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { buildCustomerXML, PrestashopCustomer,  } from '../../../models/customer.model';
import { PrestashopAddress, buildAddressXML } from '../../../models/address.model';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  async createCustomer(customer : PrestashopCustomer) : Promise<any | null> {
    const api = this.interceptor.getApi();
    const xml = buildCustomerXML(customer);

    const response = await api.post('/api/customers', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    return parseStringPromise(response.data);
  }


  async createAddressCustomer (address : PrestashopAddress) : Promise<any | null> {
    const api = this.interceptor.getApi();
    const xml = buildAddressXML(address);

    const response = await api.post('/api/addresses', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return parseStringPromise(response.data);
  }

}
