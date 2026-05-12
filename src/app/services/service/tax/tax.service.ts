import { inject, Injectable } from '@angular/core';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { buildTaxRuleGroupXML, buildTaxRuleXML, buildTaxXML, PrestashopTax, PrestashopTaxRule, PrestashopTaxRuleGroup } from '../../../models/tax.model';
import { parseStringPromise } from 'xml2js';

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  constructor() { }

  private intereceptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  async createTax (tax : PrestashopTax) : Promise<any> {
    const api = this.intereceptor.getApi();
    const xml = buildTaxXML(tax);
    const response = await api.post('/api/taxes', xml , {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.tax?.[0]?.id?.[0];
    return id;
  }

  async createTaxGroup (taxGroup : PrestashopTaxRuleGroup) : Promise<any> {
    const api = this.intereceptor.getApi();
    const xml = buildTaxRuleGroupXML(taxGroup);
    const response = await api.post('/api/tax_rule_groups', xml , {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.tax_rule_group?.[0]?.id?.[0];
    return id;
  }

  async createTaxRule (taxRule : PrestashopTaxRule) : Promise<any> {
    const api = this.intereceptor.getApi();
    const xml = buildTaxRuleXML(taxRule);
    const response = await api.post('/api/tax_rules', xml , {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    const responseData = await parseStringPromise(response.data);
    const id = responseData?.prestashop?.tax_rule?.[0]?.id?.[0];
    return id;
  }


  async getTaxValueByIdProduct (id_product : number) : Promise<number> {
    const api = this.intereceptor.getApi();
    const response = await api.get(`/api/products/${id_product}?display=[id_tax_rules_group]`, { responseType: 'text' });
    const responseData = await parseStringPromise(response.data);
    const idTaxRulesGroup = responseData?.prestashop?.product?.[0]?.id_tax_rules_group?.[0]._;

    if (!idTaxRulesGroup) {
      throw new Error(`No tax rules group found for product with ID ${id_product}`);
    }

    const taxRulesResponse = await api.get(`/api/tax_rules?filter[id_tax_rules_group]=${idTaxRulesGroup}&display=[id_tax]`, { responseType: 'text' });
    const taxRulesData = await parseStringPromise(taxRulesResponse.data);
    const taxRule = taxRulesData?.prestashop?.tax_rules?.[0]?.tax_rule?.[0];

    if (!taxRule) {
      throw new Error(`No tax rule found for tax rules group with ID ${idTaxRulesGroup}`);
    }

    const idTax = taxRule.id_tax?.[0];
    if (!idTax) {
      throw new Error(`No tax found for tax rule with ID ${taxRule.id?.[0]}`);
    }

    const taxResponse = await api.get(`/api/taxes/${idTax}?display=[rate]`, { responseType: 'text' });
    const taxData = await parseStringPromise(taxResponse.data);
    const rate = taxData?.prestashop?.tax?.[0]?.rate?.[0];
    if (rate === undefined) {
      throw new Error(`No rate found for tax with ID ${idTax}`);
    }

    return Number(rate);
  }

}
