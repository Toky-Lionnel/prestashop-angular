import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TableRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Actif' | 'Inactif' | 'En attente';
}

@Component({
  selector: 'app-tableau',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './tableau.component.html',
  styleUrl: './tableau.component.scss'
})
export class TableauComponent {

  data: TableRow[] = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@example.com', role: 'Administrateur', status: 'Actif' },
    { id: 2, name: 'Marie Kirikou', email: 'marie.k@example.com', role: 'Développeur', status: 'Actif' },
    { id: 3, name: 'Lucas Rossi', email: 'lucas.r@example.com', role: 'RH', status: 'En attente' },
    { id: 4, name: 'Chloé Fontaine', email: 'chloe.f@example.com', role: 'Designer', status: 'Inactif' }
  ];

  onEdit(row: TableRow) {
    console.log('Modifier la ligne :', row);
    alert(`Édition de : ${row.name}`);
  }

  onDelete(id: number) {
    console.log('Supprimer l ID :', id);
    this.data = this.data.filter(item => item.id !== id);
  }

}
