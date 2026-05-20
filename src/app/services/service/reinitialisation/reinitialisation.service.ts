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
    await this.deleteBatch([
      () => this.deleteAll('/api/order_slip', 'order_slip'),
      () => this.deleteAll('/api/order_invoices', 'order_invoice'),
      () => this.deleteAll('/api/order_payments', 'order_payment'),
      () => this.deleteAll('/api/order_histories', 'order_history'),
      () => this.deleteAll('/api/order_cart_rules', 'order_cart_rule'),
      () => this.deleteAll('/api/order_carriers', 'order_carrier'),
      () => this.deleteAll('/api/order_details', 'order_detail'),
      () => this.deleteAll('/api/orders', 'order'),
    ]);

    // =========================
    // CARTS
    // =========================
    await this.deleteBatch([
      () => this.deleteAll('/api/carts', 'cart'),
      () => this.deleteAll('/api/cart_rules', 'cart_rule'),
    ]);

    // =========================
    // MESSAGES
    // =========================
    await this.deleteAll('/api/stock_availables', 'stock_available');
    await this.deleteAll('/api/stock_movements', 'stock_movement');
    await this.deleteAll('/api/stock_movement_reasons', 'stock_movement_reason');

    // =========================
    // PRODUITS
    // =========================
    await this.deleteAll('/api/products', 'product');

    // =========================
    // CATEGORIES
    // =========================
    await this.deleteCategories();

    // =========================
    // CLIENTS
    // =========================
    await this.deleteBatch([
      () => this.deleteAll('/api/addresses', 'address'),
      () => this.deleteAll('/api/messages', 'message'),
      () => this.deleteAll('/api/customers', 'customer'),
    ]);

    // =========================
    // ATTRIBUTES & COMBINATIONS
    // =========================
    await this.deleteBatch([
      () => this.deleteAll('/api/combinations', 'combination'),
      () => this.deleteAll('/api/product_option_values', 'product_option_value'),
      () => this.deleteAll('/api/product_options', 'product_option'),
    ]);
    // =========================
    // TAXES
    // =========================
    await this.deleteBatch([
      () => this.deleteAll('/api/tax_rules', 'tax_rule'),
      () => this.deleteAll('/api/tax_rule_groups', 'tax_rule_group'),
      () => this.deleteAll('/api/taxes', 'tax'),
    ]);
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

  private async deleteCategories (): Promise<void> {
    const api = this.interceptor.getApi();

    try {
      const response = await api.get('/api/categories?display=[id]');
      const parsed = await parseStringPromise(response.data);
      const categories = parsed?.prestashop?.categories?.[0]?.category || [];
      const ids: number[] = categories
        .map((cat: any) => Number(cat.id?.[0]))
        .filter((id: number) => !isNaN(id) && id > 2); // Ne pas supprimer les catégories par défaut (id 1 et 2)

      console.log(`Suppression de ${ids.length} catégories...`);

      for (const id of ids) {
        try {
          await api.delete(`/api/categories/${id}`);
          console.log(`✓ Catégorie ${id} supprimée`);
        } catch (error: any) {
          console.error(`✗ Erreur suppression catégorie ${id}`);
          if (error.response) {
            console.error(error.response.data);
          } else {
            console.error(error);
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur récupération catégories');
      if (error.response) {
        console.error(error.response.data);
      } else {
        console.error(error);
      }
    }
  }

  private async deleteBatch(tasks: (() => Promise<any>)[]): Promise<void> {
    await Promise.all(tasks.map(t => t()));
  }

}
