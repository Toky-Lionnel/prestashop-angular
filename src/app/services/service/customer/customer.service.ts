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

    const responseData = await parseStringPromise(response.data);
    const idAdress = responseData?.prestashop?.address?.[0]?.id?.[0];

    if (!idAdress) {
      console.warn(responseData);
      console.error('Failed to create address for customer ID:', address.id_customer);
      return null;
    }

    return idAdress;
  }


  async getAddressByIdCustomer (id: number) : Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/addresses?filter[id_customer]=${id}&display=[id]`, {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const addresses = json?.prestashop?.addresses?.[0];
    const address = addresses?.address?.[0];
    const idAddress = address?.id?.[0];

    if (!idAddress) {
      console.error('No address found for customer ID:', id);
      return null;
    }

    return Number(idAddress);
  }


  async getDetailsAddressByIdCustomer (id: number) : Promise<any | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/addresses?filter[id_customer]=${id}&display=full`, {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const addresses = json?.prestashop?.addresses?.[0];
    const address = addresses?.address?.[0];
    console.log(address);

    return address || null;
  }


  async getIdCustomerByEmail (email: string) : Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/customers?filter[email]=${email}&display=[id]`, {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const customers = json?.prestashop?.customers?.[0];
    const customer = customers?.customer?.[0];
    const id = customer?.id?.[0];

    if (!id) {
      console.error('No customer found with email:', email);
      return null;
    }

    return Number(id);
  }


  async getCustomerByEmail (email: string) : Promise<any | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/customers?filter[email]=${email}&display=full`, {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const customers = json?.prestashop?.customers?.[0];
    const customer = customers?.customer?.[0];

    return customer || null;
  }

  async getCustomerById (id: number) : Promise<any | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/customers/${id}`, {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    return json?.prestashop?.customer?.[0] || null;
  }

  async getAllCustomers() : Promise<any[] | null> {
    const api = this.interceptor.getApi();
    const response = await api.get('/api/customers?display=[id,email]', {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const customers = json?.prestashop?.customers?.[0]?.customer || [];
    return customers;
  }

}
