import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductVitrineComponent } from '../../components/product-vitrine/product-vitrine.component';

import { VitrineProductDetail } from '../../models/vitrine-product.model';
import { ProductService } from '../../services/service/product/product.service';

@Component({
  selector: 'app-add-stock',
  standalone: true,
  imports: [CommonModule, ProductVitrineComponent],
  templateUrl: './add-stock.component.html',
  styleUrl: './add-stock.component.scss'
})
export class AddStockComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private productService : ProductService = inject(ProductService);

  product: VitrineProductDetail | null = null;

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.product = await this.productService.getProductDetailById(id);
  }
}
