import { TestBed } from '@angular/core/testing';

import { OrderFacadeService } from './order-facade.service';

describe('OrderFacadeService', () => {
  let service: OrderFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
