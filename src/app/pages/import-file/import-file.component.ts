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
import { PrestashopCart, transformParsedRowsToCartModels } from '../../models/cart.model';
import { CartService } from '../../services/service/cart/cart.service';
import { PrestashopOrder, transformCartToOrder } from '../../models/order.model';
import { OrderFacadeService } from '../../services/facade/orderFacade/order-facade.service';
import { PrestashopOrderHistory, transformOrderToOrderHistory } from '../../models/order-history.model';
import { OrderStateService } from '../../services/service/order-state/order-state.service';
import { OrderService } from '../../services/service/orders/order.service';
import { CustomerService } from '../../services/service/customer/customer.service';
import { PrestashopCustomer, transformParsedCustomersToModels } from '../../models/customer.model';
import { CustomerFacadeService } from '../../services/facade/customerFacade/customer-facade.service';
import { ProductService } from '../../services/service/product/product.service';
import { getErrorsAsHTML } from '../../utils/validation-error-display';
import { ReinitialisationService } from '../../services/service/reinitialisation/reinitialisation.service';
import { SessionService } from '../../services/service/session/session.service';
import { Router } from '@angular/router';
import { ProductCsvModel, transformProductCsvRowsToModel } from '../../models/product-csv.model';

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

  private reinitialisationService : ReinitialisationService = inject(ReinitialisationService);
  private sessionService : SessionService = inject(SessionService);
  private router: Router = inject(Router);

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

  get isExcelImportDisabled(): boolean {
    return this.isLoading || this.excelFiles.some((f) => f === null);
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
      const productsCSV : ProductCsvModel [] = transformProductCsvRowsToModel(JSON.parse(backendData.data));
      await this.productFacadeService.importProductsBase(productsCSV);


      this.messageService.add({
        severity: 'success',
        summary: 'Import réussi',
        detail: 'Le fichier a été importé avec succès'
      });

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


  async importExcelFiles() {
    if (this.excelFiles.some((f) => !f)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichiers manquants',
        detail: 'Veuillez sélectionner les 3 fichiers requis'
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

      this.result = await this.importFileService.importData(backendDatas);

      this.messageService.add({
        severity: 'success',
        summary: 'Import réussi',
        detail: 'Les fichiers ont été traités'
      });

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
    this.result = '';
  }

  async onLogout() {
    // Clear session data
    this.sessionService.clear();

    // Optionally, navigate to the login page
    await this.router.navigate(['/login']);
  }
}
