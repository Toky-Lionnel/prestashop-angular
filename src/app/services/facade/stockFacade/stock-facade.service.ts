import { Injectable, inject } from '@angular/core';
import { StocksService } from '../../service/stocks/stocks.service';
import { PrestashopStockMovementReason } from '../../../models/stock-mvt-reason.model';
import { PrestashopStockMovement } from '../../../models/stock-mvt.model';
import { formatPrestashopDate } from '../../../utils/prestashop-date.utils';

@Injectable({
  providedIn: 'root'
})
export class StockFacadeService {

  constructor() { }

  private stockService : StocksService = inject(StocksService);

  async updateStockMouvement (id_product : number, id_product_attribute : number, quantity : number, reason : string, date_add : string) : Promise<void> {

    let quantite_ajoute = Number(quantity);

    const stocks = await this.stockService.getStockByIdProductAndAttribute(id_product, id_product_attribute);
    const idStock = stocks.id[0];
    const quantite_actuel = Number(stocks.quantity[0]);

    const quantite_final = quantite_actuel + quantite_ajoute;
    await this.stockService.updateStockWithIdProduct(idStock, id_product, quantite_final, id_product_attribute);

    let signe = 1;

    if (quantite_ajoute < 0) {
      signe = -1;
      quantite_ajoute = -quantite_ajoute;
    }

    const stockMovementReason : PrestashopStockMovementReason = {
      sign: signe,
      name: { language: [{ id: 1, value: reason }] }
    };

    const idStockMvtReason = await this.stockService.saveStockMovementReason(stockMovementReason);

    const stockMovement : PrestashopStockMovement = {
      id_product: id_product,
      id_product_attribute: id_product_attribute,
      id_currency: 1,
      id_employee: 1,
      id_stock: Number(idStock),
      id_stock_mvt_reason: Number(idStockMvtReason),
      physical_quantity: quantite_ajoute,
      sign: signe,
      price_te: 0,
      date_add: date_add
    };

    await this.stockService.saveStockMovement(stockMovement);
  }


  async createStockMouvement (id_product : number, id_product_attribute : number, quantity : number, reason : string, date_add : string = '') : Promise<void> {
    let quantite_ajoute = Number(quantity);

    const stocks = await this.stockService.getStockByIdProductAndAttribute(id_product, id_product_attribute);
    const idStock = stocks.id[0];

    let signe = 1;

    if (quantite_ajoute < 0) {
      signe = -1;
      quantite_ajoute = -quantite_ajoute;
    }

    const stockMovementReason : PrestashopStockMovementReason = {
      sign: signe,
      name: { language: [{ id: 1, value: reason }] }
    };

    const idStockMvtReason = await this.stockService.saveStockMovementReason(stockMovementReason);

    // Step 1: Créer le mouvement
    const stockMovement : PrestashopStockMovement = {
      id_product: id_product,
      id_product_attribute: id_product_attribute,
      id_currency: 1,
      id_employee: 1,
      id_stock: Number(idStock),
      id_stock_mvt_reason: Number(idStockMvtReason),
      physical_quantity: quantite_ajoute,
      sign: signe,
      price_te: 0,
      date_add: ''
    };

    const idStockMvt = await this.stockService.saveStockMovement(stockMovement);

    if (!idStockMvt || !date_add) {
      return;
    }

    // Step 2: GET le mouvement créé
    const mvtData = await this.stockService.getStockMovementById(idStockMvt);

    if (!mvtData) {
      console.error('Failed to retrieve stock movement:', idStockMvt);
      return;
    }

    // Step 3: Modifier la date_add et faire un PUT
    mvtData.date_add = [formatPrestashopDate(date_add)];

    const updatedMovement: PrestashopStockMovement = {
      id_product: id_product,
      id_product_attribute: id_product_attribute,
      id_currency: mvtData.id_currency?.[0] ?? 1,
      id_employee: mvtData.id_employee?.[0] ?? 1,
      id_stock: Number(mvtData.id_stock?.[0] ?? idStock),
      id_stock_mvt_reason: Number(mvtData.id_stock_mvt_reason?.[0] ?? idStockMvtReason),
      physical_quantity: Number(mvtData.physical_quantity?.[0] ?? quantite_ajoute),
      sign: Number(mvtData.sign?.[0] ?? signe),
      price_te: Number(mvtData.price_te?.[0] ?? 0),
      date_add: formatPrestashopDate(date_add)
    };

    await this.stockService.updateStockMovement(idStockMvt, updatedMovement);
  }


}
