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
      // 1. ЗАПУСКАЕМ ЗАПРОСЫ ПАРАЛЛЕЛЬНО
      // Запрос графика для каждого насоса
      const dataPromises = this.pumpIds.map(id =>
        firstValueFrom(this.statsService.getForecastWithFact(id))
      );
      // Запрос результатов RUL (один раз на все насосы)
      const rulResultsPromise = firstValueFrom(this.statsService.getRulResults());

      // Ждем завершения обоих типов запросов
      const [allChartData, allRulResults] = await Promise.all([
        Promise.all(dataPromises),
        rulResultsPromise
      ]);

      // 2. СОЗДАЁМ СЛОВАРЬ ДЛЯ БЫСТРОГО ПОИСКА (PumpId -> Данные RUL)
      // Используем Map для быстрого доступа O(1)
      const rulMap = new Map<number, any>();
      if (allRulResults && Array.isArray(allRulResults)) {
        allRulResults.forEach((res: any) => {
          // Убедитесь, что поле называется planReplaceDate в ответе API
          if (res.planReplaceDate) {
            rulMap.set(res.pumpId, res);
          }
        });
      }

      // Фильтруем пустые данные графика
      const validData = allChartData.filter(d => d.factPoints.length > 0 || d.forecastPoints.length > 0);
      if (validData.length === 0) return;

      // ===================== ГЛОБАЛЬНЫЕ ДАТЫ =====================
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

      // ===================== ПЛАНОВЫЕ ДАТЫ (ИЗ ВТОРОГО ЭНДПОИНТА) =====================
      const plannedDatesMap = new Map<number, Date>();

      for (const data of validData) {
        // Берем данные RUL для конкретного насоса из нашей Map
        const rulInfo = rulMap.get(data.pumpId);
        
        if (rulInfo && rulInfo.planReplaceDate) {
          const plannedDate = new Date(rulInfo.planReplaceDate);
          if (!isNaN(plannedDate.getTime())) {
            plannedDatesMap.set(data.pumpId, plannedDate);
          }
        }
      }

      // Для отрисовки берем самую раннюю плановую дату
      const earliestPlannedDate = plannedDatesMap.size > 0
        ? new Date(Math.min(...Array.from(plannedDatesMap.values()).map(d => d.getTime())))
        : new Date(maxDateFromData.getTime() + 30 * 24 * 60 * 60 * 1000);

      const maxDate = new Date(
        Math.max(
          maxDateFromData.getTime(),
          earliestPlannedDate.getTime()
        )
      );

      // ===================== ПЛАГИНЫ И РИСОВАНИЕ =====================
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

        // Dataset: факт
        datasets.push({
          label: `Насос ${data.pumpId}`,
          data: factChartData,
          borderColor: this.getColor(data.pumpId),
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: this.getColor(data.pumpId)
        });

        // Dataset: прогноз
        datasets.push({
          label: '',
          data: forecastChartData,
          borderColor: this.getColor(data.pumpId),
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0
        });

        // Плагин: линия прогнозной замены (RUL Warning)
        plugins.push({
          id: `rul-${data.pumpId}`,
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales['x'];
            const yAxis = chart.scales['y'];

            const x = xAxis.getPixelForValue(rulDate.getTime());

            if (!isNaN(x) && x >= xAxis.left && x <= xAxis.right) {
              ctx.strokeStyle = this.getColor(data.pumpId);
              ctx.setLineDash([5, 5]);
              ctx.lineWidth = 2;
              ctx.globalAlpha = 0.8;
              ctx.beginPath();
              ctx.moveTo(x, yAxis.top);
              ctx.lineTo(x, yAxis.bottom);
              ctx.stroke();
              ctx.globalAlpha = 1.0;

              ctx.save();
              ctx.translate(x, yAxis.top + 20);
              ctx.rotate(-Math.PI / 4);
              ctx.fillStyle = this.getColor(data.pumpId);
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              const dateStr = rulDate.toLocaleDateString('ru-RU', { 
                month: 'short', 
                year: 'numeric' 
              });
              ctx.restore();
            }
          }
        });

        // Плагин: линия плановой замены (ИЗ DRUGOGO ENDPOINT)
        const plannedDate = plannedDatesMap.get(data.pumpId);
        if (plannedDate) {
          plugins.push({
            id: `planned-${data.pumpId}`,
            afterDraw: (chart) => {
              const ctx = chart.ctx;
              const xAxis = chart.scales['x'];
              const yAxis = chart.scales['y'];

              const x = xAxis.getPixelForValue(plannedDate.getTime());

              if (!isNaN(x) && x >= xAxis.left && x <= xAxis.right) {
                ctx.strokeStyle  = '#ffffff';
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
              }
            }
          });
        }
      }

      // Легенда
      if (plannedDatesMap.size > 0) {
        datasets.push({
          label: 'Плановая замена ',
          data: [[earliestPlannedDate.toISOString(), 0]],
          borderColor: '#888',
          borderDash: [3, 3],
          pointRadius: 0,
          borderWidth: 1.5
        });
      }
      
      datasets.push({
        label: 'Прогноз',
        data: [[earliestPlannedDate.toISOString(), 0]],
        borderColor: '#ff9800',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2
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
            },
            tooltip: {
              mode: 'index',
              intersect: false
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
      console.error('Error rendering RUL chart:', e);
    }
  }
  private getColor(id: number): string {
    const colors = ['#32b8c6', '#ff9800', '#ff4444', '#00d4aa', '#a855f7', '#e91e63'];
    return colors[id % colors.length];
  }
}