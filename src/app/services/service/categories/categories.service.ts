import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopCategory, buildCategoryXML} from '../../../models/category.model';
import { parseStringPromise } from 'xml2js';
import { ProductCsvModel } from '../../../models/product-csv.model';

export interface CategoryOption {
  id: number;
  name: string;
}


@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  constructor() { }

  private intereceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  async createCategories (categorie : PrestashopCategory) : Promise<number | null> {
    const api = this.intereceptor.getApi();
    const xml = buildCategoryXML(categorie);
    const response = await api.post('/api/categories', xml , {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.category?.[0]?.id?.[0];
    return id ? Number(id) : null;
  }

  async getIdCategoryByName(name: string): Promise<number | null> {
    const api = this.intereceptor.getApi();
    const response = await api.get(
      `/api/categories?filter[name][1]=${encodeURIComponent(name)}&display=[id]`,
      {
        responseType: 'text'
      }
    );

    const responseData = await parseStringPromise(response.data);
    const category = responseData?.prestashop?.categories?.[0]?.category?.[0];
    const idCategory = category?.id?.[0];

    if (!idCategory) {
      return null;
    }

    return Number(idCategory);
  }

  async getAll(): Promise<CategoryOption[]> {
    const api = this.intereceptor.getApi();
    const response = await api.get('/api/categories', {
      params: {
        display: '[id,name]'
      },
      responseType: 'text'
    });

    const responseData = await parseStringPromise(response.data);
    const categories = responseData?.prestashop?.categories?.[0]?.category ?? [];

    return (Array.isArray(categories) ? categories : [categories])
      .filter(Boolean)
      .map((category: any) => {
        const id = Number(category?.id?.[0] ?? 0);
        const nameEntry = category?.name?.[0]?.language?.[0];
        const name =
          nameEntry?.value ??
          nameEntry?._ ??
          nameEntry ??
          '';

        return {
          id,
          name: String(name).trim()
        };
      })
      .filter((category) => category.id > 0 && category.name.length > 0);
  }


  groupCategories (productsCategories : ProductCsvModel []) : PrestashopCategory [] {
    const categoriesMap : Map<string, PrestashopCategory> = new Map();

    for (const product of productsCategories) {
      const categoryName = product.categorie.trim();

      if (!categoriesMap.has(categoryName)) {
        const newCategory: PrestashopCategory = {
          id_parent: 2,
          active: 1,
          name: { language: [{ id: 1, value: categoryName }] },
          link_rewrite: { language: [{ id: 1, value: categoryName.toLowerCase().replace(/\s+/g, '-') }] },
          description: { language: [{ id: 1, value: '' }] }
        };
        categoriesMap.set(categoryName, newCategory);
      }
    }

    return Array.from(categoriesMap.values());
  }

}
