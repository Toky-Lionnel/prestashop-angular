export interface PrestashopStockAvailable {
  id: number | null;
  id_product: number | null;
  id_product_attribute: number;
  id_shop: number;
  id_shop_group: number;
  quantity: number;
  depends_on_stock: number;
  out_of_stock: number;
}

const escapeCDATA = (value: string | number) => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};


export function buildStockXML(data: PrestashopStockAvailable): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <stock_available>
        <id>
            <![CDATA[${escapeCDATA(data.id ?? '')}]]>
        </id>
        <id_product>
            <![CDATA[${escapeCDATA(data.id_product ?? '')}]]>
        </id_product>
        <id_product_attribute>
            <![CDATA[${escapeCDATA(data.id_product_attribute)}]]>
        </id_product_attribute>
        <id_shop>
            <![CDATA[${escapeCDATA(data.id_shop)}]]>
        </id_shop>
        <id_shop_group>
            <![CDATA[${escapeCDATA(data.id_shop_group)}]]>
        </id_shop_group>
        <quantity>
            <![CDATA[${escapeCDATA(data.quantity)}]]>
        </quantity>
        <depends_on_stock>
            <![CDATA[${escapeCDATA(data.depends_on_stock)}]]>
        </depends_on_stock>
        <out_of_stock>
            <![CDATA[${escapeCDATA(data.out_of_stock)}]]>
        </out_of_stock>
    </stock_available>
</prestashop>`;
}
