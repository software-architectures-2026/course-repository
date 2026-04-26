import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleDetail } from './sale-detail';

describe('SaleDetail', () => {
  let component: SaleDetail;
  let fixture: ComponentFixture<SaleDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
