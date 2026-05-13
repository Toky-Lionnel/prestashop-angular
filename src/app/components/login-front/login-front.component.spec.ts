import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginFrontComponent } from './login-front.component';

describe('LoginFrontComponent', () => {
  let component: LoginFrontComponent;
  let fixture: ComponentFixture<LoginFrontComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFrontComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
