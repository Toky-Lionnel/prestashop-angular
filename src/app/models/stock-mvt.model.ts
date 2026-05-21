import { formatPrestashopDate } from "../utils/prestashop-date.utils";

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const toIsoDateTime = (value: string | Date | undefined): string => {
  if (!value) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }

  return value;
};

export interface PrestashopStockMovement {
  id?: number | null;
  id_product: number | null;
  id_product_attribute: number | null;
  id_currency: number | null;
  id_employee: number | null;
  id_stock: number | null;
  id_stock_mvt_reason: number | null;
  physical_quantity: number | null;
  sign: number;
  price_te: number | null;
  date_add?: string | Date;
}

export function buildStockMovementXML(data: PrestashopStockMovement): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <stock_mvt>
        <id_product>
            <![CDATA[${escapeCDATA(data.id_product ?? '')}]]>
        </id_product>
        <id_product_attribute>
            <![CDATA[${escapeCDATA(data.id_product_attribute ?? '')}]]>
        </id_product_attribute>
        <id_currency>
            <![CDATA[${escapeCDATA(data.id_currency ?? '')}]]>
        </id_currency>
        <id_employee required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_employee ?? '')}]]>
        </id_employee>
        <id_stock required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_stock ?? '')}]]>
        </id_stock>
        <id_stock_mvt_reason required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_stock_mvt_reason ?? '')}]]>
        </id_stock_mvt_reason>
        <physical_quantity required="true" format="isUnsignedInt">
            <![CDATA[${escapeCDATA(data.physical_quantity ?? '')}]]>
        </physical_quantity>
        <sign required="true" format="isInt">
            <![CDATA[${escapeCDATA(data.sign)}]]>
        </sign>
        <price_te required="true" format="isPrice">
            <![CDATA[${escapeCDATA(data.price_te ?? '')}]]>
        </price_te>
        <date_add required="true" format="isDate">
            <![CDATA[${escapeCDATA(formatPrestashopDate(data.date_add ?? ''))}]]>
        </date_add>
    </stock_mvt>
</prestashop>`;
}

export function buildStockUpdateMovementXML(data: PrestashopStockMovement, id_stock_mvt: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <stock_mvt>
        <id>${escapeCDATA(id_stock_mvt)}</id>
        <id_product>
            <![CDATA[${escapeCDATA(data.id_product ?? '')}]]>
        </id_product>
        <id_product_attribute>
            <![CDATA[${escapeCDATA(data.id_product_attribute ?? '')}]]>
        </id_product_attribute>
        <id_currency>
            <![CDATA[${escapeCDATA(data.id_currency ?? '')}]]>
        </id_currency>
        <id_employee required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_employee ?? '')}]]>
        </id_employee>
        <id_stock required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_stock ?? '')}]]>
        </id_stock>
        <id_stock_mvt_reason required="true" format="isUnsignedId">
            <![CDATA[${escapeCDATA(data.id_stock_mvt_reason ?? '')}]]>
        </id_stock_mvt_reason>
        <physical_quantity required="true" format="isUnsignedInt">
            <![CDATA[${escapeCDATA(data.physical_quantity ?? '')}]]>
        </physical_quantity>
        <sign required="true" format="isInt">
            <![CDATA[${escapeCDATA(data.sign)}]]>
        </sign>
        <price_te required="true" format="isPrice">
            <![CDATA[${escapeCDATA(data.price_te ?? '')}]]>
        </price_te>
        <date_add required="true" format="isDate">
            <![CDATA[${escapeCDATA(formatPrestashopDate(data.date_add ?? ''))}]]>
        </date_add>
    </stock_mvt>
</prestashop>`;
}
