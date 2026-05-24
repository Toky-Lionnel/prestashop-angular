import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProductCard {
  id: number;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  price: number;
}

@Component({
  selector: 'app-fiche',
  imports: [CommonModule],
  standalone : true,
  templateUrl: './fiche.component.html',
  styleUrl: './fiche.component.scss'
})
export class FicheComponent {
  items: ProductCard[] = [
    {
      id: 1,
      title: 'Espace de Coworking Premium',
      category: 'Infrastructures',
      description: 'Accès haut débit, bureaux ergonomiques et café à volonté dans le centre-ville.',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
      price: 250
    },
    {
      id: 2,
      title: 'Station de Travail Dual-Monitor',
      category: 'Équipement',
      description: 'Optimisé pour le développement multi-écrans avec dock USB-C universel inclus.',
      imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=400&q=80',
      price: 45
    },
    {
      id: 3,
      title: 'Kit Dev Nomade Pro',
      category: 'Accessoires',
      description: 'Clavier mécanique compact, souris ergonomique et sacoche de transport renforcée.',
      imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=400&q=80',
      price: 120
    }
  ];

  viewDetails(item: ProductCard) {
    alert(`Détails de l'article : ${item.title}`);
  }

}
