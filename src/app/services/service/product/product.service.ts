import { Injectable, inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopProduct, buildProductXML } from '../../../models/product.model';
import {
  mapPrestashopCombinationToVitrineCombination,
  mapPrestashopGetAllResponseToVitrine,
  mapPrestashopProductImagesToVitrineImages,
  mapPrestashopProductToDetail,
  VitrineProduct,
  VitrineProductDetail
} from '../../../models/vitrine-product.model';
import { parseStringPromise } from 'xml2js';
import { CategoriesService } from '../categories/categories.service';
import { AttributeService } from '../attribute/attribute.service';
import { StocksService } from '../stocks/stocks.service';

const VITRINE_DISPLAY = '[id,name,price,id_default_image,id_category_default,available_date]';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }

  private interceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private categoriesService: CategoriesService = inject(CategoriesService);
  private attributeService: AttributeService = inject(AttributeService);
  private stocksService: StocksService = inject(StocksService);

  async createProduct(product: PrestashopProduct) {
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

  async getDateAvailabilityByIdProduct(idProduct: number): Promise<string | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/products?filter[id]=[${idProduct}]&display=[available_date]`,
      {
        responseType: 'text'
      }
    );

    const json = await parseStringPromise(response.data);
    const products = json?.prestashop?.products?.[0];
    const product = products?.product?.[0];
    const availableDate = product?.available_date?.[0];

    if (!availableDate) {
      console.error('No available date found for product ID:', idProduct);
      return null;
    }

    return availableDate;
  }

  async getIdProductByReference(reference: string): Promise<number | null> {
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

  async getProductByReference(reference: string): Promise<number | null> {
    return this.getIdProductByReference(reference);
  }

  async getPrixBaseProductByReference(idProduct: number): Promise<number | null> {
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

  async getAllRawProducts(): Promise<any[]> {
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


  async getProductDetailById(idProduct: number,categoryNameById?: Map<number, string>): Promise<VitrineProductDetail | null> {
    const api = this.interceptor.getApi();
    const response = await api.get( `/api/products?filter[id]=[${idProduct}]&display=full`, {
        responseType: 'text'
      }
    );

    const responseData = await parseStringPromise(response.data);
    const product = responseData?.prestashop?.products?.[0]?.product?.[0];

    if (!product) {
      return null;
    }

    const categoryMap = categoryNameById ?? new Map((await this.categoriesService.getAll()).map((category) => [category.id, category.name] as const));

    const [images, combinations, productStock] = await Promise.all([
      this.loadProductImages(idProduct),
      this.loadProductCombinationsWithStock(idProduct),
      this.stocksService.getStockQuantity(idProduct)
    ]);

    const detail = mapPrestashopProductToDetail(product, {
      categoryNameById: categoryMap,
      images,
      combinations
    });

    detail.stock_available = productStock;
    return detail;
  }

  async getProductDetailSansImagesById(idProduct: number,categoryNameById?: Map<number, string>): Promise<VitrineProductDetail | null> {
    const api = this.interceptor.getApi();
    const response = await api.get( `/api/products?filter[id]=[${idProduct}]&display=full`, {
        responseType: 'text'
      }
    );

    const responseData = await parseStringPromise(response.data);
    const product = responseData?.prestashop?.products?.[0]?.product?.[0];

    if (!product) {
      return null;
    }

    const categoryMap = categoryNameById ?? new Map((await this.categoriesService.getAll()).map((category) => [category.id, category.name] as const));

    const [combinations, productStock] = await Promise.all([
      this.loadProductCombinationsWithStock(idProduct),
      this.stocksService.getStockQuantity(idProduct)
    ]);

    const detail = mapPrestashopProductToDetail(product, {
      categoryNameById: categoryMap,
      combinations
    });

    detail.stock_available = productStock;
    return detail;
  }

  private async loadProductImages(idProduct: number) {
    const api = this.interceptor.getApi();
    try {
      const imagesResponse = await api.get(`/api/images/products/${idProduct}`, {
        responseType: 'text'
      });
      const imagesData = await parseStringPromise(imagesResponse.data);
      return mapPrestashopProductImagesToVitrineImages(idProduct, imagesData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`No images found for product ID: ${idProduct}, returning empty array`);
        return [
          {
            id: 0,
            url: 'assets/images/no-image-available.png', // Image placeholder
            legend: 'Image indisponible'
          }
        ];
      }
      throw error;
    }
  }

  private async loadProductCombinationsWithStock(idProduct: number) {
    const api = this.interceptor.getApi();
    try {
      const combinationsResponse = await api.get(
        `/api/combinations?filter[id_product]=${idProduct}&display=full`,
        {
          responseType: 'text'
        }
      );
      const combinationsData = await parseStringPromise(combinationsResponse.data);
      const rawCombinations = combinationsData?.prestashop?.combinations?.[0]?.combination ?? [];
      const combinationsArray = Array.isArray(rawCombinations) ? rawCombinations : [rawCombinations];

      const attributeValueIds = this.extractAttributeValueIds(combinationsArray);
      const attributeLookupById = await this.loadAttributeLookup(attributeValueIds);

      return Promise.all(
        combinationsArray
          .filter(Boolean)
          .map((combination: any) => this.mapCombinationWithStock(idProduct, combination, attributeLookupById))
      );
    } catch (error: any) {
      // Gérer le cas où il n'y a pas de combinaisons (erreur 404)
      if (error.response?.status === 404) {
        console.warn(`No combinations found for product ID: ${idProduct}, returning empty array`);
        return [];
      }
      // Pour les autres erreurs, les relancer
      throw error;
    }
  }

  private extractAttributeValueIds(combinationsArray: any[]): Set<number> {
    const attributeValueIds = new Set<number>();

    for (const combination of combinationsArray.filter(Boolean)) {
      const optionValues = combination?.associations?.[0]?.product_option_values?.[0]?.product_option_value ?? [];
      const valuesArray = Array.isArray(optionValues) ? optionValues : [optionValues];

      for (const value of valuesArray.filter(Boolean)) {
        const valueId = Number(value?.id?.[0] ?? 0);
        if (valueId > 0) {
          attributeValueIds.add(valueId);
        }
      }
    }

    return attributeValueIds;
  }

  private async loadAttributeLookup(attributeValueIds: Set<number>) {
    const attributeLookupEntries = await Promise.all(
      Array.from(attributeValueIds).map(async (valueId) => {
        const lookup = await this.attributeService.getProductOptionValueById(valueId);
        return lookup ? [valueId, lookup] as const : null;
      })
    );

    const attributeLookupById = new Map<number, any>();
    for (const entry of attributeLookupEntries) {
      if (entry !== null) {
        attributeLookupById.set(entry[0], entry[1]);
      }
    }

    return attributeLookupById;
  }

  private async mapCombinationWithStock(productId: number,
    combination: any,attributeLookupById: Map<number, any>) {
    const combinationId = Number(combination?.id?.[0] ?? 0);
    const stock = await this.stocksService.getStockQuantity(productId, combinationId);

    const optionValues = combination?.associations?.[0]?.product_option_values?.[0]?.product_option_value ?? [];
    const valuesArray = Array.isArray(optionValues) ? optionValues : [optionValues];

    const attributeNameById = new Map<number, { attributeName: string; groupName: string | null }>();
    for (const value of valuesArray.filter(Boolean)) {
      const valueId = Number(value?.id?.[0] ?? 0);
      const attributeLookup = attributeLookupById.get(valueId);
      if (valueId > 0 && attributeLookup) {
        attributeNameById.set(valueId, {
          attributeName: attributeLookup.name,
          groupName: attributeLookup.groupName
        });
      }
    }

    const combinationData = mapPrestashopCombinationToVitrineCombination(productId, combination, attributeNameById);
    combinationData.stock_available = stock;
    return combinationData;
  }


  async getCategoryIdByProductId(idProduct: number) {
    const api = this.interceptor.getApi();
    const response = await api.get(
      `/api/products?filter[id]=[${idProduct}]&display=[id_category_default]`,
      {
        responseType: 'text'
      }
    );

    const json = await parseStringPromise(response.data);
    const products = json?.prestashop?.products?.[0];
    const product = products?.product?.[0];
    const categoryId = product?.id_category_default?.[0]._;

    if (!categoryId) {
      console.error('No category ID found for product ID:', idProduct);
      return null;
    }

    return Number(categoryId);
  }
}
