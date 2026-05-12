export interface PrestashopLanguageEntry {
  id: number;
  value: string;
}

export interface PrestashopLocalizedField {
  language: PrestashopLanguageEntry[];
}

export interface PrestashopCategory {
  id?: number | null;
  id_parent: number;
  active: number;
  name: PrestashopLocalizedField;
  link_rewrite: PrestashopLocalizedField;
  description: PrestashopLocalizedField;
  line_number?: number;
}

export interface CategoryTransformOptions {
  id_parent?: number;
  active?: number;
  languageId?: number;
}

const DEFAULT_CATEGORY_OPTIONS: Required<CategoryTransformOptions> = {
  id_parent: 2,
  active: 1,
  languageId: 1
};

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const toSlug = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const buildLocalizedField = (value: string, languageId: number = DEFAULT_CATEGORY_OPTIONS.languageId): PrestashopLocalizedField => ({
  language: [
    {
      id: languageId,
      value
    }
  ]
});

const buildLocalizedFieldXML = (fieldName: string, field: PrestashopLocalizedField, withCDATA: boolean = false): string => {
  const languages = field.language
    .map(
      (language) => {
        if (withCDATA) {
          return `<language id="${escapeCDATA(language.id)}"><![CDATA[${escapeCDATA(language.value)}]]></language>`;
        } else {
          return `<language id="${escapeCDATA(language.id)}">${escapeCDATA(language.value)}</language>`;
        }
      }
    )
    .join('\n');

  return `<${fieldName}>\n${languages}\n</${fieldName}>`;
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Constructs XML representation of a PrestashopCategory object
 * @param data - The category object to convert
 * @returns XML string representation
 */
export function buildCategoryXML(data: PrestashopCategory): string {
  const nameXML = buildLocalizedFieldXML('name', data.name);
  const linkRewriteXML = buildLocalizedFieldXML('link_rewrite', data.link_rewrite);
  const descriptionXML = buildLocalizedFieldXML('description', data.description, true);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <category>
        <id_parent><![CDATA[${escapeCDATA(data.id_parent)}]]></id_parent>
        <active><![CDATA[${escapeCDATA(data.active)}]]></active>
${nameXML}
${linkRewriteXML}
${descriptionXML}
    </category>
</prestashop>`;
}

