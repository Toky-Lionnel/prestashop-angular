export interface PayementOrder {
  order_reference: string;
  id_currency: number;
  amount: number;
  payment_method: string;
  transaction_id: string;
}


export function buildOrderPaymentXML(data: PayementOrder): string {
  // Sécurisation minimale (très important)
  const escapeCDATA = (value: string | number) => {
    return String(value)
      .replace(/]]>/g, ']]]]><![CDATA[>'); // évite de casser le CDATA
  };

  // Format prix (PrestaShop attend souvent 2 décimales)
  const amountFormatted = Number(data.amount).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_payment>
    <order_reference><![CDATA[${escapeCDATA(data.order_reference)}]]></order_reference>
    <id_currency><![CDATA[${escapeCDATA(data.id_currency)}]]></id_currency>
    <amount><![CDATA[${escapeCDATA(amountFormatted)}]]></amount>
    <payment_method><![CDATA[${escapeCDATA(data.payment_method)}]]></payment_method>
    <transaction_id><![CDATA[${escapeCDATA(data.transaction_id)}]]></transaction_id>
  </order_payment>
</prestashop>`;
}
