export interface PrestashopLanguageEntry {
  id: number;
  value: string;
}

export interface PrestashopLocalizedField {
  language: PrestashopLanguageEntry[];
}

export interface PrestashopProductOptionValue {
  id?: number |null;
}

export interface PrestashopProductOptionValueAssociation {
  product_option_value: PrestashopProductOptionValue[];
}

export interface PrestashopCombinationAssociations {
  product_option_values: PrestashopProductOptionValueAssociation;
}

export interface PrestashopCombination {
  id?: number | null;
  id_product: number;
  reference: string;
  wholesale_price: number;
  price: number;
  weight?: number;
  minimal_quantity: number;
  default_on: number;
  associations: PrestashopCombinationAssociations;
  line_number?: number;
}

export interface PrestashopProductOption {
  id?: number | null;
  group_type: string;
  name: PrestashopLocalizedField;
  public_name: PrestashopLocalizedField;
  line_number?: number;
}

export interface PrestashopProductOptionValue {
  id?: number | null;
  id_attribute_group: number;
  color?: string;
  position: number;
  name: PrestashopLocalizedField;
  line_number?: number;
}

export interface CombinationTransformOptions {
  id_product?: number;
  minimal_quantity?: number;
  default_on?: number;
  weight?: number;
}

const DEFAULT_COMBINATION_OPTIONS: Required<CombinationTransformOptions> = {
  id_product: 0,
  minimal_quantity: 1,
  default_on: 0,
  weight: 0
};

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

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

const buildLocalizedFieldXML = (fieldName: string, field: PrestashopLocalizedField, format: string = 'isGenericName'): string => {
  const languages = field.language
    .map(
      (language) =>
        `<language id="${escapeCDATA(language.id)}">
      <![CDATA[${escapeCDATA(language.value)}]]>
      </language>`
    )
    .join('\n');

  return `<${fieldName}>\n${languages}\n    </${fieldName}>`;
};



/**
 * Constructs XML representation of a PrestashopCombination object
 * @param data - The combination object to convert
 * @returns XML string representation
 */
export function buildCombinationXML(data: PrestashopCombination): string {
  const productOptionValues = data.associations.product_option_values.product_option_value
    .map((pov) => `        <product_option_value>\n <id>${escapeCDATA(Number(pov.id))}</id>\n        </product_option_value>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
    <id_product><![CDATA[${escapeCDATA(data.id_product)}]]></id_product>
    <reference><![CDATA[${escapeCDATA(data.reference)}]]></reference>
    <wholesale_price><![CDATA[${escapeCDATA(formatDecimal(data.wholesale_price))}]]></wholesale_price>
    <price><![CDATA[${escapeCDATA(formatDecimal(data.price))}]]></price>
${data.weight !== undefined ? `    <weight><![CDATA[${escapeCDATA(formatDecimal(data.weight))}]]></weight>` : ''}
    <minimal_quantity><![CDATA[${escapeCDATA(data.minimal_quantity)}]]></minimal_quantity>
    <default_on><![CDATA[${escapeCDATA(data.default_on)}]]></default_on>
    <associations>
      <product_option_values>
${productOptionValues}
      </product_option_values>
    </associations>
  </combination>
</prestashop>`;
}

/**
 * Constructs XML representation of a PrestashopProductOption object
 * @param data - The product option object to convert
 * @returns XML string representation
 */
export function buildProductOptionXML(data: PrestashopProductOption): string {
  const nameXML = buildLocalizedFieldXML('name', data.name);
  const publicNameXML = buildLocalizedFieldXML('public_name', data.public_name);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <product_option>
        <group_type required="true">
            <![CDATA[${escapeCDATA(data.group_type)}]]>
        </group_type>
${nameXML}
${publicNameXML}
    </product_option>
</prestashop>`;
}

/**
 * Constructs XML representation of a PrestashopProductOptionValue object
 * @param data - The product option value object to convert
 * @returns XML string representation
 */
export function buildProductOptionValueXML(data: PrestashopProductOptionValue): string {
  const nameXML = buildLocalizedFieldXML('name', data.name);

  const colorTag = data.color ? `    <color><![CDATA[${escapeCDATA(data.color)}]]></color>\n` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option_value>
    <id_attribute_group><![CDATA[${escapeCDATA(data.id_attribute_group)}]]></id_attribute_group>
${colorTag}    <position><![CDATA[${escapeCDATA(data.position)}]]></position>
${nameXML}
  </product_option_value>
</prestashop>`;
}
