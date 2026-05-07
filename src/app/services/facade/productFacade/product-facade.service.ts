import { inject, Injectable } from '@angular/core';
import { ProductService } from '../../service/product/product.service';
import { StocksService } from '../../service/stocks/stocks.service';
import { PrestashopProduct } from '../../../models/product.model';

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










}
