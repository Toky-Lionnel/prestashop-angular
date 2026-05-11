export interface Order {
  id: number;
  total_paid: number;
  customer_email: string;
  recent_statut : string;
  date_add: string;
  products: OrderRow[];
}

export interface OrderRow {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}


/*
- Reference
- Clients
- Produits
- Statut Actuel
- Modification Statut
- Date de Commande

*/
