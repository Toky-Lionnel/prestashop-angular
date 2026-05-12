export interface VitrineProduct {
  id: number;
  reference?: string;
  name: string;
  linkRewrite?: string;
  description?: string;
  descriptionShort?: string;
  price: number;
  wholesalePrice?: number;
  quantity: number;
  images: number[];
  combinations: number[];
  categories: number[];
  availableForOrder: boolean;
  active: boolean;
  dateAdd?: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getText = (node: any): string => {
  if (node === undefined || node === null) return '';
  // xml2js usually outputs arrays
  if (Array.isArray(node)) node = node[0];
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    if (node._ !== undefined) return String(node._);
    // localized field: { language: [ { _: 'value', '$': { id: '1' } } ] }
    if (node.language && Array.isArray(node.language)) {
      const firstLang = node.language[0];
      if (firstLang === undefined) return '';
      if (typeof firstLang === 'string') return firstLang;
      if (firstLang._ !== undefined) return String(firstLang._);
      // sometimes language has direct text value
      return String(firstLang);
    }
  }
  return String(node);
};

const collectIds = (container: any, pathName = 'id'): number[] => {
  if (!container) return [];
  // container is e.g. associations.images.image -> array of image objects
  const items = Array.isArray(container) ? container : [container];
  const ids: number[] = [];
  for (const it of items) {
    if (!it) continue;
    // if it's an object like { id: [ '1' ] }
    const idNode = it[pathName] ?? it?.id ?? it;
    const raw = Array.isArray(idNode) ? idNode[0] : idNode;
    const n = toNumber(raw, NaN);
    if (!Number.isNaN(n)) ids.push(n);
  }
  return ids;
};

export function mapPrestashopGetAllResponseToVitrine(json: any): VitrineProduct[] {
  const products = json?.prestashop?.products?.[0]?.product ?? [];
  if (!Array.isArray(products)) return [];

  return products.map((p: any) => {
    const id = toNumber(getText(p.id), 0);
    const name = getText(p.name);
    const linkRewrite = getText(p.link_rewrite);
    const description = getText(p.description);
    const descriptionShort = getText(p.description_short) || getText(p.description_short || p.descriptionShort);
    const price = toNumber(getText(p.price), 0);
    const wholesalePrice = p.wholesale_price ? toNumber(getText(p.wholesale_price), 0) : undefined;
    const quantity = toNumber(getText(p.quantity), 0);
    const availableForOrder = String(getText(p.available_for_order || p.available_for_order)).trim() === '1' || String(getText(p.available_for_order)).toLowerCase() === 'true';
    const active = String(getText(p.active)).trim() === '1' || String(getText(p.active)).toLowerCase() === 'true';
    const dateAdd = getText(p.date_add || p.date_add);

    // associations
    const associations = p.associations ?? {};
    const images = collectIds(associations.images?.image ?? p.images?.image ?? []);
    const combinations = collectIds(associations.combinations?.combination ?? p.combinations?.combination ?? []);
    const categories = collectIds(associations.categories?.category ?? p.categories?.category ?? []);

    return {
      id,
      reference: getText(p.reference),
      name,
      linkRewrite,
      description,
      descriptionShort,
      price,
      wholesalePrice,
      quantity,
      images,
      combinations,
      categories,
      availableForOrder,
      active,
      dateAdd
    } as VitrineProduct;
  });
}

export default VitrineProduct;
