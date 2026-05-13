import { CommonModule } from '@angular/common';
import { Component, Inject, Input, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { VitrineProductCombination, VitrineProductDetail } from '../../models/vitrine-product.model';

@Component({
  selector: 'app-product-vitrine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './product-vitrine.component.html',
  styleUrls: ['./product-vitrine.component.scss']
})
export class ProductVitrineComponent {
  private _product: VitrineProductDetail = {
    id: 0,
    name: '',
    imageUrl: null,
    price: 0,
    categoryId: 0,
    categoryName: null,
    tag: 'ordinaire',
    reference: null,
    description: null,
    shortDescription: null,
    availableDate: null,
    categories: [],
    images: [],
    combinations: []
  };
  selectedImageUrl: string | null = null;
  selectedCombinationId: number | null = null;
  quantity = 1;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data?: VitrineProductDetail) {
    if (data) {
      this.product = data;
    }
  }

  @Input()
  set product(value: VitrineProductDetail) {
    this._product = value;
    this.selectedImageUrl = value.images[0]?.url ?? value.imageUrl;
    this.selectedCombinationId = this.getDefaultCombination(value)?.id ?? value.combinations[0]?.id ?? null;
    this.quantity = 1;
  }

  get product(): VitrineProductDetail {
    return this._product;
  }

  get featuredImageUrl(): string | null {
    return this.selectedImageUrl ?? this.product.images[0]?.url ?? this.product.imageUrl;
  }

  get selectedCombination(): VitrineProductCombination | null {
    return this.product.combinations.find((combination) => combination.id === this.selectedCombinationId) ?? null;
  }

  // TODO: fix price display when combination has price 0 but product has price > 0 (should display product price)
  get currentPrice(): number {
    return this.product.price;
  }

  selectImage(url: string | null): void {
    if (url) {
      this.selectedImageUrl = url;
    }
  }

  selectCombination(combinationId: number): void {
    this.selectedCombinationId = combinationId;
  }

  updateQuantity(value: string): void {
    const parsed = Number(value);
    this.quantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }

  addToCart(): void {
    console.log('addToCart', {
      productId: this.product.id,
      combinationId: this.selectedCombination?.id ?? null,
      quantity: this.quantity
    });
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  private getDefaultCombination(product: VitrineProductDetail): VitrineProductCombination | null {
    return product.combinations.find((combination) => combination.defaultOn) ?? null;
  }
}
