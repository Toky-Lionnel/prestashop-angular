import { Injectable, inject } from '@angular/core';
import { CustomerService } from '../../service/customer/customer.service';
import { PrestashopCustomer, isEmailValid, isNameValid } from '../../../models/customer.model';
import { transformCustomerToAddress, PrestashopAddress } from '../../../models/address.model';
import { parseStringPromise } from 'xml2js';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';

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


  async validateCustomers(customers: PrestashopCustomer[], file_name: string): Promise<ImportValidationResult<PrestashopCustomer>> {
    const validationResult = createEmptyValidationResult<PrestashopCustomer>();

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const lineNumber = customer.line_number;

      const fieldErrors: FieldValidationError[] = [];

      if (!customer.firstname) {
        fieldErrors.push({ field: 'firstname', code: 'required', message: 'Le prénom est requis.' });
      } else if (!isNameValid(customer.firstname)) {
        fieldErrors.push({ field: 'firstname', code: 'format', message: 'Le prénom n\'est pas valide.' });
      }

      if (!customer.lastname) {
        fieldErrors.push({ field: 'lastname', code: 'required', message: 'Le nom est requis.' });
      } else if (!isNameValid(customer.lastname)) {
        fieldErrors.push({ field: 'lastname', code: 'format', message: 'Le nom n\'est pas valide.' });
      }

      if (!customer.email) {
        fieldErrors.push({ field: 'email', code: 'required', message: 'L\'email est requis.' });
      } else if (!isEmailValid(customer.email)) {
        fieldErrors.push({ field: 'email', code: 'format', message: 'L\'email n\'est pas valide.' });
      }

      if (fieldErrors.length > 0) {
        validationResult.invalidData.push({ lineNumber, data: customer, errors: fieldErrors });
      } else {
        validationResult.validData.push(customer);
      }

      // recherche anaty base raha ohatra ka email efa misy
      for (const valid of validationResult.validData) {
        if(valid.email === customer.email && valid !== customer) {
          validationResult.invalidData.push({
            lineNumber,
            data: customer,
            errors: [{ field: 'email', code: 'duplicate', message: 'L\'email est en double dans le fichier.' }]
          });
          validationResult.validData = validationResult.validData.filter(c => c !== customer);
          break;
        }
      }

    }

    validationResult.file_name = file_name;
    validationResult.summary.total = customers.length;
    validationResult.summary.valid = validationResult.validData.length;
    validationResult.summary.invalid = validationResult.invalidData.length;

    return validationResult;
  }





}
