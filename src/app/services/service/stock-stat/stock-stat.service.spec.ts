import { TestBed } from '@angular/core/testing';

import { StockStatService } from './stock-stat.service';

describe('StockStatService', () => {
  let service: StockStatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockStatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
