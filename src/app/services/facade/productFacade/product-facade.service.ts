import { inject, Injectable } from '@angular/core';
import { ProductService } from '../../service/product/product.service';
import { StocksService } from '../../service/stocks/stocks.service';
import { PrestashopProduct } from '../../../models/product.model';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';

@Injectable({
  providedIn: 'root'
})
export class ProductFacadeService {

  private productService : ProductService = inject(ProductService);
  private stocksService : StocksService = inject(StocksService);

  constructor() { }

  async importProduct (products : PrestashopProduct[]) {
    for (const product of products) {
      const idProduct = await this.productService.createProduct(product);
      if (idProduct) {
        const createdProduct: PrestashopProduct = { ...product, id: idProduct };
        createdProduct.quantity = product.quantity;
        const id_stock = await this.stocksService.getIdStockProductsId(idProduct);
        await this.stocksService.updateStock(id_stock, createdProduct);
      }
    }
  }


  async validateProducts(products: PrestashopProduct[], file_name: string): Promise<ImportValidationResult<PrestashopProduct>> {
    const validationResult = createEmptyValidationResult<PrestashopProduct>();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const lineNumber = product.line_number;

      const fieldErrors: FieldValidationError[] = [];

      if (!product.name || !product.name.language || product.name.language.length === 0 || !product.name.language[0].value) {
        fieldErrors.push({ field: 'name', code: 'required', message: 'Le nom du produit est requis.' });
      }

      if (product.price === null || product.price === undefined || isNaN(product.price)) {
        fieldErrors.push({ field: 'price', code: 'required', message: 'Le prix du produit est requis et doit être un nombre.' });
      } else if (product.price < 0) {
        fieldErrors.push({ field: 'price', code: 'invalid_value', message: 'Le prix du produit ne peut pas être négatif.' });
      }

      if (product.quantity === null || product.quantity === undefined || isNaN(product.quantity)) {
        fieldErrors.push({ field: 'quantity', code: 'required', message: 'La quantité du produit est requise et doit être un nombre.' });
      } else if (product.quantity < 0) {
        fieldErrors.push({ field: 'quantity', code: 'invalid_value', message: 'La quantité du produit ne peut pas être négative.' });
      }

      if (fieldErrors.length > 0) {
        validationResult.invalidData.push({
          lineNumber,
          data: product,
          errors: fieldErrors
        });
      } else {
        validationResult.validData.push(product);
      }


      // eto no mila manao recherche anaty base raha ohatra ka
      for (const validProduct of validationResult.validData) {
        if (validProduct.name == product.name) {
          validationResult.invalidData.push({
            lineNumber,
            data: product,
            errors: [{
              field: 'name',
              code: 'duplicate',
              message: 'Un produit avec ce nom existe déjà.'
            }]
          });
          validationResult.validData = validationResult.validData.filter(p => p !== product);
          break;
        }
      }
    }

    validationResult.file_name = file_name;
    validationResult.summary.total = products.length;
    validationResult.summary.valid = validationResult.validData.length;
    validationResult.summary.invalid = validationResult.invalidData.length;

    return validationResult;
  }









}
