import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategoriesService, CategoryOption } from '../../services/service/categories/categories.service';
import { ProductService } from '../../services/service/product/product.service';
import { StocksService } from '../../services/service/stocks/stocks.service';
import { NavbarFrontComponent } from '../../shared/navbar-front/navbar-front.component';

@Component({
  selector: 'app-remove-stock',
  standalone : true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule,NavbarFrontComponent],
  templateUrl: './remove-stock.component.html',
  styleUrl: './remove-stock.component.scss'
})
export class RemoveStockComponent implements OnInit {

  categories: CategoryOption[] = [];

  private categorieService : CategoriesService = inject(CategoriesService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private productService : ProductService = inject(ProductService);
  private stockService : StocksService = inject(StocksService);

  result : boolean = false;
  nombre_total : number = 0;
  nombre_realise : number = 0;

  produit_total : number = 0;
  produit_realise : number = 0;

  searchForm = this.formBuilder.group({
    quantity : [''],
    categoryId: ['']
  });

  async ngOnInit(): Promise<void> {
     this.categories = await this.categorieService.getAll();
  }

  async onSubmit() {
    const quantity = Number(this.searchForm.value.quantity);
    const categoryId = Number(this.searchForm.value.categoryId);
    await this.removeStockFront(quantity,categoryId);
    this.result = true;
  }


  async removeStockFront (quantity : number , category_id : number) : Promise <any> {
    const idProducts = await this.productService.getProductsByIdCategory(category_id);
    let total = 0;
    let total_realises = 0;

    let produit_total = 0;
    let produit_realise = 0;

    for (const i of idProducts) {
      const product : any = await this.productService.getProductDetailSansImagesById(i) ?? null;
      console.log(`Produits avant mise à jour de stock`);
      console.log(product);


      const stock_available = await this.stockService.getStockQuantity(i);
      const idStock = await this.stockService.getIdStockProductsId(i);

      if (stock_available < quantity) {
        await this.stockService.updateStockWithIdProduct(idStock,i,0);
        total_realises += stock_available;
      } else {
        await this.stockService.updateStockWithIdProduct(idStock,i,stock_available-quantity);
        total_realises += quantity;
        produit_realise +=1;
      }
      total += quantity;

      const productApres : any = await this.productService.getProductDetailSansImagesById(i) ?? null;
      console.log(`Produits après mise à jour de stock`);
      console.log(productApres);

      produit_total += 1;

      console.log("=======================================");
    }

    this.produit_total = produit_total;
    this.produit_realise = produit_realise;

    this.nombre_total = total;
    this.nombre_realise = total_realises;
  }


}
