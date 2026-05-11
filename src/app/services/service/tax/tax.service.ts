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

}
