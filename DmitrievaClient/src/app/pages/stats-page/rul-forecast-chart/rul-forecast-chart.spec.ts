import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulForecastChart } from './rul-forecast-chart';

describe('RulForecastChart', () => {
  let component: RulForecastChart;
  let fixture: ComponentFixture<RulForecastChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulForecastChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RulForecastChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
