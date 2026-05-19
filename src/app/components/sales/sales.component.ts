import { CategorySalesSummary } from '../../models/category-sales-summary.model';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-sales',
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})


export class SalesComponent {
  // Réception des données depuis le composant ou la page parent
  @Input({ required: true }) salesSummaryList: CategorySalesSummary[] = [];

  /**
   * Calcule la marge en pourcentage pour donner plus de contexte à l'utilisateur
   * Formule : (Bénéfice / Ventes) * 100
   */
  getMarginPercentage(summary: CategorySalesSummary): number {
    if (!summary.total_sales || summary.total_sales === 0) return 0;
    return (summary.benefit / summary.total_sales) * 100;
  }

}
