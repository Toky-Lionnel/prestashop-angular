export interface PrestashopLanguageEntry {
  id: number;
  value: string;
}

export interface PrestashopLocalizedField {
  language: PrestashopLanguageEntry[];
}

export interface PrestashopCategoryLink {
  id: number | 2;
}

export interface PrestashopProductCategoryAssociation {
  category: PrestashopCategoryLink[];
}

export interface PrestashopProductAssociations {
  categories: PrestashopProductCategoryAssociation;
}

export interface PrestashopProduct {
  id : number | null;
  id_category_default: number;
  id_tax_rules_group: number;
  id_shop_default: number;
  state: number;
  active: number;
  available_for_order: number;
  show_price: number;
  visibility: string;
  type: string;
  product_type: string;
  condition: string;
  minimal_quantity: number;
  redirect_type: string;
  price: number;
  quantity: number;
  line_number : number;
  date_availability?: string;
  reference?: string;
  wholesale_price?: number;
  name: PrestashopLocalizedField;
  link_rewrite: PrestashopLocalizedField;
  associations: PrestashopProductAssociations;
}

const DEFAULT_LANGUAGE_ID = 1;
const DEFAULT_CATEGORY_ID = 2;

const toNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSlug = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const buildLocalizedField = (value: string, languageId: number = DEFAULT_LANGUAGE_ID): PrestashopLocalizedField => ({
  language: [
    {
      id: languageId,
      value
    }
  ]
});

export function transformProductRowToModel(row: any): PrestashopProduct {
  const name = row.name?.trim() || 'Produit sans nom';
  const price = toNumber(row.price, 0);
  const quantity = toNumber(row.quantity, 1);
  const lineNumber = toNumber(row.line_number, 1);

  return {
    id: null,
    id_category_default: DEFAULT_CATEGORY_ID,
    id_tax_rules_group: 0,
    id_shop_default: 1,
    state: 1,
    active: 1,
    available_for_order: 1,
    show_price: 1,
    visibility: 'both',
    type: 'standard',
    product_type: 'standard',
    condition: 'new',
    minimal_quantity: 1,
    redirect_type: '404',
    price,
    quantity,
    line_number: lineNumber,
    name: buildLocalizedField(name),
    link_rewrite: buildLocalizedField(toSlug(name) || 'produit-sans-nom'),
    associations: {
      categories: {
        category: [
          {
            id: DEFAULT_CATEGORY_ID
          }
        ]
      }
    }
  };
}

export function transformProductRowsToModel(rows: any[]): PrestashopProduct[] {
  return rows.map((row) => transformProductRowToModel(row));
}

const escapeCDATA = (value: string | number) => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const buildLocalizedFieldXML = (fieldName: string, field: PrestashopLocalizedField): string => {
  const languages = field.language
    .map(
      (language) =>
        `    <language id="${escapeCDATA(language.id)}"><![CDATA[${escapeCDATA(language.value)}]]></language>`
    )
    .join('\n');

  return `<${fieldName}>\n ${languages} \n  </${fieldName}>`;
};

export function buildProductXML(data: PrestashopProduct): string {
  const categories = data.associations.categories.category
    .map((category) => `          <id><![CDATA[${escapeCDATA(category.id)}]]></id>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id_category_default><![CDATA[${escapeCDATA(data.id_category_default)}]]></id_category_default>
    <id_tax_rules_group><![CDATA[${escapeCDATA(data.id_tax_rules_group)}]]></id_tax_rules_group>
    <id_shop_default><![CDATA[${escapeCDATA(data.id_shop_default)}]]></id_shop_default>

    <state><![CDATA[${escapeCDATA(data.state)}]]></state>
    <active><![CDATA[${escapeCDATA(data.active)}]]></active>
    <available_for_order><![CDATA[${escapeCDATA(data.available_for_order)}]]></available_for_order>
    <show_price><![CDATA[${escapeCDATA(data.show_price)}]]></show_price>
    <visibility><![CDATA[${escapeCDATA(data.visibility)}]]></visibility>

    <type><![CDATA[${escapeCDATA(data.type)}]]></type>
    <product_type><![CDATA[${escapeCDATA(data.product_type)}]]></product_type>
    <condition><![CDATA[${escapeCDATA(data.condition)}]]></condition>
    <minimal_quantity><![CDATA[${escapeCDATA(data.minimal_quantity)}]]></minimal_quantity>
    <redirect_type><![CDATA[${escapeCDATA(data.redirect_type)}]]></redirect_type>

    <price><![CDATA[${escapeCDATA(data.price)}]]></price>
    <wholesale_price><![CDATA[${escapeCDATA(data.wholesale_price ?? 0)}]]></wholesale_price>

    <date_availability><![CDATA[${escapeCDATA(data.date_availability ?? '')}]]></date_availability>
    <reference><![CDATA[${escapeCDATA(data.reference ?? '')}]]></reference>

${buildLocalizedFieldXML('name', data.name)}

${buildLocalizedFieldXML('link_rewrite', data.link_rewrite)}

    <associations>
      <categories>
        <category>
${categories}
        </category>
      </categories>
    </associations>
  </product>
</prestashop>`;
}

