import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoryStockSummary {
  categoryId: number;
  categoryName: string | null;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

@Component({
  selector: 'app-category-stock-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-stock-list.component.html',
  styleUrl: './category-stock-list.component.scss'
})
export class CategoryStockListComponent implements OnInit {
  // Les données sont injectées par le composant parent
  @Input({ required: true }) categoriesStock: CategoryStockSummary[] = [];

  totalPhysique : number = 0;
  totalReserved : number = 0;
  totalDispo : number = 0;

  ngOnInit(): void {
     for (const s of this.categoriesStock) {
      this.totalPhysique += s.physicalQuantity;
      this.totalReserved += s.reservedQuantity;
      this.totalDispo += s.availableQuantity;
     }
  }


  /**
   * Permet d'alerter visuellement si le stock disponible est critique
   */
  isStockCritical(available: number): boolean {
    return available <= 5;
  }
}
