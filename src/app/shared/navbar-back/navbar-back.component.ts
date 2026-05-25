import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '../../services/service/session/session.service';

interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-navbar-back',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './navbar-back.component.html',
  styleUrl: './navbar-back.component.scss'
})
export class NavbarBackComponent {
   // Liens de navigation principaux
  navItems: NavItem[] = [
    { label: 'Tableau de bord', route: '/admin/dashboard' },
    { label: 'Import', route: '/admin/import' },
    { label: 'Produits', route: '/admin/products' },
    { label: 'Commandes', route: '/admin/orders' },
    { label : 'Reinitialisation', route : '/admin/reinit'}
  ];

  // États d'ouverture des menus
  isMobileMenuOpen: boolean = false;
  isProfileMenuOpen: boolean = false;

  private sessionService : SessionService = inject(SessionService);
  private router : Router = inject(Router);

  // Données utilisateur fictives
  user = {
    name: 'Toky Lionnel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
  };

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) this.isProfileMenuOpen = false; // Ferme le profil sur mobile
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  async logout(): Promise<void> {
    this.sessionService.clear();
    await this.router.navigate(['/loginadmin']);
  }


  // Ferme les menus automatiques si on clique en dehors du composant
  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-container')) {
      this.isMobileMenuOpen = false;
      this.isProfileMenuOpen = false;
    }
  }

}
