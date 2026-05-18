import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryStockListComponent } from './category-stock-list.component';

describe('CategoryStockListComponent', () => {
  let component: CategoryStockListComponent;
  let fixture: ComponentFixture<CategoryStockListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryStockListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryStockListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
