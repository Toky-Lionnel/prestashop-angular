import { TestBed } from '@angular/core/testing';

import { ReinitialisationService } from './reinitialisation.service';

describe('ReinitialisationService', () => {
  let service: ReinitialisationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReinitialisationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
