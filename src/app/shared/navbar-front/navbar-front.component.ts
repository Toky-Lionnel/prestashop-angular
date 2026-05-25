import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../services/service/session/session.service';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';

@Component({
  selector: 'app-navbar-front',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './navbar-front.component.html',
  styleUrl: './navbar-front.component.scss'
})
export class NavbarFrontComponent {

  cartLength: number = 0; // Valeur par défaut pour l'exemple

  private router : Router = inject(Router);
  private sessionService : SessionService = inject(SessionService);
  private userCartService : UserCartService = inject(UserCartService);

  async ngOnInit () {
    try {
      this.userCartService.cart$.subscribe(cart => {
        this.cartLength = cart.reduce((sum, item) => sum + item.quantity, 0);
      });
    } catch (er : any) {
      throw er;
    }
  }

  openCart(): void {
    this.router.navigate(['/cart']);
  }

  openProducts() : void {
    this.router.navigate(['/products']);
  }

  async openOrders(): Promise<void> {
    const idCustomer = this.sessionService.getCustomer()?.id;
    if (!idCustomer) {
      return;
    }

    this.router.navigate(['/orders']);
  }


  clearCustomerSession() {
    this.sessionService.clearCustomer();
    this.router.navigate(['/accueil']);
    alert("Session client effacée !");
  }

}
