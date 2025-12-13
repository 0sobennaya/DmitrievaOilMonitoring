import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilCreatePage } from './oil-create-page';

describe('OilCreatePage', () => {
  let component: OilCreatePage;
  let fixture: ComponentFixture<OilCreatePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilCreatePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilCreatePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
