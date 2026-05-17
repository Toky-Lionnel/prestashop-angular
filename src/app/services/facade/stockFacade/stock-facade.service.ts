import { Injectable, inject } from '@angular/core';
import { StocksService } from '../../service/stocks/stocks.service';
import { PrestashopStockMovementReason } from '../../../models/stock-mvt-reason.model';
import { PrestashopStockMovement } from '../../../models/stock-mvt.model';

@Injectable({
  providedIn: 'root'
})
export class StockFacadeService {

  constructor() { }

  private stockService : StocksService = inject(StocksService);

  async updateStockMouvement (id_product : number, id_product_attribute : number, quantity : number, reason : string) : Promise<void> {

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
      price_te: 0
    };

    await this.stockService.saveStockMovement(stockMovement);
  }


  async createStockMouvement (id_product : number, id_product_attribute : number, quantity : number, reason : string) : Promise<void> {
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

    const stockMovement : PrestashopStockMovement = {
      id_product: id_product,
      id_product_attribute: id_product_attribute,
      id_currency: 1,
      id_employee: 1,
      id_stock: Number(idStock),
      id_stock_mvt_reason: Number(idStockMvtReason),
      physical_quantity: quantite_ajoute,
      sign: signe,
      price_te: 0
    };

    await this.stockService.saveStockMovement(stockMovement);
  }


}
