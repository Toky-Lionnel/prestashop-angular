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

export interface AttributeOptionLookup {
  id: number;
  groupType: string;
  name: string;
  publicName: string;
}

export interface AttributeValueLookup {
  id: number;
  idAttributeGroup: number;
  name: string;
  groupName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AttributeService {

  private optionLookupCache = new Map<number, Promise<AttributeOptionLookup | null>>();
  private optionValueLookupCache = new Map<number, Promise<AttributeValueLookup | null>>();

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

  async getProductOptionById(id: number): Promise<AttributeOptionLookup | null> {
    if (this.optionLookupCache.has(id)) {
      return this.optionLookupCache.get(id)!;
    }

    const lookupPromise = (async () => {
      const api = this.interceptor.getApi();
      const response = await api.get(
        `/api/product_options?filter[id]=[${id}]&display=full`,
        { responseType: 'text' }
      );

      const responseData = await parseStringPromise(response.data);
      const option = responseData?.prestashop?.product_options?.[0]?.product_option?.[0];
      const optionId = Number(option?.id?.[0] ?? id);

      if (!optionId) {
        return null;
      }

      const nameEntry = option?.name?.[0]?.language?.[0];
      const publicNameEntry = option?.public_name?.[0]?.language?.[0];

      return {
        id: optionId,
        groupType: String(option?.group_type?.[0] ?? ''),
        name: String(nameEntry?.value ?? nameEntry?._ ?? nameEntry ?? '').trim(),
        publicName: String(publicNameEntry?.value ?? publicNameEntry?._ ?? publicNameEntry ?? '').trim()
      };
    })();

    this.optionLookupCache.set(id, lookupPromise);
    return lookupPromise;
  }

  async getProductOptionValueById(id: number): Promise<AttributeValueLookup | null> {
    if (this.optionValueLookupCache.has(id)) {
      return this.optionValueLookupCache.get(id)!;
    }

    const lookupPromise = (async () => {
      const api = this.interceptor.getApi();
      const response = await api.get(
        `/api/product_option_values?filter[id]=[${id}]&display=full`,
        { responseType: 'text' }
      );

      const responseData = await parseStringPromise(response.data);
      const optionValue = responseData?.prestashop?.product_option_values?.[0]?.product_option_value?.[0];
      const optionValueId = Number(optionValue?.id?.[0] ?? id);

      if (!optionValueId) {
        return null;
      }

      const nameEntry = optionValue?.name?.[0]?.language?.[0];
      const groupId = Number(optionValue?.id_attribute_group?.[0]._ ?? 0);
      const optionGroup = await this.getProductOptionById(groupId);

      return {
        id: optionValueId,
        idAttributeGroup: groupId,
        name: String(nameEntry?.value ?? nameEntry?._ ?? nameEntry ?? '').trim(),
        groupName: optionGroup?.publicName || optionGroup?.name || null
      };
    })();

    this.optionValueLookupCache.set(id, lookupPromise);
    return lookupPromise;
  }

  async getIdCombination( idProduct: number,attributeName: string): Promise<number | null> {

    const api = this.interceptor.getApi();

    const attributeResponse = await api.get(
      `/api/product_option_values?filter[name][1]=${encodeURIComponent(attributeName)}&display=[id]`,
      { responseType: 'text' }
    );

    const attributeData = await parseStringPromise(attributeResponse.data);

    const productOptionValue =
      attributeData?.prestashop?.product_option_values?.[0]?.product_option_value?.[0];

    const optionValueId = productOptionValue?.id?.[0];

    if (!optionValueId) {
      return null;
    }

    const combinationsResponse = await api.get(
      `/api/combinations?filter[id_product]=${idProduct}&display=full`,
      { responseType: 'text' }
    );

    const combinationsData = await parseStringPromise(combinationsResponse.data);

    const combinations =
      combinationsData?.prestashop?.combinations?.[0]?.combination ?? [];


    for (const combination of combinations) {

      const combinationId = combination?.id?.[0];

      const optionValues =
        combination?.associations?.[0]
          ?.product_option_values?.[0]
          ?.product_option_value ?? [];

      const hasAttribute = optionValues.some((value: any) => {
        return Number(value?.id?.[0]) === Number(optionValueId);
      });

      if (hasAttribute) {
        return Number(combinationId);
      }
    }

    return null;
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
