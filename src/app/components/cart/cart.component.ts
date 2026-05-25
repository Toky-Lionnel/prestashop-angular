import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { CartItem, UserCartService } from '../../services/service/user-cart/user-cart.service';
import { Router } from '@angular/router';
import { SessionService } from '../../services/service/session/session.service';
import { LoginFrontComponent } from '../login-front/login-front.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  private cartService : UserCartService = inject(UserCartService);
  private sessionService : SessionService = inject(SessionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Données réactives
  cartItems$: Observable<CartItem[]> = this.cartService.cart$;
  totalPrice$: Observable<number> = this.cartService.totalPrice$;
  totalCount$: Observable<number> = this.cartService.totalItems$;

  ngOnInit() {
  }

  updateQty(item: CartItem, delta: number): void {
    this.cartService.updateQuantity(item.productId, item.attributeId, delta);
  }

  onQtyChange(event: Event, item: CartItem): void {
    const input = event.target as HTMLInputElement;
    const newQty = parseInt(input.value, 10);
    if (!isNaN(newQty)) {
      const delta = newQty - item.quantity;
      this.cartService.updateQuantity(item.productId, item.attributeId, delta);
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productId, item.attributeId);
  }

  clearCart(): void {
    if (confirm('Voulez-vous vraiment vider votre panier ?')) {
      this.cartService.clear();
    }
  }

  checkout(): void {
    if (!this.sessionService.getCustomer()) {
      this.router.navigate(['/accueil'], { queryParams: { redirectUrl: '/checkout' } });
      return;
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  trackByItem(_: number, item: CartItem): string {
    return `${item.productId}-${item.attributeId}`;
  }

  goToShop() {
    this.router.navigate(['/products']); // Redirige vers l'accueil ou la boutique
  }

  showLoginForm () {
    this.dialog.open(LoginFrontComponent, {
      width: '500px',
      data: { redirectUrl: '/checkout' },
      height : '500px',
    });
  }
}
