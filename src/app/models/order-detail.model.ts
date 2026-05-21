export interface OrderDetail {
  product_id: number | null;
  product_attribute_id: number | null;
  product_quantity_reinjected: number | null;
  product_name: string | null;
  product_quantity: number | null;
  product_price: number | null;
  product_reference: string | null;
  id_tax_rules_group: number | null;
  unit_price_tax_incl: number | null;
  unit_price_tax_excl: number | null;
  total_price_tax_incl: number | null;
  total_price_tax_excl: number | null;
  original_product_price: number | null;
  original_wholesale_price: number | null;
  // additional field requested
  category_id: number | null;
}

function extractValue(node: any): any {
  if (node == null) return null;
  const v = Array.isArray(node) ? node[0] : node;
  if (v && typeof v === 'object') return v._ ?? v['#text'] ?? null;
  return v;
}

export async function mapPrestashopOrderDetailToModel(raw: any, getCategoryId?: (idProduct: number) => Promise<number | null>): Promise<OrderDetail> {
  const pidRaw = extractValue(raw?.product_id);
  const product_id = pidRaw != null ? Number(String(pidRaw).trim()) : null;

  const attributeRaw = extractValue(raw?.product_attribute_id);
  const product_attribute_id = attributeRaw != null ? Number(String(attributeRaw).trim()) : null;

  const parseNum = (n: any) => {
    const s = extractValue(n);
    if (s == null) return null;
    const str = String(s).trim();
    if (str === '') return null;
    const num = Number(str);
    return Number.isNaN(num) ? null : num;
  };

  const od: OrderDetail = {
    product_id,
    product_attribute_id,
    product_quantity_reinjected: parseNum(raw?.product_quantity_reinjected),
    product_name: extractValue(raw?.product_name) ? String(extractValue(raw?.product_name)).trim() : null,
    product_quantity: parseNum(raw?.product_quantity),
    product_price: parseNum(raw?.product_price),
    product_reference: extractValue(raw?.product_reference) ? String(extractValue(raw?.product_reference)).trim() : null,
    id_tax_rules_group: parseNum(raw?.id_tax_rules_group),
    unit_price_tax_incl: parseNum(raw?.unit_price_tax_incl),
    unit_price_tax_excl: parseNum(raw?.unit_price_tax_excl),
    total_price_tax_incl: parseNum(raw?.total_price_tax_incl),
    total_price_tax_excl: parseNum(raw?.total_price_tax_excl),
    original_product_price: parseNum(raw?.original_product_price),
    original_wholesale_price: parseNum(raw?.original_wholesale_price),
    category_id: null
  };

  if (getCategoryId && product_id != null) {
    try {
      od.category_id = await getCategoryId(product_id);
    } catch (e) {
      od.category_id = null;
    }
  }

  return od;
}
