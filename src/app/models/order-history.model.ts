import { PrestashopOrder } from './order.model';

export interface PrestashopOrderHistory {
  id_order_state: number;
  order_state : string;
  id_order: number;
  date_add: string;
  line_number?: number;
}

export interface OrderHistoryTransformOptions {
  id_order_state?: number;
  date_add?: string;
}

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

const formatDateTime = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function transformToOrderHistory(id_order : number,
  id_order_state: number, date_add : string | null, line_number?: number): PrestashopOrderHistory {
  return {
    id_order_state: id_order_state,
    order_state : String(id_order_state),
    id_order: id_order,
    date_add: date_add || formatDateTime(new Date()),
    line_number: line_number
  };
}

export function transformOrderToOrderHistory(order : PrestashopOrder): PrestashopOrderHistory {

  const id = getIdOrderStateFromCart(order.order_state);

  return {
    id_order_state: id,
    id_order: order.id ?? 0,
    order_state : order.order_state ?? '',
    line_number : order.line_number,
    date_add: order.date_add || formatDateTime(new Date())
  };
}

const buildOrderHistoryFieldXML = (fieldName: keyof PrestashopOrderHistory, value: string | number): string => {
  return `<${fieldName} format="${fieldName === 'date_add' ? 'isDate' : 'isUnsignedId'}">\n            <![CDATA[${escapeCDATA(value)}]]>\n        </${fieldName}>`;
};

export function buildOrderHistoryXML(data: PrestashopOrderHistory): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order_history>
    ${buildOrderHistoryFieldXML('id_order', data.id_order)}
${buildOrderHistoryFieldXML('id_order_state', data.id_order_state)}
    </order_history>
</prestashop>`;
}


function getIdOrderStateFromCart(order_state : string | undefined): number {
  return 0;
}
