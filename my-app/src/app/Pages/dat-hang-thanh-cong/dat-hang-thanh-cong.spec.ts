import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatHangThanhCong } from './dat-hang-thanh-cong';

describe('DatHangThanhCong', () => {
  let component: DatHangThanhCong;
  let fixture: ComponentFixture<DatHangThanhCong>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatHangThanhCong],
    }).compileComponents();

    fixture = TestBed.createComponent(DatHangThanhCong);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
