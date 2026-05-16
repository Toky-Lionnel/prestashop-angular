import { TestBed } from '@angular/core/testing';

import { StockFacadeService } from './stock-facade.service';

describe('StockFacadeService', () => {
  let service: StockFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
