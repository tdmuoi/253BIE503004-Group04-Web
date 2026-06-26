import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSupport } from './customer-support';

describe('CustomerSupport', () => {
  let component: CustomerSupport;
  let fixture: ComponentFixture<CustomerSupport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSupport],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSupport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
