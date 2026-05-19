import { Component, inject } from '@angular/core';
import { ReinitialisationService } from '../../services/service/reinitialisation/reinitialisation.service';

@Component({
  selector: 'app-reinitialisation',
  imports: [],
  templateUrl: './reinitialisation.component.html',
  styleUrls: ['./reinitialisation.component.scss']
})
export class ReinitialisationComponent {

  private reinitialisationService : ReinitialisationService = inject(ReinitialisationService);

  async reinitialiser () {
    const ok = window.confirm('Confirmer la réinitialisation de la base de données ? Cette opération est irréversible.');
    if (!ok) return;
    try {
      await this.reinitialisationService.resetDatabase();
      window.alert('Réinitialisation effectuée avec succès.');
    } catch (err) {
      console.error(err);
      window.alert('Erreur lors de la réinitialisation. Voir la console.');
    }
  }

}
