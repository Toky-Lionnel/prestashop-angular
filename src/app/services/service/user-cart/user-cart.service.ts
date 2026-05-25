import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CartService } from '../cart/cart.service';

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
  private readonly CART_ID_KEY = 'cart_id';

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

  public clearCartCommande(): void {
    this.cartSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CART_ID_KEY);
  }

  private getCartId(): number | null {
    const value = localStorage.getItem(this.CART_ID_KEY);
    return value ? Number(value) : null;
  }

  private setCartId(cartId: number): void {
    localStorage.setItem(
      this.CART_ID_KEY,
      cartId.toString()
    );
  }

  async addItem(item: CartItem): Promise<void> {

    const idCustomer : number = this.getCustomerId() ?? 0;

    let cartId = this.getCartId();
    const cart = [...this.cartSubject.value];

    const existing = cart.find( p =>
        p.productId === item.productId &&
        p.attributeId === item.attributeId
    );

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    if (!cartId) {
      cartId = await this.cartService.createCartUser(cart, idCustomer);
      this.setCartId(cartId || -1);
    } else {
      await this.cartService.updateCartUser(cart, cartId, idCustomer);
    }

    this.cartSubject.next(cart);
    this.saveCart(cart);
  }


  clear(): void {
    this.cartSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CART_ID_KEY);
  }


  async updateQuantity(productId: number, attributeId: number, delta: number) {
    const cart = [...this.cartSubject.value];
    const item = cart.find(p => p.productId === productId && p.attributeId === attributeId);

    if (item) {
      item.quantity = Math.max(1, item.quantity + delta); // Empêcher < 1
      this.cartSubject.next(cart);
      this.saveCart(cart);
    }

    const idCustomer : number = this.getCustomerId() ?? 0;
    let cartId = this.getCartId() ?? 0;
    await this.cartService.updateCartUser(cart, cartId, idCustomer);
  }

  removeItem(productId: number, attributeId: number) {
    const cart = this.cartSubject.value.filter(
      p => !(p.productId === productId && p.attributeId === attributeId)
    );
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  private getCustomerId(): number | null {
    const customer = JSON.parse(localStorage.getItem('customerData') || 'null');
    return customer ? customer.id : null;
  }


  setCart(items: CartItem[], id_cart : number): void {
    this.clear();
    this.cartSubject.next(items);
    this.setCartId(id_cart);
    this.saveCart(items);
  }

}
