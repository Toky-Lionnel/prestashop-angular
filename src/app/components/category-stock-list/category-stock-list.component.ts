import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

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
export class CategoryStockListComponent implements OnInit, AfterViewInit {
  // Les données sont injectées par le composant parent
  @Input({ required: true }) categoriesStock: CategoryStockSummary[] = [];

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart;

  private viewInitialized = false;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.initCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriesStock'] && this.viewInitialized) {
      this.initCharts();
    }
  }


  /**
   * Permet d'alerter visuellement si le stock disponible est critique
   */
  isStockCritical(available: number): boolean {
    return available <= 5;
  }

  private initCharts(): void {

    if (!this.barCanvas) return;

    // Détruire ancien chart
    this.barChart?.destroy();


    const libelles : string [] = [];
    const physiques : number [] = [];
    const reserved : number [] = [];
    const dispo : number [] = [];

    for (const a of this.categoriesStock) {
      libelles.push(a.categoryName ?? 'Sans nom');
      physiques.push(a.physicalQuantity);
      reserved.push(a.reservedQuantity);
      dispo.push(a.availableQuantity);
    }

    // 2. Diagramme en Bâtons (Bar Chart)
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: libelles,
        datasets: [
          {
            label: 'Stock Physique',
            data: physiques,
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Stock Réservé',
            data: reserved,
            backgroundColor: '#f43f5e'
          },
          {
            label: 'Stock Disponible',
            data: dispo,
            backgroundColor: '#72f43f'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
