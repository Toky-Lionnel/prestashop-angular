import { Component, inject, OnInit } from '@angular/core';
import { PrestashopStockMovementList } from '../../models/stock-mvt-list.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

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
export class StockEvolutionComponent implements OnInit {

  groupedStocks: PrestashopStockMovementGroup[] = [];

  private dialogRef = inject(MatDialogRef<StockEvolutionComponent>);
  public stocksItems: PrestashopStockMovementList = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.groupedStocks = this.processStockMovements(this.stocksItems);
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
