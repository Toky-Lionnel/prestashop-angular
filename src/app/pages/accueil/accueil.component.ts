import { Component, inject } from '@angular/core';
import { CustomerService } from '../../services/service/customer/customer.service';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../services/service/session/session.service';
import { Router } from '@angular/router';
import { CartService } from '../../services/service/cart/cart.service';

export interface Customer {
  id: number;
  email: string;
  name: string;
}

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent {

  customers : Customer[] = [];
  selectedCustomer: Customer | null = null;

  private customerService : CustomerService = inject(CustomerService);
  private sessionService : SessionService = inject(SessionService);
  private router : Router = inject(Router);
  private cartService : CartService = inject(CartService);

  async ngOnInit() {
    const customersRaw = await this.customerService.getAllCustomers();
    if (!customersRaw) {
      console.error('Failed to load customers');
      return;
    }

    this.customers = customersRaw.map((customer: any) => ({
      id: customer.id[0],
      email: customer.email[0],
      name: customer.firstname[0] + ' ' + customer.lastname[0]
    }));
  }

  selectCustomer(customer: Customer | null): void {
    this.selectedCustomer = customer;
  }

  confirmSelection(): void {
    if (this.selectedCustomer) {
      this.sessionService.setCustomerData(this.selectedCustomer);
      console.log('Client sélectionné:', this.selectedCustomer.email);
    } else {
      console.log('Utilisateur Anonyme confirmé');
    }

    this.router.navigate(['/products']);
  }

}
