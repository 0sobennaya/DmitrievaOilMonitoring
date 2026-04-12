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

  ngAfterViewInit() {}

  private async loadAndRender() {
    if (this.pumpIds.length === 0) return;

    try {
      // 1. Загружаем данные для всех насосов
      const dataPromises = this.pumpIds.map(id =>
        firstValueFrom(this.statsService.getForecastWithFact(id))
      );
      const allData: RulForecastWithFactDTO[] = await Promise.all(dataPromises);

      const validData = allData.filter(d => d.factPoints.length > 0 || d.forecastPoints.length > 0);
      if (validData.length === 0) return;

      // 2. Рассчитываем самую раннюю плановую дату (для общей линии)
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
      // 🔑 ШАГ: Добавляем ОДИН общий плагин для зоны и горизонтальных линий
      const commonElementsPlugin: Plugin<'line'> = {
        id: 'common-rul-elements',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          const WARNING = 1.3;
          const CRITICAL = 1.5;

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

          // 2. Горизонтальная линия WARNING
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yWarn);
          ctx.lineTo(xAxis.right, yWarn);
          ctx.stroke();

          // 3. Горизонтальная линия CRITICAL
          ctx.strokeStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yCrit);
          ctx.lineTo(xAxis.right, yCrit);
          ctx.stroke();
        }
      };

      const earliestPlannedDate = plannedDates.length > 0
        ? new Date(Math.min(...plannedDates.map(d => d.getTime())))
        : new Date();

      // 3. Генерируем datasets
      const datasets: any[] = [];
      const plugins: Plugin<'line'>[] = [];

      const WARNING = 1.3;
      const CRITICAL = 1.5;

      for (const data of validData) {
        // 🔑 Базовая дата
        let baseDate: Date | null = null;
        if (data.forecastPoints.length > 0 && data.forecastPoints[0].measurementDate) {
          baseDate = new Date(data.forecastPoints[0].measurementDate);
        } else {
          console.warn(`No forecast date for pump ${data.pumpId}, using now`);
          baseDate = new Date();
        }
        if (!baseDate || isNaN(baseDate.getTime())) continue;

        // 🔑 Первая дата масла
        const minMonth = Math.min(
          ...data.factPoints.map(f => f.month),
          ...data.forecastPoints.map(p => p.month)
        );
        const firstFactDate = new Date(baseDate);
        firstFactDate.setMonth(baseDate.getMonth() + minMonth);

        // 🔑 RUL = first_fact_date + 5 лет (для этого насоса)
        const rulDate = new Date(firstFactDate);
        rulDate.setFullYear(rulDate.getFullYear() + 5);

        // 🔑 Данные
        const factChartData = data.factPoints.map(f => {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + f.month);
          return [d.toISOString(), f.tan] as [string, number];
        });

        const forecastChartData = data.forecastPoints.map(p => {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + p.month);
          return [d.toISOString(), p.tan] as [string, number];
        });

        // Датасеты
        datasets.push({
          label: `Насос ${data.pumpId}`,
          data: factChartData,
          borderColor: this.getColor(data.pumpId),
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [],
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: this.getColor(data.pumpId),
          showLine: true
        });
        datasets.push({
          data: forecastChartData,
          label: '',
          borderColor: this.getColor(data.pumpId),
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          showLine: true
        });

        // 🔑 Плагин: вертикальная линия RUL для этого насоса (оранжевая)
        const plugin: Plugin<'line'> = {
          id: `rul-${data.pumpId}`,
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales['x'];
            const yAxis = chart.scales['y'];

            // Вертикальная линия RUL
            const xRul = xAxis.getPixelForValue(rulDate.getTime());
            if (xRul !== undefined && xRul !== null && !isNaN(xRul)) {
              ctx.strokeStyle = this.getColor(data.pumpId);
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.moveTo(xRul, yAxis.top);
              ctx.lineTo(xRul, yAxis.bottom);
              ctx.stroke();
            }
          }
        };
        plugins.push(plugin);
      }

      // 🔑 Добавляем ОДИН датасет для плановой замены (белая пунктирная линия)
      datasets.push({
        label: 'Плановая замена',
        data: [
          [earliestPlannedDate.toISOString(), 0],   // низ
          [earliestPlannedDate.toISOString(), 1.5]  // верх
        ],
        borderColor: '#03ff18',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        showLine: true,
        stepped: false
      });

      // 4. Рисуем график
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
              display: true,
              position: 'top' as const,
              labels: {
                color: '#ffffff',
                font: { size: 13 },
                filter: (item) => !!item.text
              }
            },
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
                displayFormats: { year: 'yyyy' }
              },
              title: { display: true, text: 'Год', color: '#32b8c6' },
              ticks: { color: '#aaa', maxTicksLimit: 10 },
              grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
              title: { display: true, text: 'TAN (mg KOH/g)', color: '#32b8c6', font: { weight: 'bold' } },
              min: -0,
              max: 1.5,
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
        plugins: [...plugins, commonElementsPlugin ]
      });

    } catch (error) {
      console.error('Ошибка при построении графика:', error);
    }
  }

  private getColor(id: number): string {
    const colors = [
      '#32b8c6', '#ff9800', '#ff4444', '#00d4aa', '#a855f7',
      '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#ffc107'
    ];
    return colors[id % colors.length];
  }
}