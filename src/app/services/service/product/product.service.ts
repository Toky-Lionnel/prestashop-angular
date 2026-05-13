import { Injectable , inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopProduct, buildProductXML  } from '../../../models/product.model';
import { mapPrestashopGetAllResponseToVitrine, VitrineProduct } from '../../../models/vitrine-product.model';
import { parseStringPromise } from 'xml2js';

const VITRINE_DISPLAY = '[id,name,price,id_default_image,id_category_default,available_date]';


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

  async getAllRawProducts (): Promise<any[]> {
    const api = this.interceptor.getApi();
    const response = await api.get('/api/products', {
      params: {
        display: VITRINE_DISPLAY
      },
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    return json?.prestashop?.products?.[0]?.product ?? [];
  }


  async getAllVitrineProducts(
    name: string | null = null,
    priceMin: number | null = null,
    priceMax: number | null = null,
    categoryId: number | null = null
  ): Promise<VitrineProduct[]> {
    const api = this.interceptor.getApi();
    const params: Record<string, string> = {
      display: VITRINE_DISPLAY
    };

    if (name !== null && name.trim() !== '') {
      params['filter[name]'] = `[%${name.trim()}]`;
    }

    if (priceMin !== null || priceMax !== null) {
      const min = priceMin !== null ? priceMin : '';
      const max = priceMax !== null ? priceMax : '';
      params['filter[price]'] = `[${min},${max}]`;
    }

    if (categoryId !== null) {
      params['filter[id_category_default]'] = `[${categoryId}]`;
    }

    const response = await api.get('/api/products', {
      params,
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);

    return mapPrestashopGetAllResponseToVitrine(json);
  }

}
