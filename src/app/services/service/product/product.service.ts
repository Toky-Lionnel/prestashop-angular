import { Injectable , inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopProduct, buildProductXML  } from '../../../models/product.model';
import { parseStringPromise } from 'xml2js';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject (AxiosAuthInterceptor);

  async createProduct (product: PrestashopProduct) {
    const api = this.interceptor.getApi();
    const productXML = buildProductXML(product);
    // console.log(productXML);

    const response = await api.post('/api/products', productXML, {
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.product?.[0]?.id?.[0];
    return id;
  }


  async getIdProductByName (name: string): Promise<number | null> {
      const api = this.interceptor.getApi();
      const response = await api.get(
        `/api/products?filter[name][1]=${encodeURIComponent(name)}&display=[id]`,
        {
          responseType: 'text'
        }
      );

      const json = await parseStringPromise(response.data);
      const products = json?.prestashop?.products?.[0];
      const product = products?.product?.[0];
      const idProduct = product?.id?.[0];

      if (!idProduct) {
        console.error('No product found with name:', name);
        return null;
      }

      return Number(idProduct);
  }


  async getIdProductByReference (reference: string): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/products?filter[reference]=[${encodeURIComponent(reference)}]&display=[id]`,
      {
        responseType: 'text'
      }
    );

    const json = await parseStringPromise(response.data);
    const products = json?.prestashop?.products?.[0];
    const product = products?.product?.[0];
    const idProduct = product?.id?.[0];

    if (!idProduct) {
      console.error('No product found with reference:', reference);
      return null;
    }

    return Number(idProduct);
  }


  async getPrixBaseProductByReference (idProduct: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/products?filter[id]=[${idProduct}]&display=[price]`,
      {
        responseType: 'text'
      }
    );

    const json = await parseStringPromise(response.data);
    const products = json?.prestashop?.products?.[0];
    const product = products?.product?.[0];
    const price = product?.price?.[0];

    if (price === undefined) {
      console.error('No product found with ID :', idProduct);
      return null;
    }

    return Number(price);
  }

}
