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
import { ProductCsvModel, validateProductCsvRows } from '../../../models/product-csv.model';
import { CombinationCsvModel, validateCombinationCsvRows } from '../../../models/combination-csv.model';
import { CustomerCsvModel, validateCustomerCsvRows } from '../../../models/customer-csv.model';
import { AttributeFacadeService } from '../../facade/attributeFacade/attribute-facade.service';
import { ImagesService } from '../images/images.service';


@Injectable({
  providedIn: 'root'
})
export class ImportFileService {

  constructor() { }

  private productFacadeService : ProductFacadeService = inject(ProductFacadeService);
  private customerFacadeService : CustomerFacadeService = inject(CustomerFacadeService);
  private orderFacadeService : OrderFacadeService = inject(OrderFacadeService);
  private attributeFacadeService : AttributeFacadeService = inject(AttributeFacadeService);
  private imagesService : ImagesService = inject(ImagesService);

  async testImportOrder () {
    const backendData : BackendData = { filename : '', 'table_name' : 'Order', 'data' : ''};
    const carts : PrestashopCart[] = transformParsedRowsToCartModels(JSON.parse(backendData.data));
    await this.orderFacadeService.createOrder(carts);
  }


  async importCSV (backendData: BackendData [], zipFile?: File , importImage ?: boolean ): Promise<string> {
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

      const rawProducts = JSON.parse(productData.data || '[]');
      const productValidation = validateProductCsvRows(rawProducts);

      const rawCombinations = JSON.parse(combinationsData.data || '[]');
      const combinationsValidation = validateCombinationCsvRows(rawCombinations);

      const rawCustomers = JSON.parse(customerData.data || '[]');
      const customersValidation = validateCustomerCsvRows(rawCustomers);

      // Build errors HTML if any
      let errorsHTML = '';
      if (productValidation.invalidData.length > 0) {
        errorsHTML += getErrorsAsHTML(productValidation, productData.filename || 'products');
      }
      if (combinationsValidation.invalidData.length > 0) {
        errorsHTML += getErrorsAsHTML(combinationsValidation, combinationsData.filename || 'combinations');
      }
      if (customersValidation.invalidData.length > 0) {
        errorsHTML += getErrorsAsHTML(customersValidation, customerData.filename || 'customers');
      }

      if (errorsHTML) {
        // return the formatted HTML to the caller (component) to display
        return errorsHTML;
      }

      const productsCSV: ProductCsvModel[] = productValidation.validData;
      await this.productFacadeService.importProductsBase(productsCSV);

      const productMap = this.productFacadeService.getProductMap();

      const combinationsCSV: CombinationCsvModel[] = combinationsValidation.validData;
      await this.attributeFacadeService.importProductCombinations(combinationsCSV, productMap);

      const customersCSV: CustomerCsvModel[] = customersValidation.validData;
      await this.orderFacadeService.importOrders(customersCSV, productMap);

      if (importImage === true) {
        if (zipFile) {
          await this.imagesService.importImages(zipFile);
        }
      }

      return ''; // no errors, empty string indicates success
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
