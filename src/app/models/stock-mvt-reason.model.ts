import { PrestashopLanguageEntry, PrestashopLocalizedField } from './category.model';

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const buildLocalizedField = (value: string, languageId: number = 1): PrestashopLocalizedField => ({
  language: [
    {
      id: languageId,
      value
    }
  ]
});

const buildLocalizedFieldXML = (fieldName: string, field: PrestashopLocalizedField): string => {
  const languages = field.language
    .map(
      (language: PrestashopLanguageEntry) =>
        `        <language id="${escapeCDATA(language.id)}" xlink:href="http://localhost/EVALUATION/prestashop_front/api/languages/${escapeCDATA(language.id)}" format="isUnsignedId"><![CDATA[${escapeCDATA(language.value)}]]></language>`
    )
    .join('\n');

  return `    <${fieldName}>\n${languages}\n    </${fieldName}>`;
};

export interface PrestashopStockMovementReason {
  id?: number | null;
  sign: number;
  name: PrestashopLocalizedField;
}

export interface StockMovementReasonTransformOptions {
  languageId?: number;
  sign?: number;
}

export function buildStockMovementReasonXML(data: PrestashopStockMovementReason): string {
  const nameXML = buildLocalizedFieldXML('name', data.name);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <stock_movement_reason>
        <sign>
            <![CDATA[${escapeCDATA(data.sign)}]]>
        </sign>
${nameXML}
    </stock_movement_reason>
</prestashop>`;
}

export function createStockMovementReasonModel(name: string, options: StockMovementReasonTransformOptions = {}): PrestashopStockMovementReason {
  const languageId = options.languageId ?? 1;
  const sign = options.sign ?? 1;

  return {
    id: null,
    sign,
    name: buildLocalizedField(name, languageId)
  };
}
