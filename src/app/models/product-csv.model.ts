import { createEmptyValidationResult, ImportValidationResult, FieldValidationError } from './validation.model';

export interface ProductCsvModel {
  date_availability_produit: string;
  nom: string;
  reference: string;
  prix_ttc: number;
  taxe: number;
  categorie: string;
  prix_achat: number;
  line_number?: number;
}

const toNumber = (value: unknown, fallback: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalizedValue = String(value).trim().replace(',', '.');
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function extractPercentage(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalizedValue = String(value)
    .trim()
    .replace('%', '')
    .replace(',', '.');

  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function transformProductCsvRowToModel(row: any): ProductCsvModel {
  return {
    date_availability_produit: row['date_availability_produit']?.trim() || '',
    nom: row['nom']?.trim() || '',
    reference: row['reference']?.trim() || '',
    prix_ttc: toNumber(row['prix_ttc'], 0),
    taxe: extractPercentage(row['taxe'], 0),
    categorie: row['categorie']?.trim() || '',
    prix_achat: toNumber(row['prix_achat'], 0),
  };
}


export function transformProductCsvRowsToModel(rows: any[]): ProductCsvModel[] {
  return rows.map(transformProductCsvRowToModel);
}


export function validateProductCsvRows(rows: any[]): ImportValidationResult<ProductCsvModel> {
  const expectedKeys = ['date_availability_produit', 'nom', 'reference', 'prix_ttc', 'taxe', 'categorie', 'prix_achat', 'line_number'];
  const result = createEmptyValidationResult<ProductCsvModel>();

  for (const rawRow of rows) {
    const errors: FieldValidationError[] = [];
    for (const key of expectedKeys) {
      if (!(key in rawRow)) {
        errors.push({ field: key, code: 'required', message: `Nom de colonne non conforme: ${key}` });
      }
    }

    const dateValue = (rawRow['date_availability_produit'] || '').trim();
    if (dateValue) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dateValue)) {
        errors.push({ field: 'date_availability_produit', code: 'format', message: 'format de date différente de DD/MM/YYYY' });
      }
    }

    const prixTtc = toNumber(rawRow['prix_ttc'], NaN);
    const prixAchat = toNumber(rawRow['prix_achat'], NaN);
    if (isNaN(prixTtc) || prixTtc < 0) {
      errors.push({ field: 'prix_ttc', code: 'invalid_value', message: 'montant non valide ou négatif pour prix_ttc' });
    }
    if (isNaN(prixAchat) || prixAchat < 0) {
      errors.push({ field: 'prix_achat', code: 'invalid_value', message: 'montant non valide ou négatif pour prix_achat' });
    }

    const model = transformProductCsvRowToModel(rawRow);
    if (errors.length > 0) {
      result.invalidData.push({ lineNumber: model.line_number ?? 0, data: model, errors });
    } else {
      result.validData.push(model);
    }
  }

  result.summary.total = rows.length;
  result.summary.valid = result.validData.length;
  result.summary.invalid = result.invalidData.length;

  return result;
}


