export interface VitrineProduct {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  categoryId: number;
  categoryName: string | null;
  tag : string | null;
  stock_available: number | null;
}

export interface VitrineProductCategory {
  id: number;
  name: string | null;
}

export interface VitrineProductImage {
  id: number;
  url: string | null;
  legend: string | null;
}

export interface VitrineCombinationAttribute {
  attributeId: number | null;
  attributeName: string | null;
  groupId: number | null;
  groupName: string | null;
}

export interface VitrineProductCombination {
  id: number;
  reference: string | null;
  price: number;
  wholesalePrice: number | null;
  minimalQuantity: number;
  stock_available: number | null;
  defaultOn: boolean;
  attributes: VitrineCombinationAttribute[];
  images: VitrineProductImage[];
}

export interface VitrineProductDetail extends VitrineProduct {
  reference: string | null;
  description: string | null;
  shortDescription: string | null;
  availableDate: string | null;
  categories: VitrineProductCategory[];
  images?: VitrineProductImage[];
  combinations: VitrineProductCombination[];
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

const getLocalizedText = (node: any): string => {
  const value = first(node);
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    if (value._ !== undefined) return String(value._);

    if (Array.isArray(value.language)) {
      const firstLanguage = value.language[0];
      if (firstLanguage === undefined || firstLanguage === null) return '';
      if (typeof firstLanguage === 'string') return firstLanguage;
      if (firstLanguage._ !== undefined) return String(firstLanguage._);
      if (firstLanguage.value !== undefined) return String(firstLanguage.value);
      return String(firstLanguage);
    }
  }

  return String(value);
};

const buildProductMediaUrl = (productId: number, imageId: number, imageNode: any): string | null => {
  const href = getAttribute(imageNode, 'xlink:href');
  if (typeof href === 'string' && href.trim() !== '') {
    return href;
  }

  if (productId <= 0 || imageId <= 0) return null;

  return `/api/images/products/${productId}/${imageId}`;
};

const getCategoryNodes = (product: any): any[] => {
  const associations = first(product?.associations);
  const categories = first(associations?.categories);
  const categoryNodes = categories?.category ?? [];
  return Array.isArray(categoryNodes) ? categoryNodes : [categoryNodes];
};

export function mapPrestashopProductToDetail(
  product: any,
  options: {
    categoryNameById?: Map<number, string>;
    images?: VitrineProductImage[];
    combinations?: VitrineProductCombination[];
  } = {}
): VitrineProductDetail {
  const id = toNumber(getText(product?.id), 0);
  const name = getText(product?.name);
  const price = toNumber(getText(product?.price), 0);
  const categoryId = toNumber(getText(product?.id_category_default), 0);
  const categoryName = options.categoryNameById?.get(categoryId) ?? null;
  const imageUrl = buildProductImageUrl(product);
  const tag = buildTag(getText(product?.available_date));

  const categories = getCategoryNodes(product)
    .filter(Boolean)
    .map((category: any) => {
      const categoryIdValue = toNumber(getText(category?.id), 0);
      const resolvedName = options.categoryNameById?.get(categoryIdValue) ?? (getLocalizedText(category?.name) || null);

      return {
        id: categoryIdValue,
        name: resolvedName
      } as VitrineProductCategory;
    })
    .filter((category) => category.id > 0);

  return {
    id,
    name,
    imageUrl,
    price,
    categoryId,
    categoryName,
    tag,
    stock_available: 0,
    reference: getText(product?.reference) || null,
    description: getLocalizedText(product?.description) || null,
    shortDescription: getLocalizedText(product?.description_short) || null,
    availableDate: getText(product?.available_date) || null,
    categories,
    images: options.images ?? (imageUrl ? [{ id: 0, url: imageUrl, legend: null }] : []),
    combinations: options.combinations ?? []
  };
}

export function mapPrestashopProductImagesToVitrineImages(productId: number, imagesNode: any): VitrineProductImage[] {
  const imageEntries = first(imagesNode?.prestashop?.images)?.image
    ?? first(imagesNode?.prestashop?.image)?.image
    ?? imagesNode?.prestashop?.images?.[0]?.image
    ?? [];

  const normalizedEntries = Array.isArray(imageEntries) ? imageEntries : [imageEntries];

  return normalizedEntries
    .filter(Boolean)
    .map((image: any) => {
      const id = toNumber(getText(image?.id), 0);
      const legend = getLocalizedText(image?.legend) || null;

      return {
        id,
        url: buildProductMediaUrl(productId, id, image),
        legend
      } as VitrineProductImage;
    })
    .filter((image) => image.id > 0 && image.url !== null);
}

export function mapPrestashopCombinationImagesToVitrineImages(productId: number, combination: any): VitrineProductImage[] {
  const imageEntries = combination?.associations?.[0]?.images?.[0]?.image
    ?? combination?.associations?.[0]?.images?.[0]?.img
    ?? combination?.associations?.[0]?.images?.[0]?.id
    ?? [];

  const normalizedEntries = Array.isArray(imageEntries) ? imageEntries : [imageEntries];

  return normalizedEntries
    .filter(Boolean)
    .map((image: any) => {
      const id = toNumber(getText(image?.id ?? image), 0);
      const legend = getLocalizedText(image?.legend) || null;

      return {
        id,
        url: buildProductMediaUrl(productId, id, image),
        legend
      } as VitrineProductImage;
    })
    .filter((image) => image.id > 0 && image.url !== null);
}

export function mapPrestashopCombinationToVitrineCombination(
  productId: number,
  combination: any,
  attributeNameById: Map<number, { attributeName: string; groupName: string | null }>
): VitrineProductCombination {
  const optionValues = combination?.associations?.[0]?.product_option_values?.[0]?.product_option_value ?? [];
  const normalizedValues = Array.isArray(optionValues) ? optionValues : [optionValues];

  const attributes = normalizedValues
    .filter(Boolean)
    .map((value: any) => {
      const attributeId = toNumber(getText(value?.id), 0);
      const attributeData = attributeNameById.get(attributeId);

      return {
        attributeId,
        attributeName: attributeData?.attributeName ?? (getText(value?.name) || null),
        groupId: null,
        groupName: attributeData?.groupName ?? null
      } as VitrineCombinationAttribute;
    })
    .filter((attribute) => (attribute.attributeId ?? 0) > 0);

  const combinationId = toNumber(getText(combination?.id), 0);

  return {
    id: combinationId,
    reference: getText(combination?.reference) || null,
    price: toNumber(getText(combination?.price), 0),
    wholesalePrice: (() => {
      const value = getText(combination?.wholesale_price);
      return value === '' ? null : toNumber(value, 0);
    })(),
    stock_available : 0,
    minimalQuantity: toNumber(getText(combination?.minimal_quantity), 1),
    defaultOn: toNumber(getText(combination?.default_on), 0) === 1,
    attributes,
    images: mapPrestashopCombinationImagesToVitrineImages(productId, combination)
  };
}

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
      tag,
      stock_available: 0
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
