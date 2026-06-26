import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThanhLi } from './thanh-li';

describe('ThanhLi', () => {
  let component: ThanhLi;
  let fixture: ComponentFixture<ThanhLi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThanhLi],
    }).compileComponents();

    fixture = TestBed.createComponent(ThanhLi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
