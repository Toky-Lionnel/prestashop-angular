import { inject, Injectable } from '@angular/core';
import { CombinationCsvModel } from '../../../models/combination-csv.model';
import { AttributeService } from '../../service/attribute/attribute.service';
import { ProductService } from '../../service/product/product.service';
import { PrestashopCombination, PrestashopProductOption, PrestashopProductOptionValue } from '../../../models/attribute.model';
import { AttributeModel, extractUniqueAttributes } from '../../../models/attribute-csv.model';
import { TaxService } from '../../service/tax/tax.service';
import { StockFacadeService } from '../stockFacade/stock-facade.service';
import { ProductFacadeService } from '../productFacade/product-facade.service';

@Injectable({
  providedIn: 'root'
})
export class AttributeFacadeService {

  productMap : Map <string,number> = new Map <string,number> ();

  // map pour les options spécificités (ex : taille)
  productOptionMap : Map<string,number> = new Map<string,number>();

  // map karazany (ex : S)
  productOptionValueMap : Map<string,number> = new Map<string,number>();


  getProductMap() : Map <string,number> {
    return this.productMap;
  }

  getProductOptionMap() : Map<string,number> {
    return this.productOptionMap;
  }

  getProductOptionValueMap() : Map<string,number> {
    return this.productOptionValueMap;
  }

  constructor() {
  }

  private attributeService : AttributeService = inject(AttributeService);
  private productService : ProductService = inject(ProductService);
  private taxService : TaxService = inject(TaxService);
  private stockFacadeService : StockFacadeService = inject(StockFacadeService);
  private productFacadeService : ProductFacadeService = inject(ProductFacadeService);


  async insertionStocksSansDeclinaison(combinations: CombinationCsvModel[]) {
    for (const combo of combinations) {
      const idProduct = this.productMap.get(combo.reference);
      if (!idProduct) continue;
      const date_add = await this.productService.getDateAvailabilityByIdProduct(idProduct) ?? new Date().toISOString();
      await this.stockFacadeService.updateStockMouvement(idProduct, 0, combo.stock_initial, 'Initial stock import for product without combination', date_add);
    }
  }

  async importProductOption(specificite: string) : Promise<number | null> {
    const idOption = this.productOptionMap.get(specificite);
    if (idOption) {
      return idOption;
    }

    const productOption: PrestashopProductOption = {
      id: 0,
      group_type: 'select',
      name: { language: [{ id: 1 , value: specificite }] },
      public_name: { language: [{ id: 1 , value: specificite }] },
    };

    const idOptionCreated = await this.attributeService.createProductOption(productOption);
    this.productOptionMap.set(specificite,idOptionCreated ?? 0);
    return idOptionCreated;
  }


  async importProductOptionValue(attribute: AttributeModel): Promise<number | null> {
    const key = `${attribute.specificite}_${attribute.karazany}`;
    const cachedId = this.productOptionValueMap.get(key);

    if (cachedId) {
      return cachedId;
    }

    const idOption = this.productOptionMap.get(attribute.specificite);
    if (!idOption) {
      throw new Error(
        `Failed to create or retrieve product option for specificite: ${attribute.specificite}`
      );
    }

    // Création
    const productOptionValue: PrestashopProductOptionValue = {
      id_attribute_group: idOption,
      name: {
        language: [ { id: 1, value: attribute.karazany }]
      }
    };

    const createdId = await this.attributeService.createProductOptionValue(productOptionValue);
    if (createdId) {
      this.productOptionValueMap.set(key, createdId);
    }
    return createdId;
  }


  async importOption (uniqueAttributes : AttributeModel []) : Promise <void> {
    for (const attribute of uniqueAttributes) {
      await this.importProductOption(attribute.specificite);
    }

    for (const attribute of uniqueAttributes) {
      await this.importProductOptionValue(attribute);
    }
  }





  async importProductCombinations(combinations: CombinationCsvModel[], mapProducts : Map <string, number>): Promise<void> {

    this.productMap = mapProducts;

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
      const idProduct =  this.productMap.get(reference);
      if (!idProduct) {
        console.warn(`Product with reference ${reference} not found. Skipping combinations.`);
        continue;
      }

      const date_availability = await this.productService.getDateAvailabilityByIdProduct(idProduct) ?? new Date().toISOString();

      for (const combo of combos) {
        const attribute = uniqueAttributes.find(attr => attr.specificite === combo.specificite && attr.karazany === combo.karazany);
        if (!attribute) {
          console.warn(`Attribute for combination with reference ${reference} not found. Skipping this combination.`);
          continue;
        }

        const idOption = this.productOptionMap.get(attribute.specificite);
        if (!idOption) {
          console.warn(`Failed to import product option for attribute ${attribute.specificite}. Skipping this combination.`);
          continue;
        }

        const idOptionValue = this.productOptionValueMap.get(`${attribute.specificite}_${attribute.karazany}`);
        if (!idOptionValue) {
          console.warn(`Failed to import product option value for attribute ${attribute.specificite} - ${attribute.karazany}. Skipping this combination.`);
          continue;
        }

        const combinationData: PrestashopCombination = {
          id_product: idProduct,
          reference: combo.reference,
          wholesale_price: 0,
          price: Number((await this.calculDifferenceHorsTaxe(idProduct, combo.prix_vente_ttc)).toFixed(3)),
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


        const createdCombinationId = await this.attributeService.createCombination(combinationData);
          if (!createdCombinationId) {
            continue;
          }

        // mise à jour du stock pour la combinaison créée + creation du mouvement de stock correspondant
        await this.stockFacadeService.updateStockMouvement(
          idProduct, createdCombinationId, combo.stock_initial, 'Initial stock import', date_availability
        );

      }

      console.log(`==== FIN CREATION COMBINAISON ${idProduct}`);
    }

    console.log("=== FIN CREATION FEUILLE 2");
  }

  async calculDifferenceHorsTaxe(
    id_product: number,
    prix_vente_ttc: number
  ): Promise<number> {

    const taxRate = await this.taxService.getTaxValueByIdProduct(id_product);

    const prixBaseHt =
      await this.productService.getPrixBaseProductByReference(id_product);

    if (taxRate === null || prixBaseHt === null) {
      throw new Error(
        `Failed to retrieve tax rate or base price for product with ID ${id_product}`
      );
    }

    // Prix parent TTC
    const prixBaseTtc = prixBaseHt * (1 + taxRate / 100);

    // Différence HT Prestashop
    const differenceHt =
      (prix_vente_ttc - prixBaseTtc) / (1 + taxRate / 100);

    return Number(differenceHt.toFixed(6));
  }
}

