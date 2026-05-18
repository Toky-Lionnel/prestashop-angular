import { PrestashopCart } from './cart.model';
import { formatPrestashopDate } from '../utils/prestashop-date.utils';

export interface PrestashopOrderRow {
  product_id: number;
  product_attribute_id: number | null;
  product_quantity: number;
}

export interface PrestashopOrderAssociations {
  order_rows: PrestashopOrderRow[];
}

export interface PrestashopOrder {
  id?: number | null;
  id_address_delivery: number;
  id_address_invoice: number;
  id_cart: number;
  id_currency: number;
  id_lang: number;
  id_customer: number;
  id_carrier: number;
  module: string;
  payment: string;
  total_paid: number;
  total_paid_real: number;
  total_products: number;
  total_products_wt: number;
  conversion_rate: number;
  order_state?: string;
  customer_email?: string;
  line_number?: number;
  date_add?: string;
  associations: PrestashopOrderAssociations;
}

export interface OrderTransformOptions {
  id_carrier?: number;
  module?: string;
  payment?: string;
  total_paid?: number;
  total_paid_real?: number;
  conversion_rate?: number;
}

const DEFAULT_ORDER_OPTIONS: Required<OrderTransformOptions> = {
  id_carrier: 2,
  module: 'ps_cashondelivery',
  payment: 'Cash on delivery',
  total_paid: 0,
  total_paid_real: 0,
  conversion_rate: 1.0
};

export function transformCartToOrder(
  cart: PrestashopCart,
  options: OrderTransformOptions = {}
): PrestashopOrder {
  const settings = { ...DEFAULT_ORDER_OPTIONS, ...options };

  // Transform cart_rows to order_rows
  const order_rows: PrestashopOrderRow[] = cart.associations.cart_rows.map((cartRow) => ({
    product_id: cartRow.id_product,
    product_attribute_id: cartRow.id_product_attribute,
    product_quantity: cartRow.quantity
  }));

  // Calculate totals from quantities
  const totalProducts = order_rows.reduce((sum: number, row: PrestashopOrderRow) => sum + row.product_quantity, 0);

  return {
    id: null,
    id_address_delivery: cart.id_address_delivery,
    id_address_invoice: cart.id_address_invoice,
    id_cart : cart.id ?? 0,
    id_currency: cart.id_currency,
    id_lang: cart.id_lang,
    line_number : cart.line_number,
    id_customer: cart.id_customer,
    id_carrier: settings.id_carrier,
    module: settings.module,
    payment: settings.payment,
    total_paid: settings.total_paid,
    total_paid_real: settings.total_paid_real,
    total_products: totalProducts,
    total_products_wt: totalProducts,
    order_state: cart.order_state,
    date_add : cart.date_add,
    customer_email: cart.customer_email,
    conversion_rate: settings.conversion_rate,
    associations: {
      order_rows
    }
  };
}

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const buildOrderRowXML = (row: PrestashopOrderRow): string => {
  return `                <order_row>
                    <product_id><![CDATA[${escapeCDATA(row.product_id)}]]></product_id>
                    <product_attribute_id><![CDATA[${escapeCDATA(row.product_attribute_id ?? '')}]]></product_attribute_id>
                    <product_quantity><![CDATA[${escapeCDATA(row.product_quantity)}]]></product_quantity>
                </order_row>`;
};

