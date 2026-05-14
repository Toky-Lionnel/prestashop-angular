import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';
import { SessionService } from '../../services/service/session/session.service';
import { CustomerService } from '../../services/service/customer/customer.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private cartService : UserCartService = inject(UserCartService);
  private sessionService : SessionService = inject(SessionService);

  private customerService : CustomerService = inject (CustomerService)
  private router = inject(Router);

  userHasAddress: boolean = false;
  userAddress: any = null;

  async ngOnInit() {
    const adress = await this.customerService.getDetailsAddressByIdCustomer(this.sessionService.getCustomer()?.id);
    this.userHasAddress = adress !== null;
    this.userAddress = adress;
  }

  cartItems$ = this.cartService.cart$;
  totalPrice$ = this.cartService.totalPrice$;

  checkoutForm = this.fb.group({
    country: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    city: ['', Validators.required],
    street: ['', Validators.required]
  });

  confirmOrder() {
    if (!this.userHasAddress && this.checkoutForm.invalid) {
      alert('Veuillez remplir vos informations de livraison');
      return;
    }

    const orderData = {
      items: [], // Récupérer depuis cartService
      address: this.userHasAddress ? this.userAddress : this.checkoutForm.value,
      paymentMethod: 'Paiement à la livraison',
      total: 0 // Récupérer le total
    };

    console.log('Commande envoyée :', orderData);
    // Appel API ici, puis :
    // this.cartService.clear();
    // this.router.navigate(['/order-success']);
  }


  goToCart() {
    this.router.navigate(['/cart']);
  }

}
