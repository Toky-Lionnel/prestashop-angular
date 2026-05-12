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


