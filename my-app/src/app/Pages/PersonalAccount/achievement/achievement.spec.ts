import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Achievement } from './achievement';

describe('Achievement', () => {
  let component: Achievement;
  let fixture: ComponentFixture<Achievement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Achievement],
    }).compileComponents();

    fixture = TestBed.createComponent(Achievement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
