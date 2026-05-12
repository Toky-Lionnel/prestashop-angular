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

  async getProductOptionIdByName(name: string): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/product_options?filter[name][1]=${encodeURIComponent(name)}&display=[id]`,
      { responseType: 'text' }
    );

    const responseData = await parseStringPromise(response.data);
    const option = responseData?.prestashop?.product_options?.[0]?.product_option?.[0];
    const id = option?.id?.[0];
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

  async getProductOptionValueIdByName(id_attribute_group: number, name: string): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/product_option_values?filter[id_attribute_group]=${id_attribute_group}&filter[name][1]=${encodeURIComponent(name)}&display=[id]`,
      { responseType: 'text' }
    );

    const responseData = await parseStringPromise(response.data);
    const pov = responseData?.prestashop?.product_option_values?.[0]?.product_option_value?.[0];
    const id = pov?.id?.[0];
    return id ? Number(id) : null;
  }

  async getIdAttribute(name: string): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/product_option_values?filter[name][1]=${encodeURIComponent(name)}&display=[id]`,
      { responseType: 'text' }
    );

    const responseData = await parseStringPromise(response.data);
    const pov = responseData?.prestashop?.product_option_values?.[0]?.product_option_value?.[0];
    const id = pov?.id?.[0];
    return id ? Number(id) : null;
  }

  async getCombinationIdByReference(id_product: number, reference: string): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/combinations?filter[id_product]=${id_product}&filter[reference]=[${encodeURIComponent(reference)}]&display=[id]`,
      { responseType: 'text' }
    );

    const responseData = await parseStringPromise(response.data);
    const combination = responseData?.prestashop?.combinations?.[0]?.combination?.[0];
    const id = combination?.id?.[0];
    return id ? Number(id) : null;
  }

}
