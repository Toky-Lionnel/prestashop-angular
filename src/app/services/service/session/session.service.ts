import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private userData: any = null;

  constructor() {
    const stored = localStorage.getItem('userData');
    if (stored) {
      this.userData = JSON.parse(stored);
    }
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
