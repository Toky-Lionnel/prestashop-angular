import { Injectable, inject } from '@angular/core';
import { OrderService } from '../orders/order.service';
import { ProductService } from '../product/product.service';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { CartService, PhysicalQuantityGrouped, StockAvailableGrouped } from '../cart/cart.service';
import { parseStringPromise } from 'xml2js';
import { CategoriesService } from '../categories/categories.service';


export interface CategoryStockSummary {
  categoryId: number;
  categoryName: string | null;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}


@Injectable({
  providedIn: 'root'
})
export class StockStatService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private orderService : OrderService = inject(OrderService);
  private productService : ProductService = inject(ProductService);
  private cartService : CartService = inject(CartService);
  private categorieService : CategoriesService = inject(CategoriesService);
  /**
   * Extrait la valeur string d'un champ XML2JS (qui est toujours un tableau)
   */
  private extractValue(value: any): string | null {
    if (!value) return null;
    if (Array.isArray(value)) {
      return String(value[0]).trim();
    }
    return String(value).trim();
  }

  /**
   * Extrait et convertit la valeur en nombre
   */
  private extractNumeric(value: any): number | null {
    const stringValue = this.extractValue(value);
    if (!stringValue) return null;
    const num = Number(stringValue);
    return isNaN(num) ? null : num;
  }


  // qté réservé par produits
  async getReservedProductsOrders(): Promise<Array<{ id_product: number; id_product_attribute: number; quantity: number ; category : number}>> {
    try {
      const orderRows = await this.orderService.getReservedOrders() || [];

      const reservedProducts = new Map<string, { id_product: number; id_product_attribute: number; quantity: number ; category : number}>();

      for (const row of orderRows) {
        const idProduct = row.product_id[0]._;
        const idProductAttribute = row.product_attribute_id[0];
        const quantity = Number(row.product_quantity);

          const key = `${idProduct}`;
          const category = await this.productService.getCategoryIdByProductId(idProduct).catch(() => 0) || 0;

          const existing = reservedProducts.get(key);
          if (existing) {
            existing.quantity += quantity;
          } else {
            reservedProducts.set(key, {
              id_product: idProduct,
              id_product_attribute: idProductAttribute,
              quantity,
              category: category
            });
          }
      }
      return [...reservedProducts.values()];
    } catch (error) {
      console.error('Error getting reserved products:', error);
      return [];
    }
  }


  // qté reservé par produits et produits attributes
  async getReservedProductsAttributeOrders(): Promise<Array<{ id_product: number; id_product_attribute: number; quantity: number }>> {
    try {
      const orderRows = await this.orderService.getReservedOrders() || [];
      const reservedProducts = new Map<string, { id_product: number; id_product_attribute: number; quantity: number}>();

      for (const row of orderRows) {
        const idProduct = row.product_id[0]._;
        const idProductAttribute = row.product_attribute_id[0];
        const quantity = Number(row.product_quantity);

          const key = `${idProduct}-${idProductAttribute}`;

          const existing = reservedProducts.get(key);
          if (existing) {
            existing.quantity += quantity;
          } else {
            reservedProducts.set(key, {
              id_product: idProduct,
              id_product_attribute: idProductAttribute,
              quantity
            });
          }
      }
      return [...reservedProducts.values()];
    } catch (error) {
      console.error('Error getting reserved products:', error);
      return [];
    }
  }

  async getStockAvailableGrouped(): Promise<StockAvailableGrouped[]> {
    try {
      const api = this.interceptor.getApi();
      const response = await api.get('/api/stock_availables?filter[id_product_attribute]=0&display=full', {
        responseType: 'text'
      });

      const json = await parseStringPromise(response.data);
      const stockList = json?.prestashop?.stock_availables?.[0]?.stock_available || [];
      const stocks = Array.isArray(stockList) ? stockList : [stockList];

      const result: StockAvailableGrouped[] = [];

      for (const stock of stocks) {
        const idProduct = this.extractNumeric(stock?.id_product?.[0]?._ ?? stock?.id_product?.[0]) || 0;
        const idProductAttribute = this.extractNumeric(stock?.id_product_attribute?.[0]?._ ?? stock?.id_product_attribute?.[0]) || 0;
        const quantity = stock?.quantity[0];
        const dependsOnStock = this.extractNumeric(stock?.depends_on_stock?.[0]?._ ?? stock?.depends_on_stock?.[0]) || 0;
        const outOfStock = this.extractNumeric(stock?.out_of_stock?.[0]?._ ?? stock?.out_of_stock?.[0]) || 0;

        if (idProduct === 0) continue;

        const product = await this.productService.getProductDetailSansImagesById(idProduct).catch(() => null);

        result.push({
          id_product: idProduct,
          id_product_attribute: idProductAttribute,
          product_name: product?.name || null,
          quantity,
          category : product?.categoryId || 0,
          depends_on_stock: dependsOnStock,
          out_of_stock: outOfStock
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting stock available grouped:', error);
      return [];
    }
  }


    // async getPhysicalQuantityGrouped(): Promise<PhysicalQuantityGrouped[]> {
    //   try {
    //     // Récupère les stocks disponibles (id_product_attribute == 0 inclus) et les produits réservés
    //     const available = await this.getStockAvailableGrouped();
    //     const reserved = await this.getReservedProductsOrders();

    //     // Map key: "idProduct:idProductAttribute"
    //     const map = new Map<string, { id_product: number; id_product_attribute: number; quantity: number }>();

    //     // Ajouter les quantités disponibles
    //     for (const a of available) {
    //       const key = `${a.id_product}:${a.id_product_attribute}`;
    //       const qty = Number(a.quantity) || 0;
    //       map.set(key, { id_product: a.id_product, id_product_attribute: a.id_product_attribute, quantity: qty });
    //     }

    //     // Ajouter les quantités réservées (somme)
    //     for (const r of reserved) {
    //       const key = `${r.id_product}:${r.id_product_attribute}`;
    //       const existing = map.get(key);
    //       if (existing) {
    //         existing.quantity += r.quantity;
    //       } else {
    //         map.set(key, { id_product: r.id_product, id_product_attribute: r.id_product_attribute, quantity: r.quantity });
    //       }
    //     }

    //     const result: PhysicalQuantityGrouped[] = [];
    //     for (const [, item] of map) {
    //       const product = await this.productService.getProductDetailById(item.id_product).catch(() => null);
    //       result.push({
    //         id_product: item.id_product,
    //         id_product_attribute: item.id_product_attribute,
    //         product_name: product?.name || null,
    //         physical_quantity: item.quantity
    //       });
    //     }

    //     return result;
    //   } catch (error) {
    //     console.error('Error getting physical quantity grouped:', error);
    //     return [];
    //   }
    // }

    /**
     * Retourne un tableau regroupé par catégorie avec :
     * - Qté physique (disponible + réservé)
     * - Qté réservée
     * - Qté disponible
     */
    async getCategoryStockSummary(): Promise<CategoryStockSummary[]> {
      try {
        const available = await this.getStockAvailableGrouped();
        const reserved = await this.getReservedProductsOrders();

        // Map produit => { categoryId, availableQty, reservedQty }
        const productMap = new Map<number, { categoryId: number; availableQty: number; reservedQty: number }>();

        for (const a of available) {
          const pid = a.id_product;
          const cat = a.category || 0;
          const qty = Number(a.quantity) || 0;
          const existing = productMap.get(pid);
          if (existing) {
            existing.availableQty += qty;
            if (!existing.categoryId) existing.categoryId = cat;
          } else {
            productMap.set(pid, { categoryId: cat, availableQty: qty, reservedQty: 0 });
          }
        }

        for (const r of reserved) {
          const pid = r.id_product;
          const cat = r.category || 0;
          const qty = r.quantity || 0;
          const existing = productMap.get(pid);
          if (existing) {
            existing.reservedQty += qty;
            if (!existing.categoryId) existing.categoryId = cat;
          } else {
            productMap.set(pid, { categoryId: cat, availableQty: 0, reservedQty: qty });
          }
        }

        // Agréger par catégorie
        const categoryMap = new Map<number, { available: number; reserved: number; physical: number; representativeProductId?: number }>();

        for (const [pid, data] of productMap) {
          const catId = data.categoryId || 0;
          const existing = categoryMap.get(catId) || { available: 0, reserved: 0, physical: 0, representativeProductId: pid };
          existing.available += data.availableQty;
          existing.reserved += data.reservedQty;
          existing.physical += (data.availableQty + data.reservedQty);

          if (!existing.representativeProductId) {
            existing.representativeProductId = pid;
          }

          categoryMap.set(catId, existing);
        }

        const result: CategoryStockSummary[] = [];

        for (const [catId, sums] of categoryMap) {
          let catName: string | null = await this.categorieService.getNameCategoryById(catId);
          result.push({
            categoryId: catId,
            categoryName: catName,
            physicalQuantity: sums.physical,
            reservedQuantity: sums.reserved,
            availableQuantity: sums.available
          });
        }

        return result;
      } catch (error) {
        console.error('Error getting category stock summary:', error);
        return [];
      }
    }

}
