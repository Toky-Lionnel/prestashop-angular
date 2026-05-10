export interface PrestashopCustomer {
  id?: number | null;
  id_default_group: number;
  firstname: string;
  lastname: string;
  email: string;
  passwd: string;
  active: number;
  address: string;
  line_number: number;
}

export interface CustomerTransformOptions {
  id_default_group?: number;
  active?: number;
}

const DEFAULT_CUSTOMER_OPTIONS: Required<CustomerTransformOptions> = {
  id_default_group: 3,
  active: 1
};

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

export function buildCustomerXML(data: PrestashopCustomer): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <customer>
        <id_default_group><![CDATA[${escapeCDATA(data.id_default_group)}]]></id_default_group>
        <firstname><![CDATA[${escapeCDATA(data.firstname)}]]></firstname>
        <lastname><![CDATA[${escapeCDATA(data.lastname)}]]></lastname>
        <email><![CDATA[${escapeCDATA(data.email)}]]></email>
        <passwd><![CDATA[${escapeCDATA(data.passwd)}]]></passwd>
        <active><![CDATA[${escapeCDATA(data.active)}]]></active>
    </customer>
</prestashop>`;
}

const toNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULT_PASSWD_HASH = '202cb962ac59075b964b07152d234b70';

export function transformParsedCustomerToModel(row: any, options: Partial<CustomerTransformOptions> = {}): PrestashopCustomer {
  const idDefaultGroup = options.id_default_group ?? DEFAULT_CUSTOMER_OPTIONS.id_default_group;
  const active = options.active ?? DEFAULT_CUSTOMER_OPTIONS.active;

  return {
    id: row.id ? toNumber(row.id, 0) : null,
    id_default_group: idDefaultGroup,
    firstname: (row.prenom || row.firstname || '').trim(),
    lastname: (row.nom || row.lastname || '').trim(),
    email: (row.email || '').trim(),
    passwd: (row.passwd || DEFAULT_PASSWD_HASH),
    active,
    address: row.adresse || row.address || '',
    line_number: toNumber(row.line_number ?? row.line ?? row.lineNumber, 0)
  };
}

export function transformParsedCustomersToModels(rows: any[], options: Partial<CustomerTransformOptions> = {}): PrestashopCustomer[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => transformParsedCustomerToModel(r, options));
}


export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


export function isNameValid(name: string): boolean {
  if (typeof name !== 'string') return false;

  const trimmedName = name.trim();

  // Regex : lettres (accentuées incluses), espaces, tirets et apostrophes
  // Ajustez selon vos besoins (ex: supprimer tirets/apostrophes si non autorisés)
  const namePattern = /^[A-Za-zÀ-ÿ\s\-']+$/;
  return namePattern.test(trimmedName);
}

