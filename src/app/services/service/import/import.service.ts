import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';

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

  private authInterceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  constructor() { }

  async importFichierCSV(data: any): Promise<any> {
    const api = this.authInterceptor.getApi();
    const response = await api.post('/import', data);
    return response;
  }

  /**
   * Transforme un CSV plat key,value en payload backend:
   * [ { table_name: 'CUSTOMER', data: {...} }, ... ]
   */
  async formatKeyValueCsvFileToBackendPayload(file: File): Promise<BackendImportPayload[]> {
    const csv = await file.text();
    return this.formatKeyValueCsvContentToBackendPayload(csv, file);
  }

  /**
   * Transforme le contenu CSV key,value en format backend attendu.
   */
  formatKeyValueCsvContentToBackendPayload(csv: string, file: File): BackendImportPayload[] {
    const lines = this.parseCSVLines(csv);

    if (lines.length <= 1) {
      return [];
    }

    const customerData: CSVRow = {};
    const budgetRecords = new Map<number, CSVRow>();
    const expenseRecords = new Map<number, CSVRow>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];

      if (row.length < 2) {
        continue;
      }

      const key = (row[0] ?? '').trim();
      const rawValue = (row[1] ?? '').trim();

      if (!key) {
        continue;
      }

      const value = this.transformValue(rawValue);
      this.assignKeyValueRecord(key, value, customerData, budgetRecords, expenseRecords);
    }

    return [
      {
        file_name: file.name,
        table_name: 'CUSTOMER',
        data: customerData
      },
      {
        file_name: file.name,
        table_name: 'BUDGET',
        data: Array.from(budgetRecords.entries())
          .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
          .map(([, record]) => record)
      },
      {
        file_name: file.name,
        table_name: 'EXPENSE',
        data: Array.from(expenseRecords.entries())
          .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
          .map(([, record]) => record)
      }
    ];
  }


  /**
   * Transforme les fichiers CSV en JSON
   * Gère les virgules dans les valeurs en les remplaçant par des points pour les nombres
   */
  async transformCSVToJSON(files: File[]): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const file of files) {
      const result = await this.parseCSVFile(file);
      results.push(result);
    }

    return results;
  }

  /**
   * Formate les résultats CSV pour le backend au format attendu:
   * [ { table_name: "CUSTOMER", data: {...} }, ... ]
   */
  formatForBackend(results: ImportResult[]): BackendImportPayload[] {
    return results.map((result) => ({
      file_name : result.filename,
      table_name: this.detectTableName(result.headers),
      data: result.data.length === 1 ? result.data[0] : result.data
    }));
  }

  /**
   * Parse un fichier CSV unique et retourne les données transformées en JSON
   */
  private parseCSVFile(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const csv = e.target.result;
          const lines = this.parseCSVLines(csv);

          if (lines.length === 0) {
            reject(new Error(`Le fichier ${file.name} est vide`));
            return;
          }

          // La première ligne contient les en-têtes
          const headers = lines[0];
          const data: CSVRow[] = [];

          // Traiter chaque ligne de données
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i];

            // Ignorer les lignes vides
            if (row.length === 0 || row.every(cell => cell === '')) {
              continue;
            }

            const jsonRow: CSVRow = {};

            for (let j = 0; j < headers.length; j++) {
              const header = headers[j].trim().toLowerCase();
              const value = row[j] ? row[j].trim() : '';

              // Déterminer le type et transformer la valeur
              jsonRow[header] = this.transformValue(value);
              jsonRow['num_ligne'] = i; // Ajouter le numéro de ligne pour référence
            }

            data.push(jsonRow);
          }

          const result: ImportResult = {
            filename: file.name,
            headers: headers,
            data: data,
            rowCount: data.length,
            columnCount: headers.length
          };

          resolve(result);
        } catch (error) {
          reject(new Error(`Erreur lors du traitement du fichier ${file.name}: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error(`Impossible de lire le fichier ${file.name}`));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parse les lignes du CSV en tenant compte des guillemets
   * Gère les valeurs entre guillemets qui peuvent contenir des virgules et des sauts de ligne
   */
  private parseCSVLines(csv: string): string[][] {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Guillemets échappés ("") -> ajouter un guillemet
          currentCell += '"';
          i++; // Sauter le prochain guillemet
        } else {
          // Basculer l'état des guillemets
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Fin de cellule
        currentLine.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        // Fin de ligne
        if (char === '\r' && nextChar === '\n') {
          i++; // Sauter le \n qui suit \r
        }
        if (currentCell || currentLine.length > 0) {
          currentLine.push(currentCell);
          lines.push(currentLine);
          currentLine = [];
          currentCell = '';
        }
      } else {
        currentCell += char;
      }
    }

    // Ajouter la dernière cellule et ligne si elle existe
    if (currentCell || currentLine.length > 0) {
      currentLine.push(currentCell);
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Transforme une valeur en détectant son type
   * - Si c'est un nombre: remplace les virgules par des points
   * - Si c'est du texte avec virgules: conserve les virgules
   * - Si c'est un booléen ou null: transforme correctement
   */
  private transformValue(value: string): any {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Vérifier si c'est un booléen
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return true;
    if (lowerValue === 'false') return false;
    if (lowerValue === 'null' || lowerValue === 'nil') return null;

    // Vérifier si c'est un nombre
    // Accepte les formats: "123", "123.45", "123,45", "-123", "-123,45", etc.
    const numberPattern = /^-?\d+([.,]\d+)?$/;

    if (numberPattern.test(value)) {
      // C'est un nombre: remplacer les virgules par des points
      const normalizedValue = value.replace(',', '.');
      const number = parseFloat(normalizedValue);

      if (!isNaN(number)) {
        return number;
      }
    }

    // Sinon c'est du texte, le retourner tel quel
    // (les virgules sont conservées)
    return value;
  }

  private detectTableName(headers: string[]): string {
    const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
    const hasHeaders = (expectedHeaders: string[]) =>
      expectedHeaders.every((header) => normalizedHeaders.includes(header));

    if (hasHeaders(['customer_email', 'customer_name'])) {
      return 'CUSTOMER';
    }

    if (hasHeaders(['customer_email', 'subject_or_name', 'type', 'status', 'expense'])) {
      return 'EXPENSE';
    }

    if (hasHeaders(['customer_email', 'budget'])) {
      return 'BUDGET';
    }

    return 'EXPENSE';
  }

  private assignKeyValueRecord(
    key: string,
    value: any,
    customerData: CSVRow,
    budgetRecords: Map<number, CSVRow>,
    expenseRecords: Map<number, CSVRow>
  ): void {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey.startsWith('customer.')) {
      const fieldName = key.slice('customer.'.length).toLowerCase();
      customerData[fieldName] = value;
      return;
    }

    const budgetMatch = normalizedKey.match(/^budgets\[(\d+)\]\.(.+)$/);
    if (budgetMatch) {
      const recordIndex = Number(budgetMatch[1]);
      const fieldName = this.normalizeBudgetFieldName(budgetMatch[2]).toLowerCase();
      const budgetRecord = budgetRecords.get(recordIndex) ?? {};
      budgetRecord[fieldName] = value;
      budgetRecords.set(recordIndex, budgetRecord);
      return;
    }

    const expenseMatch = normalizedKey.match(/^expenses\[(\d+)\]\.(.+)$/);
    if (expenseMatch) {
      const recordIndex = Number(expenseMatch[1]);
      const fieldName = expenseMatch[2].toLowerCase();
      const expenseRecord = expenseRecords.get(recordIndex) ?? {};
      expenseRecord[fieldName] = value;
      expenseRecords.set(recordIndex, expenseRecord);
    }
  }

  private normalizeBudgetFieldName(fieldName: string): string {
    return fieldName.toLowerCase() === 'budget' ? 'Budget' : fieldName;
  }

}
