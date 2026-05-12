import { inject, Injectable } from '@angular/core';
import { PrestashopCart, transformParsedRowsToCartModels } from '../../../models/cart.model';
import { OrderFacadeService } from '../../facade/orderFacade/order-facade.service';
import { BackendData } from '../../../utils/interface';
import { ProductFacadeService } from '../../facade/productFacade/product-facade.service';
import { CustomerFacadeService } from '../../facade/customerFacade/customer-facade.service';
import { PrestashopCustomer, transformParsedCustomersToModels } from '../../../models/customer.model';
import { PrestashopProduct, transformProductRowsToModel } from '../../../models/product.model';
import { ImportValidationResult } from '../../../models/validation.model';
import { getErrorsAsHTML } from '../../../utils/validation-error-display';
import { ProductCsvModel, transformProductCsvRowsToModel } from '../../../models/product-csv.model';
import { CombinationCsvModel, transformCombinationCsvRowsToModel } from '../../../models/combination-csv.model';
import { CustomerCsvModel, transformCustomerCsvRowsToModel } from '../../../models/customer-csv.model';
import { AttributeFacadeService } from '../../facade/attributeFacade/attribute-facade.service';


@Injectable({
  providedIn: 'root'
})
export class ImportFileService {


  constructor() { }

  private productFacadeService : ProductFacadeService = inject(ProductFacadeService);
  private customerFacadeService : CustomerFacadeService = inject(CustomerFacadeService);
  private orderFacadeService : OrderFacadeService = inject(OrderFacadeService);
  private attributeFacadeService : AttributeFacadeService = inject(AttributeFacadeService);

  async testImportOrder () {
    const backendData : BackendData = { filename : '', 'table_name' : 'Order', 'data' : ''};
    const carts : PrestashopCart[] = transformParsedRowsToCartModels(JSON.parse(backendData.data));
    await this.orderFacadeService.createOrder(carts);
  }


  async importCSV (backendData: BackendData []): Promise<void> {
      const productData: BackendData | undefined = backendData.find(
        data => data.table_name.toLowerCase() === 'products'
      );

      const combinationsData: BackendData | undefined = backendData.find(
        data => data.table_name.toLowerCase() === 'combinations'
      );

      const customerData: BackendData | undefined = backendData.find(
        data => data.table_name.toLowerCase() === 'customers'
      );

      if (!productData || !combinationsData || !customerData) {
        throw new Error('Missing required import data');
      }

      const productsCSV : ProductCsvModel [] = transformProductCsvRowsToModel(JSON.parse(productData.data));
      await this.productFacadeService.importProductsBase(productsCSV);

      const combinationsCSV : CombinationCsvModel [] = transformCombinationCsvRowsToModel(JSON.parse(combinationsData.data));
      await this.attributeFacadeService.importProductCombinations(combinationsCSV);

      const customersCSV : CustomerCsvModel [] = transformCustomerCsvRowsToModel(JSON.parse(customerData.data));
      await this.orderFacadeService.importOrders(customersCSV);
  }


  async importData(backendData: BackendData[]): Promise<string> {
    const productData: BackendData | undefined = backendData.find(
      data => data.table_name === 'PRODUCT'
    );

    const customerData: BackendData | undefined = backendData.find(
      data => data.table_name === 'CUSTOMER'
    );

    const orderData: BackendData | undefined = backendData.find(
      data => data.table_name === 'ORDER'
    );

    if (!productData || !customerData) {
      throw new Error('Missing Product or Customer import data');
    }

    const importResultsProducts: ImportValidationResult<PrestashopProduct> =
      await this.productFacadeService.validateProducts(
        transformProductRowsToModel(JSON.parse(productData.data || '[]')),
        productData.filename || ''
      );

    const importResultsCustomers: ImportValidationResult<PrestashopCustomer> =
      await this.customerFacadeService.validateCustomers(
        transformParsedCustomersToModels(JSON.parse(customerData.data || '[]')),
        customerData.filename || ''
      );

    const importResultsOrders: ImportValidationResult<PrestashopCart> =
      await this.orderFacadeService.validateOrders(
        transformParsedRowsToCartModels(JSON.parse(orderData?.data || '[]')),
        orderData?.filename || '',
        importResultsProducts,
        importResultsCustomers
      );

    const errorsHTML = getErrorsAsHTML(importResultsProducts, productData?.filename || '') +
      getErrorsAsHTML(importResultsCustomers, customerData?.filename || '') +
      getErrorsAsHTML(importResultsOrders, orderData?.filename || '');

    await this.productFacadeService.importProduct(importResultsProducts.validData);
    await this.customerFacadeService.importCustomers(importResultsCustomers.validData);
    await this.orderFacadeService.createOrder(importResultsOrders.validData);
    return errorsHTML;
  }

}
