export interface PrestashopStockMovementListItem {
  id: number;
  id_product?: number | null;
  id_product_attribute?: number | null;
  id_stock?: number | null;
  physical_quantity?: number | null;
  sign?: number | null;
  date_add?: string | null;
}

export type PrestashopStockMovementList = PrestashopStockMovementListItem[];

export interface PrestashopStockMovementGroup {
  date: string; // YYYY-MM-DD
  id_product?: number | null;
  id_product_attribute?: number | null;
  total_quantity: number;
  movements: PrestashopStockMovementListItem[];
}
