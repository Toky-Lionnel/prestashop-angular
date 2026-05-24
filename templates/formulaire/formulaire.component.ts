import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-formulaire',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './formulaire.component.html',
  styleUrl: './formulaire.component.scss'
})
export class FormulaireComponent {
  // Modèle de données statique initialisé
  formData = {
    username: '',
    birthDate: '',
    department: 'tech',
    contractType: 'cdi',
    newsletter: true,
    comments: ''
  };

  onSubmit() {
    console.log('Données soumises avec succès :', this.formData);
    alert('Formulaire soumis ! Regarde la console de ton navigateur.');
  }

}
