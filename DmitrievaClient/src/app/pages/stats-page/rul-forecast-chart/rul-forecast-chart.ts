// File: src/app/rul-chart-simple/rul-chart-simple.component.ts
import { Component, Input, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { Chart, Plugin } from 'chart.js';
import { StatsService } from '../../../data/services/stats.service';
import { OilForecastPointDTO } from '../../../data/interfaces/stats.interface';
import { firstValueFrom } from 'rxjs';

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
      // Загружаем данные с помощью firstValueFrom
      const points: OilForecastPointDTO[] = await firstValueFrom(
        this.statsService.getForecastPoints(this.pumpId));
        
      if (!points || points.length === 0) {
        console.warn(`No forecast points for pumpId=${this.pumpId}`);
        return;
      }

      // Сортируем по месяцу (обязательно!)
      points.sort((a, b) => a.month - b.month);

      // Подготавливаем данные для графика
      const months = points.map(p => p.month);
      const tanValues = points.map(p => p.tan);

      // Ограничения (как в Python)
      const WARNING = 1.3;
      const CRITICAL = 1.5;

      // Находим RUL (простой способ)
      const findRul = (values: number[], limit: number) => {
        for (let i = 0; i < values.length; i++) {
          if (values[i] >= limit) return months[i];
        }
        return 60;
      };
      const rulWarning = findRul(tanValues, WARNING);
      const rulCritical = findRul(tanValues, CRITICAL);

      // Кастомный плагин для вертикальных линий и зоны
      const customPlugin: Plugin<'line'> = {
        id: 'rul-lines',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales['x'];
          const yAxis = chart.scales['y'];

          // Зона между WARNING и CRITICAL
          const yWarn = yAxis.getPixelForValue(WARNING);
          const yCrit = yAxis.getPixelForValue(CRITICAL);
          ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
          ctx.fillRect(
            xAxis.left,
            Math.min(yWarn, yCrit),
            xAxis.width,
            Math.abs(yWarn - yCrit)
          );

          // Вертикальная линия WARNING
          const xWarn = xAxis.getPixelForValue(rulWarning);
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(xWarn, yAxis.top);
          ctx.lineTo(xWarn, yAxis.bottom);
          ctx.stroke();

          // Вертикальная линия CRITICAL
          const xCrit = xAxis.getPixelForValue(rulCritical);
          ctx.strokeStyle = '#ff4444';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(xCrit, yAxis.top);
          ctx.lineTo(xCrit, yAxis.bottom);
          ctx.stroke();

          // Горизонтальные линии WARNING/CRITICAL
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
          labels: months,
          datasets: [{
            label: 'TAN (mg KOH/g)',
            data: tanValues,
            borderColor: '#32b8c6',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5], // пунктир — прогноз
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true }
          },
          scales: {
            x: {
              title: { display: true, text: 'Месяцы (от текущего замера)' },
              min: 0,
              max: 60,
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: '#aaa' }
            },
            y: {
              title: { display: true, text: 'TAN' },
              min: 0,
              max: 2.0,
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: '#fff' }
            }
          }
        },
        plugins: [customPlugin]
      });

    } catch (error) {
      console.error('Ошибка при построении графика:', error);
    }
  }
  getForecastPoints(pumpId: number) {
    throw new Error('Method not implemented.');
  }
}