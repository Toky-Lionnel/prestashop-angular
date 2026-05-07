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

}
