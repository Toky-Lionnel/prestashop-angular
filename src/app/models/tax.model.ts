export interface PrestashopLanguageEntry {
  id: number;
  value: string;
}

export interface PrestashopLocalizedField {
  language: PrestashopLanguageEntry[];
}

export interface PrestashopTax {
  id?: number | null;
  rate: number;
  active: number;
  name: PrestashopLocalizedField;
}

export interface PrestashopTaxRule {
  id?: number | null;
  id_tax_rules_group: number;
  id_country: number;
  id_tax: number;
}

export interface PrestashopTaxRuleGroup {
  id?: number | null;
  name: string;
  active: number;
}

export interface TaxTransformOptions {
  active?: number;
  languageId?: number;
}

const DEFAULT_TAX_OPTIONS: Required<TaxTransformOptions> = {
  active: 1,
  languageId: 1
};

const DEFAULT_TAX_RULE_GROUP_OPTIONS = {
  active: 1
};

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const buildLocalizedFieldXML = (fieldName: string, field: PrestashopLocalizedField): string => {
  const languages = field.language
    .map(
      (language) =>
        `        <language id="${escapeCDATA(language.id)}" xlink:href="http://localhost/EVALUATION/prestashop/api/languages/${escapeCDATA(language.id)}" format="isUnsignedId"><![CDATA[${escapeCDATA(language.value)}]]></language>`
    )
    .join('\n');

  return `    <${fieldName}>\n${languages}\n    </${fieldName}>`;
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildLocalizedField = (value: string, languageId: number = DEFAULT_TAX_OPTIONS.languageId): PrestashopLocalizedField => ({
  language: [
    {
      id: languageId,
      value
    }
  ]
});

/**
 * Constructs XML representation of a PrestashopTax object
 * @param data - The tax object to convert
 * @returns XML string representation
 */
export function buildTaxXML(data: PrestashopTax): string {
  const nameXML = buildLocalizedFieldXML('name', data.name);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <tax>
        <rate required="true" format="isFloat">
            <![CDATA[${escapeCDATA(data.rate)}]]>
        </rate>
        <active>
            <![CDATA[${escapeCDATA(data.active)}]]>
        </active>
${nameXML}
    </tax>
</prestashop>`;
}

/**
 * Constructs XML representation of a PrestashopTaxRule object
 * @param data - The tax rule object to convert
 * @returns XML string representation
 */
export function buildTaxRuleXML(data: PrestashopTaxRule): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <tax_rule>
        <id_tax_rules_group required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_tax_rules_group)}]]>
        </id_tax_rules_group>
        <id_country required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_country)}]]>
        </id_country>
        <id_tax required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_tax)}]]>
        </id_tax>
    </tax_rule>
</prestashop>`;
}

/**
 * Constructs XML representation of a PrestashopTaxRuleGroup object
 * @param data - The tax rule group object to convert
 * @returns XML string representation
 */
export function buildTaxRuleGroupXML(data: PrestashopTaxRuleGroup): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <tax_rule_group>
        <name required="true" maxSize="64" format="isGenericName">
            <![CDATA[${escapeCDATA(data.name)}]]>
        </name>
        <active format="isBool">
            <![CDATA[${escapeCDATA(data.active)}]]>
        </active>
    </tax_rule_group>
</prestashop>`;
}

/**
 * Transforms a tax row from import to PrestashopTax model
 * @param row - The row data containing tax information
 * @param options - Optional configuration for the transformation
 * @returns PrestashopTax model
 */
export function transformTaxRowToModel(row: any, options: Partial<TaxTransformOptions> = {}): PrestashopTax {
  const active = options.active ?? DEFAULT_TAX_OPTIONS.active;
  const languageId = options.languageId ?? DEFAULT_TAX_OPTIONS.languageId;
  const rate = toNumber(row.rate, 0);
  const name = row.name?.trim() || 'Taxe sans nom';

  return {
    id: null,
    rate,
    active,
    name: buildLocalizedField(name, languageId)
  };
}

/**
 * Transforms a tax rule row from import to PrestashopTaxRule model
 * @param row - The row data containing tax rule information
 * @returns PrestashopTaxRule model
 */
export function transformTaxRuleRowToModel(row: any): PrestashopTaxRule {
  const idTaxRulesGroup = toNumber(row.id_tax_rules_group, 0);
  const idCountry = toNumber(row.id_country, 0);
  const idTax = toNumber(row.id_tax, 0);

  return {
    id: null,
    id_tax_rules_group: idTaxRulesGroup,
    id_country: idCountry,
    id_tax: idTax
  };
}

/**
 * Transforms a tax rule group row from import to PrestashopTaxRuleGroup model
 * @param row - The row data containing tax rule group information
 * @param options - Optional configuration for the transformation
 * @returns PrestashopTaxRuleGroup model
 */
export function transformTaxRuleGroupRowToModel(row: any, options: Partial<TaxTransformOptions> = {}): PrestashopTaxRuleGroup {
  const active = options.active ?? DEFAULT_TAX_RULE_GROUP_OPTIONS.active;
  const name = row.name?.trim() || 'Groupe sans nom';

  return {
    id: null,
    name,
    active
  };
}

/**
 * Transforms multiple tax rows from import
 * @param rows - Array of tax rows
 * @param options - Optional configuration for the transformation
 * @returns Array of PrestashopTax models
 */
export function transformTaxRowsToModel(rows: any[], options: Partial<TaxTransformOptions> = {}): PrestashopTax[] {
  return rows.map(row => transformTaxRowToModel(row, options));
}

/**
 * Transforms multiple tax rule rows from import
 * @param rows - Array of tax rule rows
 * @returns Array of PrestashopTaxRule models
 */
export function transformTaxRuleRowsToModel(rows: any[]): PrestashopTaxRule[] {
  return rows.map(row => transformTaxRuleRowToModel(row));
}

/**
 * Transforms multiple tax rule group rows from import
 * @param rows - Array of tax rule group rows
 * @param options - Optional configuration for the transformation
 * @returns Array of PrestashopTaxRuleGroup models
 */
export function transformTaxRuleGroupRowsToModel(rows: any[], options: Partial<TaxTransformOptions> = {}): PrestashopTaxRuleGroup[] {
  return rows.map(row => transformTaxRuleGroupRowToModel(row, options));
}
