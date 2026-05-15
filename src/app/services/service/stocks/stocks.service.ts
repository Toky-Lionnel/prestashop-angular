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


  async updateStockWithIdProduct (id_stock : number, idProduct: number, quantity: number, id_product_attribute: number = 0) {
    const api = this.interceptor.getApi();
    const stockData: PrestashopStockAvailable = {
      id: Number(id_stock),
      id_product: Number(idProduct),
      id_product_attribute: Number(id_product_attribute),
      id_shop: 1,
      id_shop_group: 0,
      quantity: Number(quantity),
      depends_on_stock: 0,
      out_of_stock: 0
    };
    const xmlData = buildStockXML(stockData);

    console.log(xmlData);


    const response = await api.put(`/api/stock_availables/${id_stock}`, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  }

  async getIdStockByProductAndAttribute(id_product: number, id_product_attribute: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailables = responseData?.prestashop?.stock_availables?.[0]?.stock_available;
    if (!stockAvailables) return null;

    const stock = Array.isArray(stockAvailables) ? stockAvailables[0] : stockAvailables;
    const id = stock?.$?.id ?? stock?.id?.[0] ?? null;
    return id ? Number(id) : null;
  }

  async getStockQuantity(id_product: number, id_product_attribute: number = 0): Promise<number> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}&display=[quantity]`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailables = responseData?.prestashop?.stock_availables?.[0]?.stock_available;
    if (!stockAvailables) return 0;

    const stock = Array.isArray(stockAvailables) ? stockAvailables[0] : stockAvailables;
    const quantity = stock?.quantity?.[0] ?? stock?.quantity ?? 0;
    return Number(quantity);
  }



}
