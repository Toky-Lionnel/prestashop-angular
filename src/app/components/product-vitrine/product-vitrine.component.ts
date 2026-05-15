import { CommonModule } from '@angular/common';
import { Component, inject, Inject, Input, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { VitrineProductCombination, VitrineProductDetail } from '../../models/vitrine-product.model';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';
import { StocksService } from '../../services/service/stocks/stocks.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-vitrine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './product-vitrine.component.html',
  styleUrls: ['./product-vitrine.component.scss']
})
export class ProductVitrineComponent {

  @Input() isAdmin: boolean = false;

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
    stock_available : 0,
    images: [],
    combinations: []
  };
  selectedImageUrl: string | null = null;
  selectedCombinationId: number | null = null;
  quantity = 1;

  private userCartService : UserCartService = inject(UserCartService);
  private dialogRef = inject(MatDialogRef<ProductVitrineComponent>,{ optional: true });
  private stockService : StocksService = inject(StocksService);
  private router: Router = inject(Router);

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
    return this.product.price ?? this.selectedCombination?.price;
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

  // TODO : prix and image should be those of the combination if they exist, not the product ones
  addToCart(): void {
    this.userCartService.addItem({
      productId: this.product.id,
      attributeId: this.selectedCombination?.id ?? 0,
      productNameWithAttribute: `${this.product.name}${this.selectedCombination ? ' - ' + this.selectedCombination.attributes.map(attr => attr.attributeName).join(', ') : ''}`,
      quantity: this.quantity,
      price: this.product.price,
      image: this.featuredImageUrl
    });
    alert('Produit ajouté au panier !');
    this.dialogRef?.close();
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }


  async updateStock() : Promise<void> {
    const stocks = await this.stockService.getStockByIdProductAndAttribute(this.product.id, this.selectedCombination?.id ?? 0);

    const idStock = stocks.id[0];
    const quantite_actuel = Number(stocks.quantity[0]);
    const quantite_ajoute = Number(this.quantity);
    const quantite_final = quantite_actuel + quantite_ajoute;

    await this.stockService.updateStockWithIdProduct(idStock, this.product.id, quantite_final, this.selectedCombination?.id ?? 0);
    alert ('Stock mis à jour !');
  }

  private getDefaultCombination(product: VitrineProductDetail): VitrineProductCombination | null {
    return product.combinations.find((combination) => combination.defaultOn) ?? null;
  }

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }
}
