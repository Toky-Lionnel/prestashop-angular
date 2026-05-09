import { Injectable, inject } from '@angular/core';
import { CustomerService } from '../../service/customer/customer.service';
import { PrestashopCustomer } from '../../../models/customer.model';
import { transformCustomerToAddress, PrestashopAddress } from '../../../models/address.model';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class CustomerFacadeService {

  constructor() { }

  private customerService : CustomerService = inject(CustomerService);

  async importCustomers(customers: PrestashopCustomer[]): Promise<void> {
    for (const customer of customers) {
      await this.createCustomer(customer);
    }
  }


  async createCustomer(customer : PrestashopCustomer) : Promise<void> {
    const responseCustomer = await this.customerService.createCustomer(customer);

    const customerData = responseCustomer?.prestashop?.customer?.[0];
    const idCustomer = customerData?.id?.[0];

    const address = transformCustomerToAddress(customer);
    address.id_customer = idCustomer;
    address.alias = customer.address;
    address.address1 = `Adresse de ${customer.firstname} ${customer.lastname}`;

    await this.customerService.createAddressCustomer(address);
  }

}
