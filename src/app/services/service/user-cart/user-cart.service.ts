import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CartService } from '../cart/cart.service';
import { buildUserCartXML } from '../../../models/cart.model';

export interface CartItem {
  productId: number;
  attributeId: number;
  productNameWithAttribute: string;
  quantity: number;
  image : string | null;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserCartService {

  private readonly STORAGE_KEY = 'cart';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private cartService : CartService = inject(CartService);

  cart$ = this.cartSubject.asObservable();
  totalPrice$ = this.cart$.pipe(
    map((items: CartItem[]) => items.reduce((acc : number, item : CartItem) => acc + (item.price * item.quantity), 0))
  );
  totalItems$ = this.cart$.pipe(
    map((items: CartItem[]) => items.reduce((acc : number, item : CartItem) => acc + item.quantity, 0))
  );

  constructor() {
    this.loadCart();
  }

  public getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  private loadCart(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);

    if (raw) {
      const cart = JSON.parse(raw);
      this.cartSubject.next(cart);
    }
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(cart)
    );
  }

  public clearCart(): void {
    this.cartSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }


  async addCartToPrestashop(): Promise<void> {
    const cartItems = this.cartSubject.value;

    if (cartItems.length === 0) {
      return;
    }

    await this.cartService.createCartUser(cartItems);
  }


  addItem(item: CartItem): void {
    const cart = [...this.cartSubject.value];

    const existing = cart.find(
      p => p.productId === item.productId && p.attributeId === item.attributeId
    );

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  clear(): void {
    this.cartSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }


  updateQuantity(productId: number, attributeId: number, delta: number) {
    const cart = [...this.cartSubject.value];
    const item = cart.find(p => p.productId === productId && p.attributeId === attributeId);

    if (item) {
      item.quantity = Math.max(1, item.quantity + delta); // Empêcher < 1
      this.cartSubject.next(cart);
      this.saveCart(cart);
    }
  }

  removeItem(productId: number, attributeId: number) {
    const cart = this.cartSubject.value.filter(
      p => !(p.productId === productId && p.attributeId === attributeId)
    );
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

}
