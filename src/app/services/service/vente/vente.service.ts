import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { ProductService } from '../product/product.service';
import { OrderDetail, mapPrestashopOrderDetailToModel } from '../../../models/order-detail.model';
import { CategoriesService } from '../categories/categories.service';
import { CategorySalesSummary } from '../../../models/category-sales-summary.model';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class VenteService {

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private productService : ProductService = inject(ProductService);
  private categoriesService : CategoriesService = inject(CategoriesService);

  constructor() { }

  async getIdOrdersValides () : Promise<number []> {
    const ids : number [] = [];

    const api = this.interceptor.getApi();
    const response = await api.get('/api/orders?filter[current_state]=[2,5]&display=[id]', {
      responseType: 'text'
    });

    const responseData = await parseStringPromise(response.data);
    const orders = responseData.prestashop.orders[0];

    for (let i = 0; i < orders.order.length; i++) {
      const order = orders.order[i];
      ids.push(parseInt(order.id[0]));
    }
    return ids;
  }

  async getDetailsOrder (id_order : number) : Promise<OrderDetail | OrderDetail[] | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/order_details?filter[id_order]=${id_order}&display=full`, {
      responseType: 'text'
    });

    const responseData = await parseStringPromise(response.data);
    const orderDetailsXml = responseData?.prestashop?.order_details?.[0];
    if (!orderDetailsXml) return null;

    const rawDetails = orderDetailsXml.order_detail || [];
    const mappedPromises = (Array.isArray(rawDetails) ? rawDetails : [rawDetails]).map((d: any) =>
      mapPrestashopOrderDetailToModel(d, (idProduct: number) => this.productService.getCategoryIdByProductId(idProduct))
    );

    const mapped = await Promise.all(mappedPromises);
    return mapped.length === 1 ? mapped[0] : mapped;
  }


  async getAllVentes () : Promise<OrderDetail []> {
    const ids = await this.getIdOrdersValides();
    const allDetails: OrderDetail[] = [];

    for (const id of ids) {
      const details = await this.getDetailsOrder(id);
      if (details) {
        if (Array.isArray(details)) {
          allDetails.push(...details);
        } else {
          allDetails.push(details);
        }
      }
    }

    return allDetails;
  }

  /**
   * Regroupe les ventes par catégorie et calcule totaux et bénéfices.
   * - total_purchase: somme des (original_wholesale_price * quantity)
   * - total_sales: somme des total_price_tax_excl si présent, sinon unit_price_tax_incl * quantity
   */
  async getSalesByCategory(): Promise<CategorySalesSummary[]> {
    const ventes = await this.getAllVentes();

    const agg = new Map<string | number, { category_id: number | null; total_purchase: number; total_sales: number }>();

    for (const v of ventes) {
      const key = v.category_id != null ? v.category_id : 'null';
      const qty = v.product_quantity ?? 0;
      const totalSales = (v.total_price_tax_excl != null) ? v.total_price_tax_excl : ((v.unit_price_tax_incl ?? 0) * qty);
      const totalPurchase = (v.original_wholesale_price ?? 0) * qty;

      const cur = agg.get(key) ?? { category_id: v.category_id ?? null, total_purchase: 0, total_sales: 0 };
      cur.total_purchase += Number(totalPurchase) || 0;
      cur.total_sales += Number(totalSales) || 0;
      agg.set(key, cur);
    }

    // Précharger les catégories pour obtenir les noms (si possible)
    let categoryNameById = new Map<number, string>();
    try {
      const cats = await this.categoriesService.getAll();
      categoryNameById = new Map(cats.map((c: any) => [c.id, c.name] as const));
    } catch (e) {
      // ignore si récupération impossible
    }

    const results: CategorySalesSummary[] = [];
    for (const entry of agg.values()) {
      const benefit = entry.total_sales - entry.total_purchase;
      results.push({
        category_id: entry.category_id,
        category_name: entry.category_id != null ? categoryNameById.get(entry.category_id) ?? null : null,
        total_purchase: Math.round(entry.total_purchase * 100) / 100,
        total_sales: Math.round(entry.total_sales * 100) / 100,
        benefit: Math.round(benefit * 100) / 100
      });
    }

    return results;
  }

}
