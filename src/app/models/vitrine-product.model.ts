export interface VitrineProduct {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  categoryId: number;
  categoryName: string | null;
  tag : string | null;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const first = <T>(value: T | T[] | undefined | null): T | undefined => {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const getText = (node: any): string => {
  const value = first(node);
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._ !== undefined) return String(value._);

    if (value.language && Array.isArray(value.language)) {
      const firstLang = value.language[0];
      if (firstLang === undefined || firstLang === null) return '';
      if (typeof firstLang === 'string') return firstLang;
      if (firstLang._ !== undefined) return String(firstLang._);
      return String(firstLang);
    }
  }

  return String(value);
};

const getAttribute = (node: any, attributeName: string): string => {
  const nodeValue = first(node);
  if (!nodeValue || typeof nodeValue !== 'object') return '';
  const attributes = nodeValue.$ ?? nodeValue['$'];
  const attributeValue = attributes?.[attributeName];
  return typeof attributeValue === 'string' ? attributeValue : '';
};

const buildProductImageUrl = (product: any): string | null => {
  const defaultImage = first(product?.id_default_image);
  const defaultImageId = toNumber(getText(defaultImage), 0);

  const href = getAttribute(defaultImage, 'xlink:href');
  if (typeof href === 'string' && href.trim() !== '') {
    return href;
  }

  const productId = toNumber(getText(product?.id), 0);
  if (productId <= 0 || defaultImageId <= 0) return null;

  return `/api/images/products/${productId}/${defaultImageId}`;
};

export function mapPrestashopGetAllResponseToVitrine(json: any): VitrineProduct[] {
  const products = first(json?.prestashop?.products)?.product ?? [];

  return (Array.isArray(products) ? products : [products]).filter(Boolean).map((p: any) => {
    const id = toNumber(getText(p.id), 0);
    const name = getText(p.name);
    const price = toNumber(getText(p.price), 0);
    const categoryId = toNumber(getText(p.id_category_default), 0);
    const imageUrl = buildProductImageUrl(p);
    const tag = buildTag(getText(p.available_date));

    return {
      id,
      name,
      imageUrl,
      price,
      categoryId,
      categoryName: null,
      tag
    } as VitrineProduct;
  });
}


function buildTag(date_availability: string): string {
  const today = new Date();
  let tag = 'ordinaire';

  const availabilityDate = new Date(date_availability);

  // Remettre les heures à 0 pour comparer uniquement les dates
  today.setHours(0, 0, 0, 0);
  availabilityDate.setHours(0, 0, 0, 0);

  const differenceMs = today.getTime() - availabilityDate.getTime();
  const differenceJours = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

  if (differenceJours === 1) {
    tag = 'HOT';  // Produit sorti il y a exactement 1 jour
  } else if (differenceJours > 1 && differenceJours <= 7) {
    tag = 'NEW';  // Produit sorti entre 2 et 7 jours
  }

  return tag;
}
