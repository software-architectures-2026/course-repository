import { TestBed } from '@angular/core/testing';

import { Refund } from './refund';

describe('Refund', () => {
  let service: Refund;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Refund);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
