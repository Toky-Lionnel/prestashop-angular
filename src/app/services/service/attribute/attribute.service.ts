import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import {
  buildCombinationXML,
  buildProductOptionXML,
  buildProductOptionValueXML,
  PrestashopCombination,
  PrestashopProductOption,
  PrestashopProductOptionValue
} from '../../../models/attribute.model';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class AttributeService {

  private interceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  constructor() { }

  async createCombination(combination: PrestashopCombination): Promise<number | null> {
    const api = this.interceptor.getApi();
    const xml = buildCombinationXML(combination);
    const response = await api.post('/api/combinations', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.combination?.[0]?.id?.[0];
    return id ? Number(id) : null;
  }


  async createProductOption(productOption: PrestashopProductOption): Promise<number | null> {
    const api = this.interceptor.getApi();
    const xml = buildProductOptionXML(productOption);
    const response = await api.post('/api/product_options', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.product_option?.[0]?.id?.[0];
    return id ? Number(id) : null;
  }


  async createProductOptionValue(productOptionValue: PrestashopProductOptionValue): Promise<number | null> {
    const api = this.interceptor.getApi();
    const xml = buildProductOptionValueXML(productOptionValue);
    const response = await api.post('/api/product_option_values', xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.product_option_value?.[0]?.id?.[0];
    return id ? Number(id) : null;
  }

}
