// File: src/app/rul-forecast-chart/rul-forecast-chart.ts
import { Component, AfterViewInit, ElementRef, ViewChild, inject, Input } from '@angular/core';
import { Chart, Plugin, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { StatsService } from '../../../data/services/stats.service';
import { RulForecastWithFactDTO } from '../../../data/interfaces/stats.interface';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-rul-chart-simple',
  template: `<canvas #chartCanvas></canvas>`,
  standalone: true
})
export class RulChartSimpleComponent implements AfterViewInit {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private statsService = inject(StatsService);
  private pumpIds: number[] = [];

  @Input() set pumpIdsList(ids: number[]) {
    this.pumpIds = ids;
    if (ids.length > 0) this.loadAndRender();
  }

  @Input() param: 'TAN' | 'WaterContentPct' | 'ImpuritiesPct' | 'FlashPointC' = 'TAN';
  @Input() warning: number = 1.3;
  @Input() critical: number = 1.5;
  @Input() unit: string = 'mg KOH/g';

  ngAfterViewInit() {}

  private async loadAndRender() {
    if (this.pumpIds.length === 0) return;

    try {
      const dataPromises = this.pumpIds.map(id =>
        firstValueFrom(this.statsService.getForecastWithFact(id))
      );
      const allData: RulForecastWithFactDTO[] = await Promise.all(dataPromises);

      const validData = allData.filter(d => d.factPoints.length > 0 || d.forecastPoints.length > 0);
      if (validData.length === 0) return;

      // ===================== 🔑 ГЛОБАЛЬНЫЕ ДАТЫ =====================
      const allDates: number[] = [];

      for (const data of validData) {
        let baseDate = data.forecastPoints[0]?.measurementDate
          ? new Date(data.forecastPoints[0].measurementDate)
          : new Date();

        if (!baseDate || isNaN(baseDate.getTime())) continue;

        const allPoints = [...data.factPoints, ...data.forecastPoints];

        for (const p of allPoints) {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + p.month);
          allDates.push(d.getTime());
        }
      }

      const minDate = new Date(Math.min(...allDates));
      const maxDateFromData = new Date(Math.max(...allDates));

      // ===================== ПЛАНОВЫЕ ДАТЫ =====================
      const plannedDates: Date[] = [];

      for (const data of validData) {
        let baseDate: Date | null = null;

        if (data.forecastPoints.length > 0 && data.forecastPoints[0].measurementDate) {
          baseDate = new Date(data.forecastPoints[0].measurementDate);
        } else {
          baseDate = new Date();
        }

        if (!baseDate || isNaN(baseDate.getTime())) continue;

        const minMonth = Math.min(
          ...data.factPoints.map(f => f.month),
          ...data.forecastPoints.map(p => p.month)
        );

        const firstFactDate = new Date(baseDate);
        firstFactDate.setMonth(baseDate.getMonth() + minMonth);

        const plannedDate = new Date(firstFactDate);
        plannedDate.setFullYear(plannedDate.getFullYear() + 5);

        plannedDates.push(plannedDate);
      }

      const earliestPlannedDate = plannedDates.length > 0
        ? new Date(Math.min(...plannedDates.map(d => d.getTime())))
        : new Date();

      // 🔑 Учитываем плановую замену в общем диапазоне
      const maxDate = new Date(
        Math.max(
          maxDateFromData.getTime(),
          earliestPlannedDate.getTime()
        )
      );

      // ===================== ПЛАГИНЫ =====================
      const commonElementsPlugin: Plugin<'line'> = {
        id: 'common-rul-elements',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          const yWarn = yAxis.getPixelForValue(this.warning);
          const yCrit = yAxis.getPixelForValue(this.critical);

          ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
          ctx.fillRect(xAxis.left, Math.min(yWarn, yCrit), xAxis.width, Math.abs(yWarn - yCrit));

          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yWarn);
          ctx.lineTo(xAxis.right, yWarn);
          ctx.stroke();

          ctx.strokeStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yCrit);
          ctx.lineTo(xAxis.right, yCrit);
          ctx.stroke();
        }
      };

      const datasets: any[] = [];
      const plugins: Plugin<'line'>[] = [];

      for (const data of validData) {
        let baseDate: Date | null = null;

        if (data.forecastPoints.length > 0 && data.forecastPoints[0].measurementDate) {
          baseDate = new Date(data.forecastPoints[0].measurementDate);
        } else {
          baseDate = new Date();
        }

        if (!baseDate || isNaN(baseDate.getTime())) continue;

        const getValue = (p: any): number => {
          switch (this.param) {
            case 'TAN': return p.tan;
            case 'WaterContentPct': return p.waterContentPct;
            case 'ImpuritiesPct': return p.impuritiesPct;
            case 'FlashPointC': return p.flashPointC;
            default: return 0;
          }
        };

        let rulMonth = 60;

        for (const p of data.forecastPoints) {
          const condition = this.param === 'FlashPointC'
            ? getValue(p) <= this.warning
            : getValue(p) >= this.warning;

          if (condition) {
            rulMonth = p.month;
            break;
          }
        }

        const rulDate = new Date(baseDate);
        rulDate.setMonth(baseDate.getMonth() + rulMonth);

        const factChartData = data.factPoints.map(f => {
          const d = new Date(baseDate!);
          d.setMonth(d.getMonth() + f.month);
          return [d.toISOString(), getValue(f)];
        });

        const forecastChartData = data.forecastPoints.map(p => {
          const d = new Date(baseDate!);
          d.setMonth(d.getMonth() + p.month);
          return [d.toISOString(), getValue(p)];
        });

        // факт
        datasets.push({
          label: `Насос ${data.pumpId}`,
          data: factChartData,
          borderColor: this.getColor(data.pumpId),
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4
        });

        // прогноз
        datasets.push({
          label: '',
          data: forecastChartData,
          borderColor: this.getColor(data.pumpId),
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0
        });

        // RUL линия
        plugins.push({
          id: `rul-${data.pumpId}`,
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales['x'];
            const yAxis = chart.scales['y'];

            const x = xAxis.getPixelForValue(rulDate.getTime());

            if (!isNaN(x)) {
              ctx.strokeStyle = this.getColor(data.pumpId);
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.moveTo(x, yAxis.top);
              ctx.lineTo(x, yAxis.bottom);
              ctx.stroke();
            }
          }
        });
      }

      // плановая линия
      plugins.push({
        id: 'planned',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          const x = xAxis.getPixelForValue(earliestPlannedDate.getTime());

          if (!isNaN(x)) {
            ctx.strokeStyle = '#ffffff';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, yAxis.top);
            ctx.lineTo(x, yAxis.bottom);
            ctx.stroke();
          }
        }
      });

      // для легенды
      datasets.push({
        label: 'Плановая замена',
        data: [
          [earliestPlannedDate.toISOString(), 0],
          [earliestPlannedDate.toISOString(), this.critical]
        ],
        borderColor: '#ffffff',
        borderDash: [4, 4],
        pointRadius: 0,
        borderWidth: 1,
        
      });

      const ctx = this.canvasRef.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#fff',
                filter: (item) => !!item.text
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              min: minDate.getTime(),  
              max: maxDate.getTime(),  
              time: {
                unit: 'year',
                displayFormats: { year: 'yyyy' }
              },
              ticks: { color: '#aaa' },
              grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
              min: this.param === 'FlashPointC' ? this.critical : 0,
              max: this.param === 'FlashPointC' ? 230 : this.critical,
              ticks: { color: '#fff' },
              grid: { color: 'rgba(255,255,255,0.1)' }
            }
          }
        },
        plugins: [...plugins, commonElementsPlugin]
      });

    } catch (e) {
      console.error(e);
    }
  }

  private getColor(id: number): string {
    const colors = ['#32b8c6','#ff9800','#ff4444','#00d4aa','#a855f7'];
    return colors[id % colors.length];
  }
}