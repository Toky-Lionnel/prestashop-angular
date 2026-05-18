import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProductService } from '../../services/service/product/product.service';
import { CategoriesService, CategoryOption } from '../../services/service/categories/categories.service';
import { VitrineProduct } from '../../models/vitrine-product.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductVitrineComponent } from '../../components/product-vitrine/product-vitrine.component';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../models/OrderModel';
import { OrderService } from '../../services/service/orders/order.service';
import { OrdersComponent } from '../../components/orders/orders.component';
import { SessionService } from '../../services/service/session/session.service';
import { CartService } from '../../services/service/cart/cart.service';
import { LoginFrontComponent } from '../../components/login-front/login-front.component';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {

  productsVitrine: VitrineProduct[] = [];
  categories: CategoryOption[] = [];
  isLoading = true;

  private productService: ProductService = inject(ProductService);
  private categoriesService: CategoriesService = inject(CategoriesService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private userCartService : UserCartService = inject(UserCartService);
  private dialog = inject(MatDialog);
  private router : Router = inject(Router);
  private orderService : OrderService = inject(OrderService);
  private sessionService : SessionService = inject(SessionService);
  private cartService : CartService = inject(CartService);

  private route : ActivatedRoute = inject(ActivatedRoute);
  isAdmin = false;


  cartLength = 0;

  searchForm = this.formBuilder.group({
    name: [''],
    priceMin: [''],
    priceMax: [''],
    categoryId: ['']
  });

  async ngOnInit () {
    this.isAdmin = this.route.snapshot.data['isAdmin'];
    try {
      this.userCartService.cart$.subscribe(cart => {
        this.cartLength = cart.reduce((sum, item) => sum + item.quantity, 0);
      });
      this.categories = await this.categoriesService.getAll();
      await this.loadProducts();
    } finally {
      this.isLoading = false;
    }
  }


  async onSearch() {
    await this.loadProducts();
  }

  onReset(): void {
    this.searchForm.reset({
      name: '',
      priceMin: '',
      priceMax: '',
      categoryId: ''
    });
    void this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    const name = this.normalizeText(this.searchForm.value.name);
    const priceMin = this.toNullableNumber(this.searchForm.value.priceMin);
    const priceMax = this.toNullableNumber(this.searchForm.value.priceMax);
    const categoryId = this.toNullableNumber(this.searchForm.value.categoryId);

    // Backend filters: price range and category (name filter doesn't work on backend)
    const products = await this.productService.getAllVitrineProducts(null, priceMin, priceMax, categoryId);
    const categoryNameById = new Map(this.categories.map((category) => [category.id, category.name]));

    let results = products.map((product) => ({
      ...product,
      categoryName: categoryNameById.get(product.categoryId) ?? 'Sans catégorie'
    }));

    // Frontend filter: name (case-insensitive partial match)
    if (name) {
      results = results.filter((product) =>
        product.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    this.productsVitrine = results;
  }

  private normalizeText(value: string | null | undefined): string | null {
    const trimmed = (value ?? '').trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toNullableNumber(value: string | null | undefined): number | null {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }


  async openProductSheet(product: VitrineProduct) {
    if (this.isAdmin) {
      this.router.navigate(['/admin/add-stock', product.id]);
      return;
    }

    const productDetail = await this.productService.getProductDetailById(product.id);
    this.dialog.open(ProductVitrineComponent, {
      data: productDetail, // On passe l'objet product au composant
      width: '1200px', // Largeur de la popup
      maxWidth: '100vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container' // Optionnel pour du CSS personnalisé
    });
  }

  openCart(): void {
    this.router.navigate(['/cart']);
  }

  showLoginForm () {
      this.dialog.open(LoginFrontComponent, {
        width: '500px',
        data: { redirectUrl: '/products' },
        height : '500px',
      });
  }

  async openOrders(): Promise<void> {
    const idCustomer = this.sessionService.getCustomer()?.id;
    if (!idCustomer) {
      this.showLoginForm();
      return;
    }

    const orders : Order [] = await this.orderService.getOrdersFull(undefined,idCustomer);
    const carts : Order [] = await this.cartService.getCartMapped(idCustomer) || [];
    this.dialog.open(OrdersComponent, {
      width: '1300px',        // Largeur adaptée pour le tableau
      maxWidth: '95vw',      // Sécurité pour le mobile
      maxHeight: '90vh',     // Évite que la modale ne dépasse de l'écran
      data: [...orders, ...carts], // Injection des données dans MAT_DIALOG_DATA
      panelClass: 'custom-dialog-container' // Optionnel : pour du style spécifique
    });
  }

}
