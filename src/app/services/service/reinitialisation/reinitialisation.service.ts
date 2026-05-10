import { Injectable,inject } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class ReinitialisationService {


    private interceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  constructor() {}

  /**
   * Ordre IMPORTANT :
   * supprimer les dépendances avant les entités principales
   */
  async resetDatabase(): Promise<void> {

    console.log('=== RESET PRESTASHOP START ===');

    // =========================
    // COMMANDES
    // =========================
    await this.deleteAll('/api/order_slip', 'order_slip');
    await this.deleteAll('/api/order_invoices', 'order_invoice');
    await this.deleteAll('/api/order_payments', 'order_payment');
    await this.deleteAll('/api/order_histories', 'order_history');
    await this.deleteAll('/api/order_cart_rules', 'order_cart_rule');
    await this.deleteAll('/api/order_carriers', 'order_carrier');
    await this.deleteAll('/api/order_details', 'order_detail');
    await this.deleteAll('/api/orders', 'order');

    // =========================
    // CARTS
    // =========================
    await this.deleteAll('/api/carts', 'cart');
    await this.deleteAll('/api/cart_rules', 'cart_rule');

    // =========================
    // PRODUITS
    // =========================
    await this.deleteAll('/api/products', 'product');

    // =========================
    // CLIENTS
    // =========================
    await this.deleteAll('/api/addresses', 'address');
    await this.deleteAll('/api/messages', 'message');
    await this.deleteAll('/api/customers', 'customer');

    console.log('=== RESET PRESTASHOP END ===');
  }

  /**
   * Récupère tous les IDs puis supprime un par un
   */
  private async deleteAll(
    endpoint: string,
    xmlNodeName: string
  ): Promise<void> {

    try {

      const api = this.interceptor.getApi();

      console.log(`\nSuppression ${endpoint}`);

      // =========================
      // GET IDS
      // =========================
      const response = await api.get(
        `${endpoint}?display=[id]`
      );

      const parsed = await parseStringPromise(response.data);

      /**
       * Exemple :
       * prestashop.products[0].product
       */
      const collectionKey = this.extractCollectionKey(endpoint);

      const items =
        parsed?.prestashop?.[collectionKey]?.[0]?.[xmlNodeName] || [];

      const ids: number[] = items
        .map((item: any) => Number(item.id?.[0]))
        .filter((id: number) => !isNaN(id));

      console.log(`${ids.length} élément(s) trouvé(s)`);

      // =========================
      // DELETE
      // =========================
      for (const id of ids) {

        try {

          await api.delete(`${endpoint}/${id}`);

          console.log(`✓ ${xmlNodeName} ${id} supprimé`);

        } catch (error: any) {

          console.error(`✗ Erreur suppression ${xmlNodeName} ${id}`);

          if (error.response) {
            console.error(error.response.data);
          } else {
            console.error(error);
          }
        }
      }

    } catch (error: any) {

      console.error(`Erreur endpoint ${endpoint}`);

      if (error.response) {
        console.error(error.response.data);
      } else {
        console.error(error);
      }
    }
  }

  /**
   * /api/products => products
   * /api/order_details => order_details
   */
  private extractCollectionKey(endpoint: string): string {
    return endpoint.replace('/api/', '');
  }
}
