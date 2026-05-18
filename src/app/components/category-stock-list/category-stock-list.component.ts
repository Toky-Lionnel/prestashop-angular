import { Component, Input } from '@angular/core';
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
export class CategoryStockListComponent {
  // Les données sont injectées par le composant parent
  @Input({ required: true }) categoriesStock: CategoryStockSummary[] = [];

  /**
   * Permet d'alerter visuellement si le stock disponible est critique
   */
  isStockCritical(available: number): boolean {
    return available <= 5;
  }
}
