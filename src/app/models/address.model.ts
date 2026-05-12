import { PrestashopCustomer } from './customer.model';

export interface PrestashopAddress {
  id?: number | null;
  id_customer: number;
  id_country: number;
  alias: string;
  lastname: string;
  firstname: string;
  address1: string;
  city: string;
}

export interface AddressTransformOptions {
  id_country?: number;
  alias?: string;
  address1?: string;
  city?: string;
}

const DEFAULT_ADDRESS_OPTIONS: Required<AddressTransformOptions> = {
  id_country: 8,
  alias: 'Adresse',
  address1: '',
  city: 'Antananarivo'
};

const escapeCDATA = (value: string | number): string => {
  return String(value).replace(/]]>/g, ']]]]><![CDATA[>');
};

export function transformCustomerToAddress(
  customer: PrestashopCustomer,
  options: AddressTransformOptions = {}
): PrestashopAddress {
  const settings = { ...DEFAULT_ADDRESS_OPTIONS, ...options };

  return {
    id: null,
    id_customer: customer.id ?? 0,
    id_country: settings.id_country,
    alias: settings.alias,
    lastname: customer.lastname,
    firstname: customer.firstname,
    address1: settings.address1,
    city: settings.city
  };
}

export function buildAddressXML(data: PrestashopAddress): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <address>
        <id_customer><![CDATA[${escapeCDATA(data.id_customer)}]]></id_customer>
        <id_country><![CDATA[${escapeCDATA(data.id_country)}]]></id_country>

        <alias><![CDATA[${escapeCDATA(data.alias)}]]></alias>

        <lastname><![CDATA[${escapeCDATA(data.lastname)}]]></lastname>
        <firstname><![CDATA[${escapeCDATA(data.firstname)}]]></firstname>

        <address1><![CDATA[${escapeCDATA(data.address1)}]]></address1>
        <city><![CDATA[${escapeCDATA(data.city)}]]></city>
    </address>
</prestashop>`;
}
