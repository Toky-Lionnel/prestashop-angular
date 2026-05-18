import { Injectable, inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { parseStringPromise } from 'xml2js';
import { PrestashopStockAvailable, buildStockXML } from '../../../models/stock.model';
import {PrestashopProduct} from '../../../models/product.model';
import { PrestashopStockMovement, buildStockMovementXML, buildStockUpdateMovementXML } from '../../../models/stock-mvt.model';
import { PrestashopStockMovementReason, buildStockMovementReasonXML } from '../../../models/stock-mvt-reason.model';
import { PrestashopStockMovementListItem, PrestashopStockMovementGroup } from '../../../models/stock-mvt-list.model';


@Injectable({
  providedIn: 'root'
})
export class StocksService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject (AxiosAuthInterceptor);

  private extractCreatedId(responseData: any, resourceName: string): number | null {
    const id = responseData?.prestashop?.[resourceName]?.[0]?.id?.[0];
    return id ? Number(id) : null;
  }

  async getIdStockProductsId (id_product : number) {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=0`);
    const responseData = await parseStringPromise(response.data);
    const id = responseData.prestashop.stock_availables[0].stock_available[0].$.id;
    return Number(id);
  }

  async updateStock (id_stock : number, product: PrestashopProduct) {
    const api = this.interceptor.getApi();
    const stockData: PrestashopStockAvailable = {
      id: id_stock,
      id_product: product.id,
      id_product_attribute: 0,
      id_shop: 1,
      id_shop_group: 0,
      quantity: product.quantity,
      depends_on_stock: 0,
      out_of_stock: 2
    };
    const xmlData = buildStockXML(stockData);
    const response = await api.put(`/api/stock_availables/${id_stock}`, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  }


  async updateStockWithIdProduct (id_stock : number, idProduct: number, quantity: number, id_product_attribute: number = 0) {
    const api = this.interceptor.getApi();
    const stockData: PrestashopStockAvailable = {
      id: Number(id_stock),
      id_product: Number(idProduct),
      id_product_attribute: Number(id_product_attribute),
      id_shop: 1,
      id_shop_group: 0,
      quantity: Number(quantity),
      depends_on_stock: 0,
      out_of_stock: 0
    };
    const xmlData = buildStockXML(stockData);

    const response = await api.put(`/api/stock_availables/${id_stock}`, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    return response.data;
  }

  async getIdStockByProductAndAttribute(id_product: number, id_product_attribute: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailables = responseData?.prestashop?.stock_availables?.[0]?.stock_available;
    if (!stockAvailables) return null;

    const stock = Array.isArray(stockAvailables) ? stockAvailables[0] : stockAvailables;
    const id = stock?.$?.id ?? stock?.id?.[0] ?? null;
    return id ? Number(id) : null;
  }

  async getStockQuantity(id_product: number, id_product_attribute: number = 0): Promise<number> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}&display=[quantity]`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailables = responseData?.prestashop?.stock_availables?.[0]?.stock_available;
    if (!stockAvailables) return 0;

    const stock = Array.isArray(stockAvailables) ? stockAvailables[0] : stockAvailables;
    const quantity = stock?.quantity?.[0] ?? stock?.quantity ?? 0;
    return Number(quantity);
  }


  async getStockByIdProductAndAttribute(id_product: number, id_product_attribute: number = 0): Promise<any | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}&display=full`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailables = responseData?.prestashop?.stock_availables?.[0]?.stock_available;
    if (!stockAvailables) return null;

    const stock = Array.isArray(stockAvailables) ? stockAvailables[0] : stockAvailables;
    return stock;
  }

  async getIdProductAndIdProductAttributeByIdStock(id_stock: number): Promise<{ id_product: number | null, id_product_attribute: number | null } | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_availables/${id_stock}?display=full`);
    const responseData = await parseStringPromise(response.data);

    const stockAvailable = responseData?.prestashop?.stock_available?.[0];
    if (!stockAvailable) return null;

    const id_product = stockAvailable.id_product?.[0]._ ?? null;
    const id_product_attribute = stockAvailable.id_product_attribute?.[0]._ ?? null;

    return {
      id_product: id_product ? Number(id_product) : null,
      id_product_attribute: id_product_attribute ? Number(id_product_attribute) : 0
    };
  }

  async saveStockMovement(stockMovement: PrestashopStockMovement): Promise<number | null> {
    const api = this.interceptor.getApi();
    const xmlData = buildStockMovementXML(stockMovement);
    const response = await api.post('/api/stock_movements', xmlData, {
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    return responseData.prestashop.stock_mvt?.[0]?.id[0] ? Number(responseData.prestashop.stock_mvt?.[0]?.id[0]) : null;
  }

  async saveStockMovementReason(stockMovementReason: PrestashopStockMovementReason): Promise<number | null> {
    const api = this.interceptor.getApi();
    const xmlData = buildStockMovementReasonXML(stockMovementReason);

    const response = await api.post('/api/stock_movement_reasons', xmlData, {
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    return this.extractCreatedId(responseData, 'stock_movement_reason');
  }

  async getStockMovements(): Promise<PrestashopStockMovementListItem[] | null> {

    const api = this.interceptor.getApi();
    const response = await api.get('/api/stock_movements?display=full');
    const responseData = await parseStringPromise(response.data);
    const stockMvts = responseData?.prestashop?.stock_mvts?.[0]?.stock_mvt;
    const stock : PrestashopStockMovementListItem [] = [];

    for (const s of stockMvts) {
      const prodInfo = await this.getIdProductAndIdProductAttributeByIdStock(Number(s.id_stock[0]._));
      const id_product = prodInfo?.id_product ?? null;
      const id_product_attribute = prodInfo?.id_product_attribute ?? null;

      const stockMouvement : PrestashopStockMovementListItem = {
        id: Number(s.id[0]),
        id_product: id_product,
        id_product_attribute: id_product_attribute,
        id_stock: s.id_stock ? Number(s.id_stock[0]._) : null,
        physical_quantity: s.physical_quantity ? Number(s.physical_quantity[0]) : null,
        sign: s.sign ? Number(s.sign[0]) : null,
        date_add: s.date_add ? String(s.date_add[0]) : null,
      };

      stock.push(stockMouvement);
    }

    return stock;
  }

  async getStockMovementsGroupedByDayProductAttribute(
    id_product: number,
    id_product_attribute: number = 0,
    options?: {
      startDate?: string; // YYYY-MM-DD
      endDate?: string; // YYYY-MM-DD
    }
  ): Promise<PrestashopStockMovementGroup[]> {
    const api = this.interceptor.getApi();

    // Step 1: Get id_stock from id_product and id_product_attribute
    const id_stock = await this.getIdStockByProductAndAttribute(id_product, id_product_attribute);
    if (!id_stock) {
      return [];
    }

    // Step 2: Fetch stock movements filtered by id_stock
    const response = await api.get(`/api/stock_movements?filter[id_stock]=${id_stock}&display=full`);
    const responseData = await parseStringPromise(response.data);

    const stockMvts = responseData?.prestashop?.stock_mvts?.[0]?.stock_mvt;
    if (!stockMvts) return [];

    const items = Array.isArray(stockMvts) ? stockMvts : [stockMvts];

    // Parse movements
    const movements: PrestashopStockMovementListItem[] = items.map((s: any) => {
      return {
        id: Number(s.id?.[0] ?? 0),
        id_product: Number(id_product),
        id_product_attribute: Number(id_product_attribute),
        id_stock: id_stock,
        id_stock_mvt_reason: s.id_stock_mvt_reason ? Number(s.id_stock_mvt_reason[0]) : null,
        physical_quantity: s.physical_quantity ? Number(s.physical_quantity[0]) : null,
        sign: s.sign ? Number(s.sign[0]) : null,
        date_add: s.date_add ? String(s.date_add[0]) : null,
        reference: s.reference ? String(s.reference[0]) : null,
      } as PrestashopStockMovementListItem;
    });

    // Step 3: Apply date filters if provided
    let filtered = movements;
    if (options) {
      if (options.startDate) {
        filtered = filtered.filter((m: any) => {
          if (!m.date_add) return false;
          const d = String(m.date_add).split(' ')[0];
          return d >= options.startDate!;
        });
      }
      if (options.endDate) {
        filtered = filtered.filter((m: any) => {
          if (!m.date_add) return false;
          const d = String(m.date_add).split(' ')[0];
          return d <= options.endDate!;
        });
      }
    }

    // Step 4: Group by day
    const groups = new Map<string, PrestashopStockMovementGroup>();

    for (const m of filtered) {
      const date = m.date_add ? String(m.date_add).split(' ')[0] : new Date().toISOString().slice(0, 10);
      const key = date;
      const qty = (m.physical_quantity ?? 0) * (m.sign ?? 1);

      if (!groups.has(key)) {
        groups.set(key, {
          date,
          id_product: Number(id_product),
          id_product_attribute: Number(id_product_attribute),
          total_quantity: qty,
          movements: [m],
        });
      } else {
        const g = groups.get(key)!;
        g.total_quantity += qty;
        g.movements.push(m);
      }
    }

    return Array.from(groups.values());
  }


  async getEvolutionStockProduct(
    id_product: number,
    id_product_attribute: number = 0,
    options?: {
      startDate?: string; // YYYY-MM-DD
      endDate?: string; // YYYY-MM-DD
    }
  ): Promise<PrestashopStockMovementListItem[]> {
    const api = this.interceptor.getApi();

    // Step 1: Get id_stock from id_product and id_product_attribute
    const id_stock = await this.getIdStockByProductAndAttribute(id_product, id_product_attribute);
    if (!id_stock) {
      return [];
    }

    // Step 2: Fetch stock movements filtered by id_stock
    const response = await api.get(`/api/stock_movements?filter[id_stock]=${id_stock}&display=full`);
    const responseData = await parseStringPromise(response.data);

    const stockMvts = responseData?.prestashop?.stock_mvts?.[0]?.stock_mvt;
    if (!stockMvts) return [];

    const items = Array.isArray(stockMvts) ? stockMvts : [stockMvts];

    // Parse movements
    const movements: PrestashopStockMovementListItem[] = items.map((s: any) => {
      return {
        id: Number(s.id?.[0] ?? 0),
        id_product: Number(id_product),
        id_product_attribute: Number(id_product_attribute),
        id_stock: id_stock,
        id_stock_mvt_reason: s.id_stock_mvt_reason ? Number(s.id_stock_mvt_reason[0]) : null,
        physical_quantity: s.physical_quantity ? Number(s.physical_quantity[0]) : null,
        sign: s.sign ? Number(s.sign[0]) : null,
        date_add: s.date_add ? String(s.date_add[0]) : null,
        reference: s.reference ? String(s.reference[0]) : null,
      } as PrestashopStockMovementListItem;
    });

    return movements;
  }

  async getStockMovementById(id: number): Promise<any | null> {
    const api = this.interceptor.getApi();
    const response = await api.get(`/api/stock_movements/${id}?display=full`, {
      responseType: 'text'
    });

    const responseData = await parseStringPromise(response.data);
    console.log(responseData);

    return responseData?.prestashop?.stock_mvt?.[0] ?? null;
  }

  async updateStockMovement(id: number, stockMovement: PrestashopStockMovement): Promise<boolean> {
    const api = this.interceptor.getApi();
    const xmlData = buildStockUpdateMovementXML(stockMovement, id);

    console.log(`Xml update : ${xmlData}`);

    try {
      await api.put(`/api/stock_movements/${id}`, xmlData, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating stock movement:', error);
      return false;
    }
  }
}
