import { inject, Injectable } from '@angular/core';
import { PrestashopCart, transformParsedRowsToCartModels } from '../../../models/cart.model';
import { OrderFacadeService } from '../../facade/orderFacade/order-facade.service';
import { BackendData } from '../../../utils/interface';

interface CSVRow {
  [key: string]: any;
}

interface ImportResult {
  headers: string[];
  filename: string;
  data: CSVRow[];
  rowCount: number;
  columnCount: number;
}

interface BackendImportPayload {
  file_name: string;
  table_name: string;
  data: CSVRow | CSVRow[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportFileService {


  constructor() { }

  private orderFacadeService : OrderFacadeService = inject(OrderFacadeService);

  async testImportOrder () {
    const backendData : BackendData = { filename : '', 'table_name' : 'Order', 'data' : ''};
    const carts : PrestashopCart[] = transformParsedRowsToCartModels(JSON.parse(backendData.data));
    await this.orderFacadeService.createOrder(carts);
  }

}
