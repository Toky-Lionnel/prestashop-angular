export interface PrestashopLanguageEntry {
  id: number | 1;
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
  id_category_default: number | 2;
  id_tax_rules_group: number | 0;
  id_shop_default: number | 1;
  state: number | 1;
  active: number | 1;
  available_for_order: number | 1;
  show_price: number | 1;
  visibility: string | 'both';
  type: string | 'standard';
  product_type: string | 'standard';
  condition: string | 'new';
  minimal_quantity: number | 1;
  redirect_type: string | '404';
  price: number;
  name: PrestashopLocalizedField;
  link_rewrite: PrestashopLocalizedField;
  associations: PrestashopProductAssociations;
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

  return `  <${fieldName}>\n${languages}\n  </${fieldName}>`;
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


