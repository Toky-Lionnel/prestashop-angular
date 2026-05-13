import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { VitrineProductDetail } from '../../models/vitrine-product.model';

@Component({
  selector: 'app-product-vitrine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-vitrine.component.html',
  styleUrl: './product-vitrine.component.scss',
  host: {
    class: 'product-card'
  }
})
export class ProductVitrineComponent {

  @Input({ required: true }) product!: VitrineProductDetail;

  get featuredImageUrl(): string | null {
    return this.product.images[0]?.url ?? this.product.imageUrl;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

}
