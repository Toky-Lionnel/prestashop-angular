import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

interface DummyData {
  [key: string]: {
    revenues: number[];
    expenses: number[];
    categories: number[];
  };
}

@Component({
  selector: 'app-dashboard',
  standalone : true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Récupération des éléments Canvas du HTML
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  // Instances des graphiques pour pouvoir les détruire/mettre à jour
  private lineChart?: Chart;
  private barChart?: Chart;
  private pieChart?: Chart;

  // Filtre
  selectedYear: string = '2026';
  years: string[] = ['2026', '2025'];

  // Données fictives structurées par année
  private mockData: DummyData = {
    '2026': {
      revenues: [4500, 5200, 6100, 5800, 7100, 8500],
      expenses: [3100, 2900, 4000, 3800, 4200, 5000],
      categories: [40, 25, 20, 15] // Total = 100%
    },
    '2025': {
      revenues: [3800, 4100, 4500, 4900, 5200, 6000],
      expenses: [2500, 2700, 3100, 3000, 3500, 4100],
      categories: [30, 35, 15, 20]
    }
  };

  // Libellés partagés
  months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  departments = ['Développement', 'Marketing', 'Infrastructures', 'RH'];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Initialisation des graphiques après le rendu du DOM
    this.initCharts();
  }

  // Fonction appelée à chaque changement du filtre HTML
  onFilterChange(): void {
    this.updateCharts();
  }

  private initCharts(): void {
    const activeData = this.mockData[this.selectedYear];

    // 1. Diagramme en Ligne (Line Chart)
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Revenus (€)',
            data: activeData.revenues,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Dépenses (€)',
            data: activeData.expenses,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Diagramme en Bâtons (Bar Chart)
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Revenus',
            data: activeData.revenues,
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Dépenses',
            data: activeData.expenses,
            backgroundColor: '#f43f5e'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Diagramme en Camembert (Pie Chart)
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: this.departments,
        datasets: [
          {
            data: activeData.categories,
            backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ec4899']
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private updateCharts(): void {
    const newData = this.mockData[this.selectedYear];

    if (this.lineChart && this.barChart && this.pieChart) {
      // Écrase les anciennes données par les nouvelles selon l'année
      this.lineChart.data.datasets[0].data = newData.revenues;

      this.barChart.data.datasets[0].data = newData.revenues;
      this.barChart.data.datasets[1].data = newData.expenses;

      this.pieChart.data.datasets[0].data = newData.categories;

      // Demande à Chart.js de re-dessiner les graphiques avec une animation
      this.lineChart.update();
      this.barChart.update();
      this.pieChart.update();
    }
  }
}
