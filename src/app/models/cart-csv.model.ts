import { CustomerCsvModel } from './customer-csv.model';

export interface CartCsvModel {
  date: string;
  nom: string;
  email: string;
  pwd: string;
  adresse: string;
  achat: string;
  etat: string;
  line_number?: number;
  reference: string;
  qte: number;
  attribute: string;
  achat_group_key: string;
  achat_group_id: number;
}

interface ParsedAchatItem {
  reference: string;
  qte: number;
  attribute: string;
}

const normalizeValue = (value: string | undefined): string => {
  return (value || '').trim().toLowerCase();
};

const toNumber = (value: unknown, fallback: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalizedValue = String(value).trim().replace(',', '.');
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildAchatGroupKey = (customer: CustomerCsvModel): string => {
  return [
    normalizeValue(customer.achat),
    normalizeValue(customer.email),
    normalizeValue(customer.date)
  ].join('|');
};

/**
 * Parse achat string like:
 * [("T_01";2;"kely"),("C_03";1;"")]
 */
export function parseAchatField(achat: string): ParsedAchatItem[] {
  if (!achat || !achat.trim()) return [];

  const items: ParsedAchatItem[] = [];
  const regex = /\(\s*["']([^"']*)["']\s*;\s*([0-9]+(?:[.,][0-9]+)?)\s*;\s*["']([^"']*)["']\s*\)/g;

  let match: RegExpExecArray | null = regex.exec(achat);
  while (match) {
    items.push({
      reference: (match[1] || '').trim(),
      qte: toNumber(match[2], 0),
      attribute: (match[3] || '').trim()
    });
    match = regex.exec(achat);
  }

  return items;
}

/**
 * Transform one customer CSV row to cart CSV rows (one row per achat item).
 */
export function transformCustomerCsvToCartCsvRows(
  customer: CustomerCsvModel,
  achatGroupId: number
): CartCsvModel[] {
  const parsedItems = parseAchatField(customer.achat);
  const groupKey = buildAchatGroupKey(customer);

  return parsedItems.map((item) => ({
    date: customer.date,
    nom: customer.nom,
    email: customer.email,
    pwd: customer.pwd,
    adresse: customer.adresse,
    achat: customer.achat,
    etat: customer.etat,
    line_number: customer.line_number,
    reference: item.reference,
    qte: item.qte,
    attribute: item.attribute,
    achat_group_key: groupKey,
    achat_group_id: achatGroupId
  }));
}

/**
 * Transform customer CSV rows to cart CSV rows.
 * Adds achat_group_id so equal purchases can be grouped easily.
 */
export function transformCustomersCsvToCartCsvRows(customers: CustomerCsvModel[]): CartCsvModel[] {
  const rows: CartCsvModel[] = [];
  const groupIdByKey = new Map<string, number>();
  let nextGroupId = 1;

  for (const customer of customers) {
    const groupKey = buildAchatGroupKey(customer);
    let groupId = groupIdByKey.get(groupKey);

    if (!groupId) {
      groupId = nextGroupId;
      nextGroupId += 1;
      groupIdByKey.set(groupKey, groupId);
    }

    rows.push(...transformCustomerCsvToCartCsvRows(customer, groupId));
  }

  return rows;
}
