import { PrestashopStockMovementList } from '../../models/stock-mvt-list.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

export interface PrestashopStockMovementGroup {
  date: string;
  id_product?: number | null;
  id_product_attribute?: number | null;
  total_movements: number; // Nombre total de lignes de mouvement
  total_entries: number;   // Somme des quantités entrées (sign == 1)
  total_exits: number;     // Somme des quantités sorties (sign == -1)
  net_quantity: number;    // Solde total (Entrées - Sorties)
}

@Component({
  selector: 'app-stock-evolution',
  imports: [CommonModule],
  templateUrl: './stock-evolution.component.html',
  styleUrl: './stock-evolution.component.scss'
})
export class StockEvolutionComponent implements OnInit,AfterViewInit  {

  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;

  groupedStocks: PrestashopStockMovementGroup[] = [];

  private lineChart?: Chart;


  private dialogRef = inject(MatDialogRef<StockEvolutionComponent>);
  public stocksItems: PrestashopStockMovementList = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.groupedStocks = this.processStockMovements(this.stocksItems);
    this.initCharts();
  }

  ngAfterViewInit(): void {
    // Initialisation des graphiques après le rendu du DOM
    this.initCharts();
  }

  private initCharts(): void {
    const activeData = this.groupedStocks;

    const dates_libelle : string [] = [];
    const entrees : number [] = [];
    const sorties : number [] = [];

    for (const o of activeData) {
      entrees.push(o.total_entries);
      sorties.push(o.total_exits);
      dates_libelle.push(o.date);
    }

    // 1. Diagramme en Ligne (Line Chart)
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: dates_libelle,
        datasets: [
          {
            label: 'Entrées',
            data: entrees,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Sorties',
            data: sorties,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

  }


  /**
   * Regroupe les mouvements par Date, Produit et Attribut
   * et calcule les statistiques d'entrées / sorties
   */
  private processStockMovements(movements: PrestashopStockMovementList): PrestashopStockMovementGroup[] {
    const groupsMap = new Map<string, PrestashopStockMovementGroup>();

    movements.forEach(mv => {
      if (!mv.date_add) return;

      // Extraction de la date uniquement (YYYY-MM-DD)
      const dateOnly = mv.date_add.split(' ')[0];
      const prodId = mv.id_product ?? 0;
      const attrId = mv.id_product_attribute ?? 0;

      // Clé unique pour le regroupement
      const groupKey = `${dateOnly}_${prodId}_${attrId}`;
      const qty = mv.physical_quantity ?? 0;

      // Initialisation des compteurs d'entrées/sorties pour ce mouvement précis
      const entryQty = mv.sign === 1 ? qty : 0;
      const exitQty = mv.sign === -1 ? qty : 0;

      if (groupsMap.has(groupKey)) {
        const current = groupsMap.get(groupKey)!;
        current.total_movements += 1;
        current.total_entries += entryQty;
        current.total_exits += exitQty;
        current.net_quantity += (entryQty - exitQty);
      } else {
        groupsMap.set(groupKey, {
          date: dateOnly,
          id_product: mv.id_product,
          id_product_attribute: mv.id_product_attribute,
          total_movements: 1,
          total_entries: entryQty,
          total_exits: exitQty,
          net_quantity: entryQty - exitQty
        });
      }
    });

    // Convertit la Map en tableau et trie par date décroissante
    return Array.from(groupsMap.values()).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  close(): void {
    this.dialogRef.close();
  }

}
