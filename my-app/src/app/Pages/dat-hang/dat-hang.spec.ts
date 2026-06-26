import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatHang } from './dat-hang';

describe('DatHang', () => {
  let component: DatHang;
  let fixture: ComponentFixture<DatHang>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatHang],
    }).compileComponents();

    fixture = TestBed.createComponent(DatHang);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
