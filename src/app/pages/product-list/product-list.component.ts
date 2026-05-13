import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProductService } from '../../services/service/product/product.service';
import { CategoriesService, CategoryOption } from '../../services/service/categories/categories.service';
import { VitrineProduct } from '../../models/vitrine-product.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductVitrineComponent } from '../../components/product-vitrine/product-vitrine.component';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {

  productsVitrine: VitrineProduct[] = [];
  categories: CategoryOption[] = [];
  isLoading = true;

  private productService: ProductService = inject(ProductService);
  private categoriesService: CategoriesService = inject(CategoriesService);
  private formBuilder: FormBuilder = inject(FormBuilder);

  private dialog = inject(MatDialog);

  searchForm = this.formBuilder.group({
    name: [''],
    priceMin: [''],
    priceMax: [''],
    categoryId: ['']
  });

  async ngOnInit () {
    try {
      this.categories = await this.categoriesService.getAll();
      await this.loadProducts();
    } finally {
      this.isLoading = false;
    }
  }


  async onSearch() {
    await this.loadProducts();
  }

  onReset(): void {
    this.searchForm.reset({
      name: '',
      priceMin: '',
      priceMax: '',
      categoryId: ''
    });
    void this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    const name = this.normalizeText(this.searchForm.value.name);
    const priceMin = this.toNullableNumber(this.searchForm.value.priceMin);
    const priceMax = this.toNullableNumber(this.searchForm.value.priceMax);
    const categoryId = this.toNullableNumber(this.searchForm.value.categoryId);

    // Backend filters: price range and category (name filter doesn't work on backend)
    const products = await this.productService.getAllVitrineProducts(null, priceMin, priceMax, categoryId);
    const categoryNameById = new Map(this.categories.map((category) => [category.id, category.name]));

    let results = products.map((product) => ({
      ...product,
      categoryName: categoryNameById.get(product.categoryId) ?? 'Sans catégorie'
    }));

    // Frontend filter: name (case-insensitive partial match)
    if (name) {
      results = results.filter((product) =>
        product.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    this.productsVitrine = results;
  }

  private normalizeText(value: string | null | undefined): string | null {
    const trimmed = (value ?? '').trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toNullableNumber(value: string | null | undefined): number | null {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }


  async openProductSheet(product: VitrineProduct) {

    const productDetail = await this.productService.getProductDetailById(product.id);

    this.dialog.open(ProductVitrineComponent, {
      data: productDetail, // On passe l'objet product au composant
      width: '1200px', // Largeur de la popup
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container' // Optionnel pour du CSS personnalisé
    });
  }


}
