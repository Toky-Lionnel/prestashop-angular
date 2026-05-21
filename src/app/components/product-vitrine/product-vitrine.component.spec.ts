import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductVitrineComponent } from './product-vitrine.component';

describe('ProductVitrineComponent', () => {
  let component: ProductVitrineComponent;
  let fixture: ComponentFixture<ProductVitrineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductVitrineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductVitrineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
