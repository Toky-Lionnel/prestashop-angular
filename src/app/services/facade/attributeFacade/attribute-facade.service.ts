import { inject, Injectable } from '@angular/core';
import { CombinationCsvModel } from '../../../models/combination-csv.model';
import { StocksService } from '../../service/stocks/stocks.service';
import { AttributeService } from '../../service/attribute/attribute.service';
import { ProductService } from '../../service/product/product.service';
import { PrestashopCombination, PrestashopProductOption, PrestashopProductOptionValue } from '../../../models/attribute.model';
import { AttributeModel, extractUniqueAttributes } from '../../../models/attribute-csv.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeFacadeService {

  constructor() { }

  private stocksService : StocksService = inject(StocksService);
  private attributeService : AttributeService = inject(AttributeService);
  private productService : ProductService = inject(ProductService);


  async insertionStocksSansDeclinaison(combinations: CombinationCsvModel[]) {
    for (const combo of combinations) {
      const idProduct = await this.productService.getIdProductByReference(combo.reference);
      if (!idProduct) continue;
      const idStock = await this.stocksService.getIdStockProductsId(idProduct);
      await this.stocksService.updateStockWithIdProduct(idStock, idProduct, combo.stock_initial, 0);
    }
  }





  async importProductOption(attribute: AttributeModel) : Promise<number | null> {
    const idOption = await this.attributeService.getProductOptionIdByName(attribute.specificite);
    if (idOption) {
      return idOption;
    }

    const productOption: PrestashopProductOption = {
      id: 0,
      group_type: 'select',
      name: { language: [{ id: 1 , value: attribute.specificite }] },
      public_name: { language: [{ id: 1 , value: attribute.specificite }] },
    };
    return await this.attributeService.createProductOption(productOption);
  }


  async importProductOptionValue(attribute: AttributeModel) : Promise<number | null> {
    const idOption = await this.importProductOption(attribute);await this.attributeService.getProductOptionIdByName(attribute.specificite);
    if (!idOption) {
      throw new Error(`Failed to create or retrieve product option for specificite: ${attribute.specificite}`);
    }

    const attributeValue = attribute.karazany;

    const idOptionValue = await this.attributeService.getProductOptionValueIdByName(idOption, attributeValue);
    if (idOptionValue) {
      return idOptionValue;
    }

    const productOptionValue: PrestashopProductOptionValue = {
      id_attribute_group: idOption,
      name:  { language : [ {id : 1 , value: attributeValue} ]}
    };

    return await this.attributeService.createProductOptionValue(productOptionValue);
  }


  async importOption (uniqueAttributes : AttributeModel []) : Promise <void> {
    for (const attribute of uniqueAttributes) {
      await this.importProductOption(attribute);
    }

    for (const attribute of uniqueAttributes) {
      await this.importProductOptionValue(attribute);
    }
  }





  async importProductCombinations(combinations: CombinationCsvModel[]): Promise<void> {

    const combinationsWithoutSpec = combinations.filter((c) => !c.specificite || c.specificite.trim() === '');
    const combinationsWithSpec = combinations.filter((c) => c.specificite && c.specificite.trim() !== '');

    const uniqueAttributes : AttributeModel[] = extractUniqueAttributes(combinationsWithSpec);

    await this.importOption(uniqueAttributes);
    await this.insertionStocksSansDeclinaison(combinationsWithoutSpec);


    // Group combinations by reference
    const combinationsByReference = new Map<string, CombinationCsvModel[]>();
    for (const combination of combinationsWithSpec) {
      if (!combinationsByReference.has(combination.reference)) {
        combinationsByReference.set(combination.reference, []);
      }
      combinationsByReference.get(combination.reference)!.push(combination);
    }

    for (const [reference, combos] of combinationsByReference.entries()) {
      const idProduct = await this.productService.getIdProductByReference(reference);
      if (!idProduct) {
        console.warn(`Product with reference ${reference} not found. Skipping combinations.`);
        continue;
      }

      for (const combo of combos) {
        const attribute = uniqueAttributes.find(attr => attr.specificite === combo.specificite && attr.karazany === combo.karazany);
        if (!attribute) {
          console.warn(`Attribute for combination with reference ${reference} not found. Skipping this combination.`);
          continue;
        }

        const idOption = await this.attributeService.getProductOptionIdByName(attribute.specificite);
        if (!idOption) {
          console.warn(`Failed to import product option for attribute ${attribute.specificite}. Skipping this combination.`);
          continue;
        }

        const idOptionValue = await this.attributeService.getProductOptionValueIdByName(idOption,attribute.karazany);
        if (!idOptionValue) {
          console.warn(`Failed to import product option value for attribute ${attribute.specificite} - ${attribute.karazany}. Skipping this combination.`);
          continue;
        }

        const combinationData: PrestashopCombination = {
          id_product: idProduct,
          reference: combo.reference,
          wholesale_price: 0,
          price: combo.prix_vente_ttc,
          minimal_quantity: 1,
          default_on: 0,
          associations: {
            product_option_values: {
              product_option_value: [
                { id: idOptionValue }
              ]
            }
          }
        };

        await this.attributeService.createCombination(combinationData);

        const idStock = await this.stocksService.getIdStockProductsId(idProduct);
        await this.stocksService.updateStockWithIdProduct(idStock, idProduct, combo.stock_initial, idOptionValue);
      }
    }



  }

}

