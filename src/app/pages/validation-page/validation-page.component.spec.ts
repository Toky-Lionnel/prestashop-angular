import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationPageComponent } from './validation-page.component';

describe('ValidationPageComponent', () => {
  let component: ValidationPageComponent;
  let fixture: ComponentFixture<ValidationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
