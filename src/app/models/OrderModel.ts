export interface Order {
  id: number;
  total_paid: number;
  date_add: string;
  products: OrderRow[];
}

export interface OrderRow {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}
