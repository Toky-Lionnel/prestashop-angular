import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { PrestashopCart, buildCartUpdateXML, buildCartXML, buildUserCartXML, buildUserCartXMLUpdate } from '../../../models/cart.model';
import { parseStringPromise } from 'xml2js';
import { CartItem } from '../user-cart/user-cart.service';
import { OrderService } from '../orders/order.service';
import { Order } from '../../../models/OrderModel';
import { CustomerService } from '../customer/customer.service';
import { ProductService } from '../product/product.service';
import { TaxService } from '../tax/tax.service';
import { AttributeService } from '../attribute/attribute.service';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  private interceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);
  private orderService : OrderService = inject(OrderService);
  private customerService : CustomerService = inject(CustomerService);
  private productService : ProductService = inject(ProductService);
  private taxService : TaxService = inject(TaxService);
  private attributeService : AttributeService = inject(AttributeService);

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

  async createCart(cart: PrestashopCart): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildCartXML(cart);

    try {
      const response = await api.post('/api/carts', cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }


  async updateCart(cart: PrestashopCart , cartId: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildCartUpdateXML(cart);

    try {
      const response = await api.put(`/api/carts/${cartId}`, cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error updating cart:', error);
      return null;
    }
  }


  async createCartUser(carts : CartItem[]): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildUserCartXML(carts);

    try {
      const response = await api.post('/api/carts', cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);
      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }

  async updateCartUser(carts : CartItem[], cartId: number): Promise<number | null> {
    const api = this.interceptor.getApi();
    const cartXML = buildUserCartXMLUpdate(carts, cartId);

    console.log(cartXML);


    try {
      const response = await api.put(`/api/carts/${cartId}`, cartXML, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const responseData = await parseStringPromise(response.data);

      console.log(`Response data : ${responseData}`);


      const cart = responseData?.prestashop?.cart?.[0];
      return cart?.id?.[0];
    } catch (error) {
      console.error('Error updating cart:', error);
      return null;
    }
  }


  async getAllCarts() : Promise<any[] | null> {
    const api = this.interceptor.getApi();
    const response = await api.get('/api/carts?display=full', {
      responseType: 'text'
    });

    const json = await parseStringPromise(response.data);
    const carts = json?.prestashop?.carts?.[0]?.cart || [];
    return carts;
  }


  async getCartNonCommandes(): Promise<any[] | null> {
    try {
      const carts = await this.getAllCarts() || [];
      let orders = await this.orderService.getAllOrdersForCart() || [];

      const orderedId = new Set <number>();
      for (const order of orders) {
        const idCart = order.id_cart[0]._;
        console.log(idCart);

        if (idCart !== null) {
          orderedId.add(idCart);
        }
      }

      const nonOrderedCarts = carts.filter((cart: any) => {
        const cartId = cart.id[0];
        return cartId !== null && !orderedId.has(cartId);
      });

      return nonOrderedCarts;
    } catch (error) {
      console.error('Error getting non-ordered carts:', error);
      return [];
    }
  }


  async getCartMapped (): Promise<Order[]> {
    const carts = await this.getCartNonCommandes() || [];
    const products: Order[] = [];

    for (const cart of carts) {
      const mappedCart = await this.mapOrder(cart);
      products.push(mappedCart);
    }
    return products;
  }


  private async mapOrder(o: any): Promise<Order> {
    let email = 'Anonyme';

    if (Number(o.id_customer[0]) !== Number(0)) {
      let id_customer = Number(o.id_customer[0]._);
      const customer = await this.customerService.getCustomerById(id_customer);
      email = customer?.email[0] || 'Anonyme';
    }

    return {
      id: Number(o.id),
      total_paid: Number(o.total_paid),
      date_add: o.date_add,
      customer_email: email,
      recent_statut: 'Non commandé',
      products: await this.mapProducts(o.associations[0].cart_rows[0].cart_row)
    };
  }

  private async mapProducts(rows: any): Promise<any[]> {
    if (!rows) return [];

    const list = Array.isArray(rows) ? rows : [rows];
    const products: any[] = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      // const detail = await this.getProductNameAndCombinationAndPriceTTC(Number(p.id_product[0]._), Number(p.id_product_attribute[0]._));

      products.push({
        product_id: Number(p.id_product[0]._),
        product_name: Number(p.id_product_attribute[0]._) ,
        product_price: 0,
        quantity: Number(p.quantity[0])
      });
    }
    return products;
  }


  async getCartDetails (o : Order) : Promise<Order> {

    for ( const product of o.products) {
      const detail = await this.getProductNameAndCombinationAndPriceTTC(Number(product.product_id), Number(product.product_name));

      product.product_name = detail.productName ?? 'Nom non trouvé';
      product.product_price = detail.price_ttc ?? 0;
    }

    return o;
  }


  async getProductNameAndCombinationAndPriceTTC(id_product: number, id_product_attribute: number): Promise<{ productName: string | null; combinationName: string | null; price_ttc: number | null }> {
    try {
      const detail = await this.productService.getProductDetailById(id_product);
      if (!detail) return { productName: null, combinationName: null, price_ttc: null };

      const basePriceHt = Number(detail.price ?? 0);
      const taxRate = await this.taxService.getTaxValueByIdProduct(id_product).catch(() => null);

      let combinationName: string | null = null;
      let priceHt = basePriceHt;

      if (id_product_attribute && id_product_attribute !== 0) {
        const combo = (detail.combinations || []).find(c => Number(c.id) === Number(id_product_attribute));
        if (combo) {
          // Construire le nom de la combinaison à partir des attributs
          if (Array.isArray(combo.attributes) && combo.attributes.length > 0) {
            combinationName = combo.attributes
              .map((a: any) => (a.groupName ? `${a.groupName}: ${a.attributeName}` : `${a.attributeName}`))
              .join(' / ');
          }

          // Dans PrestaShop la valeur `combination.price` est l'impact sur le prix produit (H.T.)
          const comboPriceImpact = Number((combo.price ?? 0));
          priceHt = basePriceHt + comboPriceImpact;
        }
      }

      if (priceHt === null || priceHt === undefined) return { productName: detail.name ?? null, combinationName, price_ttc: null };

      const priceTtc = taxRate === null || taxRate === undefined
        ? null
        : Number((priceHt * (1 + Number(taxRate) / 100)).toFixed(3));

      return {
        productName: detail.name ?? null,
        combinationName,
        price_ttc: priceTtc
      };
    } catch (error) {
      console.error('Error getting product name/combination/price TTC:', error);
      return { productName: null, combinationName: null, price_ttc: null };
    }
  }

}
