import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputDuplicataComponent } from './input-duplicata.component';

describe('InputDuplicataComponent', () => {
  let component: InputDuplicataComponent;
  let fixture: ComponentFixture<InputDuplicataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputDuplicataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputDuplicataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
