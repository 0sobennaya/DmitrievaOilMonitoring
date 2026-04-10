import { Component, Input, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { Chart, Plugin, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { StatsService } from '../../../data/services/stats.service';
import { RulForecastWithFactDTO } from '../../../data/interfaces/stats.interface';
import { firstValueFrom } from 'rxjs';

// Регистрируем всё
Chart.register(...registerables);

@Component({
  selector: 'app-rul-chart-simple',
  template: `<canvas #chartCanvas></canvas>`,
  standalone: true
})
export class RulChartSimpleComponent implements AfterViewInit {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() pumpId!: number;

  private chart: Chart | null = null;
  private statsService = inject(StatsService);

  ngAfterViewInit() {
    this.loadAndRender();
  }

  private async loadAndRender() {
    try {
      const data: RulForecastWithFactDTO = await firstValueFrom(
        this.statsService.getForecastWithFact(this.pumpId)
      );

      if (!data || (data.factPoints.length === 0 && data.forecastPoints.length === 0)) {
        console.warn(`No data for pumpId=${this.pumpId}`);
        return;
      }

      // 🔑 ШАГ 1: Найдём базовую дату (дата для month=0)
      let baseDate: Date | null = null;

      // Сначала ищем точку с month=0 в factPoints
      const zeroPoint = data.factPoints.find(p => p.month === 0);
      if (zeroPoint) {
        // Если в factPoints есть measurementDate — используем его
        if (zeroPoint.measurementDate) {
          baseDate = new Date(zeroPoint.measurementDate);
        } else {
          // Иначе — используем forecastPoints[0].measurementDate
          baseDate = data.forecastPoints.length > 0 ? new Date(data.forecastPoints[0].measurementDate) : new Date();
        }
      } else {
        // Если нет точки с month=0, берём первую точку прогноза
        baseDate = data.forecastPoints.length > 0 ? new Date(data.forecastPoints[0].measurementDate) : new Date();
      }

      // Защита от Invalid Date
      if (!baseDate || isNaN(baseDate.getTime())) {
        console.error('Invalid baseDate, using current date');
        baseDate = new Date();
      }

      // 🔑 ШАГ 2: Генерируем все даты
      const allPoints = [
        ...data.factPoints.map(f => ({
          ...f,
          isFact: true,
          date: new Date(baseDate),
        })),
        ...data.forecastPoints.map(p => ({
          ...p,
          isFact: false,
          date: new Date(baseDate),
        }))
      ].map(point => {
        // Вычисляем дату: baseDate + point.month месяцев
        const d = new Date(point.date);
        d.setMonth(d.getMonth() + point.month);
        return {
          ...point,
          date: d
        };
      }).sort((a, b) => a.month - b.month); // сортировка по месяцу

      // 🔑 ШАГ 3: Подготавливаем данные для Chart.js
      const months = allPoints.map(p => p.month);
      const tanValues = allPoints.map(p => p.tan);

      // Ограничения
      const WARNING = 1.3;
      const CRITICAL = 1.5;

      // Находим RUL (только по прогнозу)
      const findRul = (values: number[], limit: number) => {
        for (let i = 0; i < values.length; i++) {
          if (values[i] >= limit && !allPoints[i].isFact) return allPoints[i].month;
        }
        return 60;
      };
      const rulWarningMonth = findRul(tanValues, WARNING);
      const rulCriticalMonth = findRul(tanValues, CRITICAL);

      // Вычисляем даты для вертикальных линий
      const rulWarningDate = new Date(baseDate);
      rulWarningDate.setMonth(rulWarningDate.getMonth() + rulWarningMonth);
      const rulCriticalDate = new Date(baseDate);
      rulCriticalDate.setMonth(rulCriticalDate.getMonth() + rulCriticalMonth);

      // Кастомный плагин
      const customPlugin: Plugin<'line'> = {
        id: 'rul-elements',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          // Зона риска
          const yWarn = yAxis.getPixelForValue(WARNING);
          const yCrit = yAxis.getPixelForValue(CRITICAL);
          ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
          ctx.fillRect(xAxis.left, Math.min(yWarn, yCrit), xAxis.width, Math.abs(yWarn - yCrit));

          // Вертикальные линии
          const xWarn = xAxis.getPixelForValue(rulWarningDate.getTime());
          const xCrit = xAxis.getPixelForValue(rulCriticalDate.getTime());
          if (xWarn !== undefined && xWarn !== null && !isNaN(xWarn)) {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(xWarn, yAxis.top);
            ctx.lineTo(xWarn, yAxis.bottom);
            ctx.stroke();
          }
          if (xCrit !== undefined && xCrit !== null && !isNaN(xCrit)) {
            ctx.strokeStyle = '#ff4444';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xCrit, yAxis.top);
            ctx.lineTo(xCrit, yAxis.bottom);
            ctx.stroke();
          }

          // Горизонтальные линии
          ctx.strokeStyle = '#ff9800';
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

      const ctx = this.canvasRef.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            // Факт (сплошная линия)
            {
              label: 'Факт',
              data: data.factPoints.map(f => [
                new Date(baseDate).setMonth(baseDate.getMonth() + f.month),
                f.tan
              ]).map(([ts, y]) => [new Date(ts).toISOString(), y]) as any,
              borderColor: '#32b8c6',
              backgroundColor: 'transparent',
              borderWidth: 3,
              borderDash: [],
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#32b8c6',
              showLine: true
            },
            // Прогноз (пунктирная линия)
            {
              label: 'Прогноз',
              data: data.forecastPoints.map(p => [
                new Date(baseDate).setMonth(baseDate.getMonth() + p.month),
                p.tan
              ]).map(([ts, y]) => [new Date(ts).toISOString(), y]) as any,
              borderColor: '#32b8c6',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              showLine: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' as const },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(2) ?? '—'}`
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'year',
                displayFormats: { year: 'yyyy' } // ← Это делает "2025", "2026", ...
              },
              title: { display: true, text: 'Год', color: '#32b8c6' },
              ticks: { color: '#aaa', maxTicksLimit: 10 },
              grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
              title: { display: true, text: 'TAN (mg KOH/g)', color: '#32b8c6', font: { weight: 'bold' } },
              min: 0,
              max: 1.5, // Сокращено до CRITICAL
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: {
                color: '#fff',
                font: { size: 12 },
                callback: (value: number | string) => {
                  const num = Number(value);
                  return isNaN(num) ? '' : num.toFixed(1);
                }
              }
            }
          }
        },
        plugins: [customPlugin]
      });

    } catch (error) {
      console.error('Ошибка при построении графика:', error);
    }
  }
}