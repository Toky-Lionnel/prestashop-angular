export interface PrestashopCartRow {
  id_product: number;
  id_product_attribute: number | null;
  id_address_delivery: number;
  quantity: number;
}

export interface PrestashopCartAssociations {
  cart_rows: PrestashopCartRow[];
}

export interface PrestashopCart {
  id?: number | null;
  id_currency: number;
  id_lang: number;
  id_customer: number;
  id_address_delivery: number;
  id_address_invoice: number;
  order_state?: string;
  customer_email?: string;
  date_add?: string;
  associations: PrestashopCartAssociations;
}

export interface RawCartParsedRow {
  line_number?: string | number;
  panier?: string | number;
  produit?: string;
  quantite?: string | number;
  id_product?: string | number;
  id_product_attribute?: string | number | null;
  id_address_delivery?: string | number;
}

export interface CartTransformOptions {
  id_currency?: number;
  id_lang?: number;
  id_customer?: number;
  id_address_delivery?: number;
  id_address_invoice?: number;
  default_quantity?: number;
}

const DEFAULT_CART_OPTIONS: Required<CartTransformOptions> = {
  id_currency: 2,
  id_lang: 1,
  id_customer: 0,
  id_address_delivery: 0,
  id_address_invoice: 0,
  default_quantity: 1
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseProductId = (row: RawCartParsedRow): number => {
  if (row.id_product !== undefined && row.id_product !== null && row.id_product !== '') {
    return toNumber(row.id_product, 0);
  }

  // Fallback pratique pour des valeurs type "Produit 12"
  const fromLabel = row.produit?.match(/\d+/)?.[0];
  return toNumber(fromLabel, 0);
};

export function transformParsedRowsToCartModels(rows: any[],options: CartTransformOptions = {}): PrestashopCart[] {
  const settings = { ...DEFAULT_CART_OPTIONS, ...options };
  const cartsByPanier = new Map<number, PrestashopCart>();

  for (const row of rows) {
    const panierId = toNumber(row.panier, 0);
    const existingCart = cartsByPanier.get(panierId);

    if (!existingCart) {
      cartsByPanier.set(panierId, {
        id: null,
        id_currency: settings.id_currency,
        id_lang: settings.id_lang,
        id_customer: settings.id_customer,
        id_address_delivery: settings.id_address_delivery,
        id_address_invoice: settings.id_address_invoice,
        order_state: row.statut,
        customer_email: row.customer_email,
        date_add: row.date,
        associations: {
          cart_rows: []
        }
      });
    }

    const cart = cartsByPanier.get(panierId)!;
    const quantity = toNumber(row.quantite, settings.default_quantity);
    const rowDeliveryAddress = toNumber(row.id_address_delivery, settings.id_address_delivery);

    cart.associations.cart_rows.push({
      id_product: parseProductId(row),
      id_product_attribute:
        row.id_product_attribute === '' || row.id_product_attribute === null || row.id_product_attribute === undefined
          ? null
          : toNumber(row.id_product_attribute, 0),
      id_address_delivery: rowDeliveryAddress,
      quantity
    });
  }

  return [...cartsByPanier.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, cart]) => ({
      ...cart,
      associations: {
        cart_rows: [...cart.associations.cart_rows]
      }
    }));
}

const escapeCDATA = (value: string | number) => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const buildCartRowXML = (row: PrestashopCartRow): string => {
  return `                <cart_row>
                    <id_product><![CDATA[${escapeCDATA(row.id_product)}]]></id_product>
                    <id_product_attribute><![CDATA[${escapeCDATA(row.id_product_attribute ?? '')}]]></id_product_attribute>
                    <id_address_delivery><![CDATA[${escapeCDATA(row.id_address_delivery)}]]></id_address_delivery>
                    <quantity><![CDATA[${escapeCDATA(row.quantity)}]]></quantity>
                </cart_row>`;
};

export function buildCartXML(data: PrestashopCart): string {
  const cartRows = data.associations.cart_rows.map((row) => buildCartRowXML(row)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <cart>
        <id_currency><![CDATA[${escapeCDATA(data.id_currency)}]]></id_currency>
        <id_lang><![CDATA[${escapeCDATA(data.id_lang)}]]></id_lang>
        <id_customer><![CDATA[${escapeCDATA(data.id_customer)}]]></id_customer>
        <id_address_delivery><![CDATA[${escapeCDATA(data.id_address_delivery)}]]></id_address_delivery>
        <id_address_invoice><![CDATA[${escapeCDATA(data.id_address_invoice)}]]></id_address_invoice>
        <associations>
            <cart_rows>
                ${cartRows}
            </cart_rows>
        </associations>
    </cart>
</prestashop>`;
}
