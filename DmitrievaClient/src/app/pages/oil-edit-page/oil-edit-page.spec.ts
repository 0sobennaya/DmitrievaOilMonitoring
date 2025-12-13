import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilEditPage } from './oil-edit-page';

describe('OilEditPage', () => {
  let component: OilEditPage;
  let fixture: ComponentFixture<OilEditPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilEditPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilEditPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
