import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportFileService } from '../../services/service/import/import.service';


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
  excelFiles: Array<File | null> = [null, null, null];
  backFile: File | null = null;

  result: string = '';


  private importService: ImportFileService = inject(ImportFileService);
  private messageService: MessageService = inject(MessageService);

  constructor(
  ) {}

  get isExcelImportDisabled(): boolean {
    return this.excelFiles.some((file) => !file) || this.isLoading;
  }

  onExcelFileChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.excelFiles[index] = file;
  }

  onBackFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.backFile = input.files?.[0] ?? null;
  }

  async importExcelFiles() {

    this.isLoading = true;

    try {
      const selectedFiles = this.excelFiles.filter((file): file is File => file !== null);
      const results = await this.importService.transformCSVToJSON(selectedFiles);
      const backendPayload = this.importService.formatForBackend(results);
      const response = await this.importService.importFichierCSV(backendPayload);

      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: `Import Excel terminé`
      });

      this.result = JSON.stringify(response.data);

      this.excelFiles = [null, null, null];

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
      const payload = await this.importService.formatKeyValueCsvFileToBackendPayload(this.backFile);

      const response = await this.importService.importFichierCSV(payload);

      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Import back terminé'
      });

      this.result = JSON.stringify(response.data);

      this.backFile = null;
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
    this.excelFiles = [null, null, null];
    this.backFile = null;
    this.result = '';
  }
}
