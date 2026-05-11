import { TestBed } from '@angular/core/testing';

import { AttributeFacadeService } from './attribute-facade.service';

describe('AttributeFacadeService', () => {
  let service: AttributeFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributeFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
