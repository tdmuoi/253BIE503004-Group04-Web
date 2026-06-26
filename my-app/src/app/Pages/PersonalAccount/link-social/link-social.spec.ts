import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkSocial } from './link-social';

describe('LinkSocial', () => {
  let component: LinkSocial;
  let fixture: ComponentFixture<LinkSocial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkSocial],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkSocial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
