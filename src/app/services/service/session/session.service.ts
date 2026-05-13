import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private userData: any = null;
  private customerData: any = null;

  constructor() {
    const stored = localStorage.getItem('userData');
    if (stored) {
      this.userData = JSON.parse(stored);
    }
  }

  setCustomer(customer: any) {
    this.customerData = {
      id : customer.id[0],
      email: customer.email[0],
    };
    localStorage.setItem('customerData', JSON.stringify(this.customerData));
  }

  getCustomer() {
    return this.customerData;
  }

  clearCustomer() {
    this.customerData = null;
    localStorage.removeItem('customerData');
  }

  setUser(email: any) {
    this.userData = {
      email: email
    };
    localStorage.setItem('userData', JSON.stringify(this.userData));
  }

  getUser() {
    return this.userData;
  }

  getToken() {
    return this.userData?.token;
  }

  clear() {
    this.userData = null;
    localStorage.removeItem('userData');
  }

  isLoggedIn(): boolean {
    return !!this.userData;
  }
}
