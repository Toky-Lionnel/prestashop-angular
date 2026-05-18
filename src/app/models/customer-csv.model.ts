export interface CustomerCsvModel {
  date: string;
  nom: string;
  email: string;
  pwd: string;
  adresse: string;
  achat: string;
  etat: string;
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

export function transformCustomerCsvRowToModel(row: any): CustomerCsvModel {
  return {
    date: row['date']?.trim() || '',
    nom: row['nom']?.trim() || '',
    email: row['email']?.trim() || '',
    pwd: row['pwd']?.trim() || '',
    adresse: row['adresse']?.trim() || '',
    achat: row['achat']?.trim() || '',
    etat: row['etat']?.trim() || '',
    line_number: toNumber(row['line_number'], 1)
  };
}

export function transformCustomerCsvRowsToModel(rows: any[]): CustomerCsvModel[] {
  return rows.map(transformCustomerCsvRowToModel);
}


import { createEmptyValidationResult, ImportValidationResult, FieldValidationError } from './validation.model';

export function validateCustomerCsvRows(rows: any[]): ImportValidationResult<CustomerCsvModel> {
  const expectedKeys = ['date', 'nom', 'email', 'pwd', 'adresse', 'achat', 'etat'];
  const result = createEmptyValidationResult<CustomerCsvModel>();

  for (const rawRow of rows) {
    const errors: FieldValidationError[] = [];
    for (const key of expectedKeys) {
      if (!(key in rawRow)) {
        errors.push({ field: key, code: 'required', message: `Nom de colonne non conforme: ${key}`, invalidValue: rawRow[key] });
      }
    }

    const dateValue = (rawRow['date'] || '').trim();
    if (dateValue) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dateValue)) {
        errors.push({ field: 'date', code: 'format', message: 'format de date différente de DD/MM/YYYY pour date', invalidValue: rawRow['date'] });
      }
    }

    const achatNum = toNumber(rawRow['achat'], NaN);
    if (!isNaN(achatNum) && achatNum < 0) {
      errors.push({ field: 'achat', code: 'invalid_value', message: 'montant négatif pour achat', invalidValue: rawRow['achat'] });
    }

    const model = transformCustomerCsvRowToModel(rawRow);
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

const normalizeValue = (value: string | undefined): string => {
  return (value || '').trim().toLowerCase();
};

/**
 * Returns unique customer CSV rows by business fields.
 * Duplicate detection based on email only.
 */
export function uniqueCustomerCsvRows(rows: CustomerCsvModel[]): CustomerCsvModel[] {
  const seen = new Set<string>();
  const uniqueRows: CustomerCsvModel[] = [];

  for (const row of rows) {
    const emailKey = normalizeValue(row.email);

    if (seen.has(emailKey)) {
      continue;
    }

    seen.add(emailKey);
    uniqueRows.push(row);
  }

  return uniqueRows;
}
