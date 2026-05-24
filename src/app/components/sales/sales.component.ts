import { CategorySalesSummary } from '../../models/category-sales-summary.model';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);


@Component({
  selector: 'app-sales',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})


export class SalesComponent implements OnInit, AfterViewInit {
  // Réception des données depuis le composant ou la page parent
  @Input({ required: true }) salesSummaryList: CategorySalesSummary[] = [];

  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  private pieChart?: Chart;

  private viewInitialized = false;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.initCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salesSummaryList'] && this.viewInitialized) {
      this.initCharts();
    }
  }

  /**
   * Calcule la marge en pourcentage pour donner plus de contexte à l'utilisateur
   * Formule : (Bénéfice / Ventes) * 100
   */
  getMarginPercentage(summary: CategorySalesSummary): number {
    if (!summary.total_sales || summary.total_sales === 0) return 0;
    return (summary.benefit / summary.total_sales) * 100;
  }

  private initCharts(): void {
    const activeData = this.salesSummaryList;

    if (!this.pieCanvas) return;

    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = undefined;
    }

    if (activeData.length === 0) {
      return;
    }

    const categories : string [] = [];
    const benefices : number [] = [];

    for (const a of activeData) {
      categories.push(a.category_name ?? 'Sans nom');
      benefices.push(a.benefit);
    }

    // 3. Diagramme en Camembert (Pie Chart)
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [
          {
            data: benefices,
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }


}
