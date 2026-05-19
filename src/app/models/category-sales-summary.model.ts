export interface CategorySalesSummary {
  category_id: number | null;
  category_name?: string | null;
  total_purchase: number; // Montant total des achats (coût)
  total_sales: number; // Montant total des ventes (chiffre d'affaires)
  benefit: number; // total_sales - total_purchase
}
