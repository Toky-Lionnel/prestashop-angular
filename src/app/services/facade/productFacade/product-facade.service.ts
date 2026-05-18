import { inject, Injectable } from '@angular/core';
import { ProductService } from '../../service/product/product.service';
import { StocksService } from '../../service/stocks/stocks.service';
import { PrestashopProduct } from '../../../models/product.model';
import { CategoriesService } from '../../service/categories/categories.service';
import { PrestashopCategory } from '../../../models/category.model';
import { ProductCsvModel } from '../../../models/product-csv.model';
import { TaxService } from '../../service/tax/tax.service';
import {
  PrestashopTax,
  PrestashopTaxRule,
  PrestashopTaxRuleGroup,
} from '../../../models/tax.model';
import { createEmptyValidationResult, FieldValidationError, ImportValidationResult } from '../../../models/validation.model';

@Injectable({
  providedIn: 'root',
})
export class ProductFacadeService {
  private productService: ProductService = inject(ProductService);
  private stocksService: StocksService = inject(StocksService);
  private categoriesService: CategoriesService = inject(CategoriesService);
  private taxService: TaxService = inject(TaxService);

  constructor() {}

  async importProduct(products: PrestashopProduct[]) {
    for (const product of products) {
      const idProduct = await this.productService.createProduct(product);
      if (idProduct) {
        const createdProduct: PrestashopProduct = { ...product, id: idProduct };
        createdProduct.quantity = product.quantity;
        const id_stock =
          await this.stocksService.getIdStockProductsId(idProduct);
        await this.stocksService.updateStock(id_stock, createdProduct);
      }
    }
  }

  async importProductsBase(products: ProductCsvModel[]): Promise<void> {
    try {
      const categories: PrestashopCategory[] =
        this.categoriesService.groupCategories(products);
      const categoryIdByName = new Map<string, number>();

      for (const category of categories) {
        const categoryName = category.name.language[0]?.value?.trim() ?? '';
        const createdCategoryId =
          await this.categoriesService.createCategories(category);
        const resolvedCategoryId =
          createdCategoryId ??
          (await this.categoriesService.getIdCategoryByName(categoryName));

        if (resolvedCategoryId) {
          categoryIdByName.set(categoryName.toLowerCase(), resolvedCategoryId);
        }
      }

      for (const product of products) {
        const categoryName = product.categorie.trim();
        const categoryId =
          categoryIdByName.get(categoryName.toLowerCase()) ?? 2;

        const tax: PrestashopTax = {
          name: {
            language: [
              { id: 1, value: `Tax ${product.taxe}%` },
            ],
          },
          rate: product.taxe,
          active: 1,
        };

        const taxId = await this.taxService.createTax(tax);

        const taxGroup: PrestashopTaxRuleGroup = {
          name: `Tax Rule Group for ${product.nom}`,
          active: 1,
        };

        const taxGroupId = await this.taxService.createTaxGroup(taxGroup);

        const taxRule: PrestashopTaxRule = {
          id_tax: taxId,
          id_tax_rules_group: taxGroupId,
          id_country: 8,
        };

        await this.taxService.createTaxRule(taxRule);

        const produitHorsTaxe = this.formatToThreeDecimals(
          product.prix_ttc / (1 + product.taxe / 100),
        );

        const prestashopProduct: PrestashopProduct = {
          id: null,
          id_category_default: categoryId,
          id_tax_rules_group: taxGroupId,
          id_shop_default: 1,
          state: 1,
          active: 1,
          available_for_order: 1,
          show_price: 1,
          visibility: 'both',
          type: 'simple',
          product_type: 'standard',
          condition: 'new',
          minimal_quantity: 1,
          redirect_type: '404',
          price: Number(produitHorsTaxe),
          wholesale_price: Number(product.prix_achat),
          quantity: 0,
          reference: product.reference,
          date_availability: product.date_availability_produit,
          line_number: product.line_number ?? 0,
          name: { language: [{ id: 1, value: product.nom }] },
          link_rewrite: {
            language: [
              { id: 1, value: product.nom.toLowerCase().replace(/\s+/g, '-') },
            ],
          },
          associations: {
            categories: {
              category: [{ id: categoryId }],
            },
          },
        };
        await this.productService.createProduct(prestashopProduct);
      }
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  }

  async createCategory(categorie: PrestashopCategory) {
    await this.categoriesService.createCategories(categorie);
  }

  async validateProducts(
    products: PrestashopProduct[],
    file_name: string,
  ): Promise<ImportValidationResult<PrestashopProduct>> {
    const validationResult = createEmptyValidationResult<PrestashopProduct>();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const lineNumber = product.line_number;

      const fieldErrors: FieldValidationError[] = [];

      if (
        !product.name ||
        !product.name.language ||
        product.name.language.length === 0 ||
        !product.name.language[0].value
      ) {
        fieldErrors.push({
          field: 'name',
          code: 'required',
          message: 'Le nom du produit est requis.',
        });
      }

      if (
        product.price === null ||
        product.price === undefined ||
        isNaN(product.price)
      ) {
        fieldErrors.push({
          field: 'price',
          code: 'required',
          message: `Le prix du produit est requis et doit être un nombre : ${product.price}`,
        });
      } else if (product.price < 0) {
        fieldErrors.push({
          field: 'price',
          code: 'invalid_value',
          message: `Le prix du produit ne peut pas être négatif : ${product.price}`,
        });
      }

      if (
        product.quantity === null ||
        product.quantity === undefined ||
        isNaN(product.quantity)
      ) {
        fieldErrors.push({
          field: 'quantity',
          code: 'required',
          message: `La quantité du produit est requise et doit être un nombre : ${product.quantity}`,
        });
      } else if (product.quantity < 0) {
        fieldErrors.push({
          field: 'quantity',
          code: 'invalid_value',
          message: `La quantité du produit ne peut pas être négative : ${product.quantity}`,
        });
      }

      if (fieldErrors.length > 0) {
        validationResult.invalidData.push({
          lineNumber,
          data: product,
          errors: fieldErrors,
        });
      } else {
        validationResult.validData.push(product);
      }

      // eto no mila manao recherche anaty base raha ohatra ka
      // for (const validProduct of validationResult.validData) {
      //   if (validProduct.name == product.name) {
      //     validationResult.invalidData.push({
      //       lineNumber,
      //       data: product,
      //       errors: [{
      //         field: 'name',
      //         code: 'duplicate',
      //         message: 'Un produit avec ce nom existe déjà dans le fichier. Ligne : ' +validProduct.line_number
      //       }]
      //     });
      //     validationResult.validData = validationResult.validData.filter(p => p !== product);
      //     break;
      //   }
      // }
    }

    validationResult.file_name = file_name;
    validationResult.summary.total = products.length;
    validationResult.summary.valid = validationResult.validData.length;
    validationResult.summary.invalid = validationResult.invalidData.length;

    return validationResult;
  }

  private formatToThreeDecimals(value: number): string {
    return value.toFixed(3);
  }
}
