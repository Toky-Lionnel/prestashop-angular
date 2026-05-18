import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportFileService } from '../../services/service/import/import.service';
import { BackendData } from '../../utils/interface';
import { transformCSVtoBackend } from '../../utils/parse-csv.utils';
import { PrestashopProduct ,transformProductRowsToModel } from '../../models/product.model';
import { ProductFacadeService } from '../../services/facade/productFacade/product-facade.service';
import { PrestashopCart, transformCartCsvRowsToPrestashopCarts } from '../../models/cart.model';
import { CartService } from '../../services/service/cart/cart.service';
import { PrestashopOrder, transformCartToOrder } from '../../models/order.model';
import { OrderFacadeService } from '../../services/facade/orderFacade/order-facade.service';
import { PrestashopOrderHistory, transformOrderToOrderHistory } from '../../models/order-history.model';
import { OrderStateService } from '../../services/service/order-state/order-state.service';
import { OrderService } from '../../services/service/orders/order.service';
import { CustomerService } from '../../services/service/customer/customer.service';
import { PrestashopCustomer, transformCustomerCsvToModels, transformParsedCustomersToModels } from '../../models/customer.model';
import { CustomerFacadeService } from '../../services/facade/customerFacade/customer-facade.service';
import { ProductService } from '../../services/service/product/product.service';
import { getErrorsAsHTML } from '../../utils/validation-error-display';
import { ReinitialisationService } from '../../services/service/reinitialisation/reinitialisation.service';
import { SessionService } from '../../services/service/session/session.service';
import { Router } from '@angular/router';
import { ProductCsvModel, validateProductCsvRows } from '../../models/product-csv.model';
import { CombinationCsvModel, validateCombinationCsvRows } from '../../models/combination-csv.model';
import { AttributeFacadeService } from '../../services/facade/attributeFacade/attribute-facade.service';
import { CustomerCsvModel, validateCustomerCsvRows } from '../../models/customer-csv.model';
import { CartCsvModel, transformCustomersCsvToCartCsvRows } from '../../models/cart-csv.model';
import { TaxService } from '../../services/service/tax/tax.service';
import { StocksService } from '../../services/service/stocks/stocks.service';

@Component({
  selector: 'app-import-file',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './import-file.component.html',
  styleUrls: ['./import-file.component.scss']
})
export class ImportFileComponent {
  isLoading = false;
  backFile: File | null = null;
  excelFiles: Array<File | null> = [null, null, null];
  zipFile: File | null = null;
  result: string = '';

  private messageService: MessageService = inject(MessageService);
  private productFacadeService : ProductFacadeService = inject(ProductFacadeService);
  private cartService : CartService = inject(CartService);
  private productService : ProductService = inject(ProductService);

  private orderFacadeService : OrderFacadeService = inject(OrderFacadeService);
  private orderHistoryService : OrderStateService = inject(OrderStateService);

  private orderService : OrderService = inject(OrderService);
  private customerService : CustomerService = inject(CustomerService);
  private customerFacadeService : CustomerFacadeService = inject(CustomerFacadeService);

  private importFileService : ImportFileService = inject(ImportFileService);
  private attributeFacadeService : AttributeFacadeService = inject(AttributeFacadeService);

  private reinitialisationService : ReinitialisationService = inject(ReinitialisationService);
  private sessionService : SessionService = inject(SessionService);
  private router: Router = inject(Router);
  private taxService : TaxService = inject(TaxService);
  private stockService : StocksService = inject(StocksService);

  constructor() {}

  async ngOnInit() {
  }

  async OnReset() {
    await this.reinitialisationService.resetDatabase();
  }

  onBackFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.backFile = input.files?.[0] ?? null;
  }

  onExcelFileChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    this.excelFiles[index] = input.files?.[0] ?? null;
  }

  onZipFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.zipFile = input.files?.[0] ?? null;
  }

  get isExcelImportDisabled(): boolean {
    return this.isLoading || this.excelFiles.some((f) => f === null) || !this.zipFile;
  }

  async importBackFile() {

    if (!this.backFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aucun fichier',
        detail: 'Veuillez sélectionner un fichier venant du back'
      });
      return;
    }

    this.isLoading = true;

    try {
      const backendData: BackendData = await transformCSVtoBackend(this.backFile);
      const parsed = JSON.parse(backendData.data || '[]');

      if (backendData.table_name.toLowerCase() === 'products') {
        const validation = validateProductCsvRows(parsed);
        if (validation.invalidData.length > 0) {
          this.result = getErrorsAsHTML(validation, backendData.filename || 'products');
          this.messageService.add({ severity: 'error', summary: 'Erreurs détectées', detail: 'Consultez le rapport ci-dessous' });
          return;
        }
        await this.productFacadeService.importProductsBase(validation.validData);
      } else if (backendData.table_name.toLowerCase() === 'combinations') {
        const validation = validateCombinationCsvRows(parsed);
        if (validation.invalidData.length > 0) {
          this.result = getErrorsAsHTML(validation, backendData.filename || 'combinations');
          this.messageService.add({ severity: 'error', summary: 'Erreurs détectées', detail: 'Consultez le rapport ci-dessous' });
          return;
        }
        await this.attributeFacadeService.importProductCombinations(validation.validData);
      } else if (backendData.table_name.toLowerCase() === 'customers') {
        const validation = validateCustomerCsvRows(parsed);
        if (validation.invalidData.length > 0) {
          this.result = getErrorsAsHTML(validation, backendData.filename || 'customers');
          this.messageService.add({ severity: 'error', summary: 'Erreurs détectées', detail: 'Consultez le rapport ci-dessous' });
          return;
        }
        await this.orderFacadeService.importOrders(validation.validData);
      }

      this.messageService.add({ severity: 'success', summary: 'Import réussi', detail: 'Le fichier a été importé avec succès' });

    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'Erreur lors de l\'import', detail: error.message || 'Une erreur est survenue' });
    } finally {
      this.isLoading = false;
    }
  }


  async importExcelFiles() {
    if (this.excelFiles.some((f) => !f) || !this.zipFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichiers manquants',
        detail: 'Veuillez sélectionner les 3 fichiers CSV et le fichier ZIP'
      });
      return;
    }

    this.isLoading = true;
    this.result = '';

    try {
      // transformer chaque fichier en BackendData
      const backendDatas : BackendData [] = await Promise.all(
        this.excelFiles.map((f) => transformCSVtoBackend(f as File))
      );

      const errorsHTML = await this.importFileService.importCSV(backendDatas, this.zipFile);
      if (errorsHTML && errorsHTML.trim() !== '') {
        this.result = errorsHTML;
        this.messageService.add({ severity: 'error', summary: 'Erreurs détectées', detail: 'Consultez le rapport ci-dessous' });
      } else {
        this.result = '';
        this.messageService.add({ severity: 'success', summary: 'Import réussi', detail: 'Les fichiers ont été traités' });
      }

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur lors de l\'import',
        detail: error.message || 'Une erreur est survenue'
      });
    } finally {
      this.isLoading = false;
    }
  }

  clearFiles() {
    this.backFile = null;
    this.zipFile = null;
    this.result = '';
  }

  async onLogout() {
    // Clear session data
    this.sessionService.clear();

    // Optionally, navigate to the login page
    await this.router.navigate(['/loginadmin']);
  }
}
