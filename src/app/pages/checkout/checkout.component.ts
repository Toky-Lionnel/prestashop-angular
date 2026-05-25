import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';
import { SessionService } from '../../services/service/session/session.service';
import { CustomerService } from '../../services/service/customer/customer.service';
import { PrestashopCart } from '../../models/cart.model';
import { CartService } from '../../services/service/cart/cart.service';
import { PrestashopOrder, transformCartToOrder } from '../../models/order.model';
import { OrderService } from '../../services/service/orders/order.service';
import { StocksService } from '../../services/service/stocks/stocks.service';
import { StockFacadeService } from '../../services/facade/stockFacade/stock-facade.service';
import { OrderFacadeService } from '../../services/facade/orderFacade/order-facade.service';
import { NavbarFrontComponent } from "../../shared/navbar-front/navbar-front.component";

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarFrontComponent, NavbarFrontComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private cartService : UserCartService = inject(UserCartService);
  private sessionService : SessionService = inject(SessionService);

  private customerService : CustomerService = inject (CustomerService)
  private router = inject(Router);

  private cartPrestashopService : CartService = inject(CartService);
  private orderService : OrderService = inject(OrderService);
  private stockFacadeService : StockFacadeService = inject(StockFacadeService);
  private orderFacade : OrderFacadeService = inject(OrderFacadeService);

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

  async confirmOrder() {
    if (!this.userHasAddress && this.checkoutForm.invalid) {
      alert('Veuillez remplir vos informations de livraison');
      return;
    }

    let adress = null;

    if (!this.userHasAddress) {
      adress = this.customerService.createAddressCustomer({
      id_customer: this.sessionService.getCustomer()?.id ?? 0,
      alias: 'Adresse de livraison',
      lastname: this.sessionService.getCustomer()?.email ?? '',
      firstname: '',
      address1: this.checkoutForm.value.street!,
      city: this.checkoutForm.value.city!,
      id_country: 8, // ID du pays (ex : France)
    });
    } else {
      adress = this.userAddress.id[0];
    }

    const id_cart = this.sessionService.getCartId();

    const prestashopCart : PrestashopCart = {
      id : id_cart ?? undefined,
      id_currency: 1,
      id_lang: 1,
      id_customer: this.sessionService.getCustomer()?.id ?? 0,
      id_address_delivery: adress,
      id_address_invoice: adress,
      order_state : 'Paiement accepté',
      line_number: 0,
      associations: {
        cart_rows: this.cartService.getCartItems().map((item, index) => ({
          product_name: '', // Récupérer la référence du produit
          id_product: item.productId,
          product_attribute: '', // Récupérer la référence de l'attribut si nécessaire
          id_product_attribute: item.attributeId,
          id_address_delivery: adress,
          quantity: item.quantity
        }))
      }
    };

    await this.cartPrestashopService.updateCart(prestashopCart, id_cart ?? 0);
    const orders : PrestashopOrder = transformCartToOrder(prestashopCart);

    await this.orderFacade.insertOrderAndMouvementStock(orders);
    alert('Commande confirmée !');
    this.cartService.clearCartCommande();
    this.router.navigate(['/products']);
  }


  goToCart() {
    this.router.navigate(['/cart']);
  }

}
