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