export function buildOrderXML(data: PrestashopOrder): string {
  const orderRows = data.associations.order_rows.map((row) => buildOrderRowXML(row)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order>
        <id_address_delivery><![CDATA[${escapeCDATA(data.id_address_delivery)}]]></id_address_delivery>
        <id_address_invoice><![CDATA[${escapeCDATA(data.id_address_invoice)}]]></id_address_invoice>
        <id_cart><![CDATA[${escapeCDATA(data.id_cart)}]]></id_cart>
        <id_currency><![CDATA[${escapeCDATA(data.id_currency)}]]></id_currency>
        <id_lang><![CDATA[${escapeCDATA(data.id_lang)}]]></id_lang>
        <id_customer><![CDATA[${escapeCDATA(data.id_customer)}]]></id_customer>
        <id_carrier><![CDATA[${escapeCDATA(data.id_carrier)}]]></id_carrier>
        <module><![CDATA[${escapeCDATA(data.module)}]]></module>
        <payment><![CDATA[${escapeCDATA(data.payment)}]]></payment>
        <total_paid><![CDATA[${escapeCDATA(data.total_paid)}]]></total_paid>
        <total_paid_real><![CDATA[${escapeCDATA(data.total_paid_real)}]]></total_paid_real>
        <total_products><![CDATA[${escapeCDATA(data.total_products)}]]></total_products>
        <total_products_wt><![CDATA[${escapeCDATA(data.total_products_wt)}]]></total_products_wt>
        <conversion_rate><![CDATA[${escapeCDATA(data.conversion_rate)}]]></conversion_rate>
        <associations>
            <order_rows>
${orderRows}
            </order_rows>
        </associations>
    </order>
</prestashop>`;
}


export function buildUpdateOrderXML(data: PrestashopOrder, id_order: number): string {
  const orderRows = data.associations.order_rows.map((row) => buildOrderRowXML(row)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order>
        <id><![CDATA[${escapeCDATA(id_order)}]]></id>
        <id_address_delivery><![CDATA[${escapeCDATA(data.id_address_delivery)}]]></id_address_delivery>
        <id_address_invoice><![CDATA[${escapeCDATA(data.id_address_invoice)}]]></id_address_invoice>
        <id_cart><![CDATA[${escapeCDATA(data.id_cart)}]]></id_cart>
        <id_currency><![CDATA[${escapeCDATA(data.id_currency)}]]></id_currency>
        <id_lang><![CDATA[${escapeCDATA(data.id_lang)}]]></id_lang>
        <id_customer><![CDATA[${escapeCDATA(data.id_customer)}]]></id_customer>
        <id_carrier><![CDATA[${escapeCDATA(data.id_carrier)}]]></id_carrier>
        <id_shop><![CDATA[1]]></id_shop>
        <id_shop_group><![CDATA[0]]></id_shop_group>
        <date_add><![CDATA[${escapeCDATA(formatPrestashopDate(data.date_add ?? ''))}]]></date_add>
        <date_upd><![CDATA[${escapeCDATA(formatPrestashopDate(data.date_add ?? ''))}]]></date_upd>
        <associations>
            <order_rows>
${orderRows}
            </order_rows>
        </associations>
    </order>
</prestashop>`;
}

export function buildUpdateOrderXMLFromResponse(orderData: any, id_order: number, newDateAdd: string): string {
  const xmlFields: string[] = [];
  const ignoredFields = new Set([
    'associations',
    'current_state',
    'id',
    'id_shop',
    'id_shop_group',
    '$'
  ]);

  // Fonction pour extraire la valeur réelle d'un champ xml2js
  const extractValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }

    // Si c'est un tableau, prendre le premier élément
    if (Array.isArray(value)) {
      value = value[0];
    }

    // Si c'est un objet avec une propriété '_' (xml2js text content)
    if (typeof value === 'object' && value !== null && value._) {
      return String(value._);
    }

    // Sinon convertir directement en string
    return String(value);
  };

  // Parcourir tous les champs de l'objet retourné
  for (const key in orderData) {
    if (orderData.hasOwnProperty(key)) {
      let value = orderData[key];

      // Sauter les champs non modifiables ou ajoutés manuellement
      if (ignoredFields.has(key)) {
        continue;
      }

      // Modifier date_add
      if (key === 'date_add') {
        value = formatPrestashopDate(newDateAdd);
      } else {
        // Extraire la vraie valeur
        value = extractValue(value);
      }

      // Construire le tag XML
      xmlFields.push(`        <${key}><![CDATA[${escapeCDATA(value ?? '')}]]></${key}>`);
    }
  }

  // Ajouter les champs spéciaux
  xmlFields.push(`        <id><![CDATA[${escapeCDATA(id_order)}]]></id>`);
  xmlFields.push(`        <id_shop><![CDATA[1]]></id_shop>`);
  xmlFields.push(`        <id_shop_group><![CDATA[0]]></id_shop_group>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order>
${xmlFields.join('\n')}
    </order>
</prestashop>`;
}


