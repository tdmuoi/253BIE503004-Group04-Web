import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalBookshelf } from './personal-bookshelf';

describe('PersonalBookshelf', () => {
  let component: PersonalBookshelf;
  let fixture: ComponentFixture<PersonalBookshelf>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalBookshelf],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalBookshelf);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
