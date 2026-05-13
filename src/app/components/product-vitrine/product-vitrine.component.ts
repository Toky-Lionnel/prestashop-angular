import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { VitrineProductDetail } from '../../models/vitrine-product.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-vitrine',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './product-vitrine.component.html',
  styleUrls: ['./product-vitrine.component.scss']
})
export class ProductVitrineComponent {
  // On récupère le produit soit par Input classique, soit via la Popup
  product: VitrineProductDetail;

  constructor(@Inject(MAT_DIALOG_DATA) public data: VitrineProductDetail) {
    this.product = data;
  }

  get featuredImageUrl(): string | null {
    // Note: Assurez-vous que product.imageUrl existe dans votre interface de base
    return this.product.images[0]?.url ?? (this.product as any).imageUrl;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
