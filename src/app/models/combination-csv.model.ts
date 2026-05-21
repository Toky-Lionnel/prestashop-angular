export interface CombinationCsvModel {
  reference: string;
  specificite: string;
  karazany: string;
  stock_initial: number;
  prix_vente_ttc: number;
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

const formatDecimal = (value: number, decimals: number = 3): string => {
  return value.toFixed(decimals);
};


export function transformCombinationCsvRowToModel(row: any): CombinationCsvModel {
  return {
    reference: row['reference']?.trim() || '',
    specificite: row['specificité']?.trim() || '',
    karazany: row['karazany']?.trim() || '',
    stock_initial: toNumber(row['stock_initial'], 0),
    prix_vente_ttc: toNumber(row['prix_vente_ttc'], 0),
    line_number: toNumber(row['line_number'], 1)
  };
}


export function transformCombinationCsvRowsToModel(rows: any[]): CombinationCsvModel[] {
  return rows.map(transformCombinationCsvRowToModel);
}


export function formatCombinationPrice(price: number): string {
  return formatDecimal(price, 3);
}


export function validateCombinationCsvModel(model: CombinationCsvModel): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!model.reference || model.reference.trim() === '') {
    errors.push('Référence est requise');
  }

  if (model.stock_initial < 0) {
    errors.push('Stock initial ne peut pas être négatif');
  }

  if (model.prix_vente_ttc < 0) {
    errors.push('Prix de vente TTC ne peut pas être négatif');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


import { createEmptyValidationResult, ImportValidationResult, FieldValidationError } from './validation.model';

export function validateCombinationCsvRows(rows: any[]): ImportValidationResult<CombinationCsvModel> {
  const expectedKeys = ['reference', 'specificité', 'karazany', 'stock_initial', 'prix_vente_ttc'];
  const result = createEmptyValidationResult<CombinationCsvModel>();

  for (const rawRow of rows) {
    const errors: FieldValidationError[] = [];
    for (const key of expectedKeys) {
      if (!(key in rawRow)) {
        errors.push({ field: key, code: 'required', message: `Nom de colonne non conforme: ${key}`, invalidValue: rawRow[key] });
      }
    }

    const model = transformCombinationCsvRowToModel(rawRow);
    const check = validateCombinationCsvModel(model);
    if (!check.isValid) {
      check.errors.forEach(e => errors.push({ field: 'row', code: 'invalid_value', message: e, invalidValue: rawRow }));
    }

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
