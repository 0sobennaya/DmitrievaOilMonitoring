import { Component, Input, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { Chart, Plugin } from 'chart.js';
import { StatsService } from '../../../data/services/stats.service';
import { OilForecastPointDTO, RulForecastWithFactDTO } from '../../../data/interfaces/stats.interface';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-rul-chart-simple',
  template: `<canvas #chartCanvas></canvas>`,
  standalone: true
})
export class RulChartSimpleComponent implements AfterViewInit {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() pumpId!: number;
  @Input() lastMeasurementDate!: Date;

  private chart: Chart | null = null;
  private statsService = inject(StatsService);

  ngAfterViewInit() {
    this.loadAndRender();
    const lastDate = this.lastMeasurementDate || new Date();
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

      // Сортируем по месяцу (обязательно!)
      const allPoints = [
        ...data.factPoints.map(f => ({ ...f, isFact: true })),
        ...data.forecastPoints.map(p => ({ ...p, isFact: false }))
      ].sort((a, b) => a.month - b.month); // сортировка по месяцу

      // Разделяем данные для Chart.js
      const factMonths = data.factPoints.map(p => p.month);
      const factTanValues = data.factPoints.map(p => p.tan);

      const forecastMonths = data.forecastPoints.map(p => p.month);
      const forecastTanValues = data.forecastPoints.map(p => p.tan);

      // Объединённые массивы для оси X (если нужно отображать всё на одном X)
      const allMonths = allPoints.map(p => p.month);
      const allTanValues = allPoints.map(p => p.tan);

      // Ограничения (как в Python)
      const WARNING = 1.3;
      const CRITICAL = 1.5;

      // Находим RUL (только по прогнозу)
      const findRul = (values: number[], limit: number, points: {month: number, isFact: boolean}[]) => {
        for (let i = 0; i < values.length; i++) {
          if (values[i] >= limit && !points[i].isFact) return points[i].month; // ищем только по прогнозу
        }
        return 60;
      };
      // Передаём forecastPoints, так как RUL ищется только среди прогноза
      const forecastPointsForRul = data.forecastPoints.map(p => ({ month: p.month, isFact: false }));
      const rulWarning = findRul(forecastTanValues, WARNING, forecastPointsForRul);
      const rulCritical = findRul(forecastTanValues, CRITICAL, forecastPointsForRul);

      // Кастомный плагин для всех элементов
      const customPlugin: Plugin<'line'> = {
        id: 'rul-elements',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          // 1. Зона риска (между WARNING и CRITICAL)
          const yWarn = yAxis.getPixelForValue(WARNING);
          const yCrit = yAxis.getPixelForValue(CRITICAL);
          ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
          ctx.fillRect(
            xAxis.left,
            Math.min(yWarn, yCrit),
            xAxis.width,
            Math.abs(yWarn - yCrit)
          );

          // 2. Вертикальная линия RUL WARNING
          const xWarn = xAxis.getPixelForValue(rulWarning);
          if (xWarn !== undefined && xWarn !== null) { // Проверка на валидность
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(xWarn, yAxis.top);
            ctx.lineTo(xWarn, yAxis.bottom);
            ctx.stroke();
          }

          // 3. Вертикальная линия RUL CRITICAL
          const xCrit = xAxis.getPixelForValue(rulCritical);
          if (xCrit !== undefined && xCrit !== null) { // Проверка на валидность
            ctx.strokeStyle = '#ff4444';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xCrit, yAxis.top);
            ctx.lineTo(xCrit, yAxis.bottom);
            ctx.stroke();
          }

          // 4. Горизонтальная линия WARNING
          ctx.strokeStyle = '#ff9800';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yWarn);
          ctx.lineTo(xAxis.right, yWarn);
          ctx.stroke();

          // 5. Горизонтальная линия CRITICAL
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
          labels: allMonths, // <-- Используем объединённые месяцы для оси X
          datasets: [
            // Факт (сплошная линия)
            {
              label: 'Факт',
              data: factTanValues.map((value, index) => ({
                x: factMonths[index],
                y: value
              })),
              borderColor: '#32b8c6',
              backgroundColor: 'transparent',
              borderWidth: 3, // Сделаем линию чуть толще для факта
              borderDash: [], // Сплошная линия
              fill: false,
              tension: 0.4,
              pointRadius: 4, // Показываем точки факта
              pointBackgroundColor: '#32b8c6',
              showLine: true // Рисуем линию
            },
            // Прогноз (пунктирная линия)
            {
              label: 'Прогноз',
              data: forecastTanValues.map((value, index) => ({
                x: forecastMonths[index],
                y: value
              })),
              borderColor: '#32b8c6',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5], // Пунктир
              fill: false,
              tension: 0.4,
              pointRadius: 0, // Скрыли точки прогноза
              showLine: true // Рисуем линию
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top' as const,
              labels: {
                color: '#fff',
                font: { size: 13 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#32b8c6',
              bodyColor: '#fff',
              borderColor: '#32b8c6',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(2) ?? '—'}`
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'Месяцы (от текущего замера)',
                color: '#32b8c6',
                font: { weight: 'bold' }
              },
              min: -12, // Пример: отображаем фактические данные за последние 12 месяцев
              max: 60,
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: '#aaa', font: { size: 12 } }
            },
            y: {
              title: {
                display: true,
                text: 'TAN (mg KOH/g)',
                color: '#32b8c6',
                font: { weight: 'bold' }
              },
              min: 0,
              max: 1.5, // ← Сокращаем до критического значения (CRITICAL = 1.5)
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: {
                color: '#fff',
                font: { size: 12 }
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