import { Injectable, inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { parseStringPromise } from 'xml2js';
import { PrestashopStockAvailable, buildStockXML } from '../../../models/stock.model';
import {PrestashopProduct} from '../../../models/product.model';


@Injectable({
  providedIn: 'root'
})
export class StocksService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject (AxiosAuthInterceptor);

  async getIdStockProductsId (id_product : number) {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=0`);
    const responseData = await parseStringPromise(response.data);
    const id = responseData.prestashop.stock_availables[0].stock_available[0].$.id;
    return Number(id);
  }

  async updateStock (id_stock : number, product: PrestashopProduct) {
    const api = this.interceptor.getApi();
    const stockData: PrestashopStockAvailable = {
      id: id_stock,
      id_product: product.id,
      id_product_attribute: 0,
      id_shop: 1,
      id_shop_group: 0,
      quantity: product.quantity,
      depends_on_stock: 0,
      out_of_stock: 2
    };
    const xmlData = buildStockXML(stockData);

    const response = await api.put(`/api/stock_availables/${id_stock}`, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  }

}
