import { Component, OnInit, inject, ChangeDetectionStrategy, signal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { StatsService } from '../../data/services/stats.service';
import { OilStatistics, CriticalWear, PumpHealth, PumpDetails } from '../../data/interfaces/stats.interface';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, BarElement, BarController, DoughnutController, RadialLinearScale, RadarController, LineElement, Filler } from 'chart.js';
import { Chart } from 'chart.js';

ChartJS.register(
  ArcElement,
  DoughnutController,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  RadialLinearScale,
  RadarController,
  LineElement,
  Filler   
);

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './stats-page.html',
  styleUrl: './stats-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsPage implements OnInit, AfterViewInit {
  private statsService = inject(StatsService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('pumpChart') pumpChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pumpDetailsChart') pumpDetailsChartRef!: ElementRef<HTMLCanvasElement>;

  statistics = signal<OilStatistics | null>(null);
  criticalWear = signal<CriticalWear[]>([]);
  pumpsHealth = signal<PumpHealth[]>([]);

  // Цветовая палитра для всех статусов (от критичного к нормальному)
  readonly COLOR_MAP = {
    'Критическое': { main: '#ff4444', light: 'rgba(255, 68, 68, 0.6)' },
    'Предельное': { main: '#ff9800', light: 'rgba(255, 152, 0, 0.6)' },
    'Удовлетворительное': { main: '#d9ff00ff', light: 'rgba(217, 255, 0, 0.6)' },
    'Нормальное': { main: '#00d4aa', light: 'rgba(0, 212, 170, 0.6)' }
  };

  // Порядок критичности статусов (для сортировки)
  readonly CRITICALITY_ORDER = {
    'Критическое': 0,
    'Предельное': 1,
    'Удовлетворительное': 2,
    'Нормальное': 3
  };

  statusChartData = signal<any>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 2
    }]
  });

  statusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
          font: { size: 13 }
        }
      }
    }
  };

  criticalChartData = signal<any>({
    labels: [],
    datasets: [
      {
        label: 'Износ (мг/л)',
        data: [],
        backgroundColor: '#e68159',
        borderColor: '#a84a2f',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Часы работы',
        data: [],
        backgroundColor: '#32b8c6',
        borderColor: '#208094',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  });

  criticalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: { size: 13 }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Износ',
          color: '#fff'
        },
        ticks: {
          color: '#fff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Часы работы',
          color: '#fff'
        },
        ticks: {
          color: '#aaa'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  private pumpChart: Chart | null = null;
  private pumpDetailsChart: Chart | null = null;

  ngOnInit() {
    this.loadStatistics();
    this.loadPumpsHealth();
    this.loadPumpDetails();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
    this.checkAndInitChart();
  }

  loadStatistics() {
    this.statsService.getOilStatistics().subscribe({
      next: (data) => {
        this.statistics.set(data);
        this.updateStatusChart(data);
      },
      error: (error) => console.error('Ошибка статистики:', error)
    });

    this.statsService.getCriticalWear().subscribe({
      next: (data) => {
        this.criticalWear.set(data);
        this.updateCriticalChart(data);
      },
      error: (error) => console.error('Ошибка критических масел:', error)
    });
  }

  loadPumpsHealth() {
    this.statsService.getPumpsHealth().subscribe({
      next: (data) => {
        this.pumpsHealth.set(data);
        this.cdr.markForCheck();
        setTimeout(() => this.checkAndInitChart(), 100);
      },
      error: (error) => console.error('Ошибка загрузки данных насосов:', error)
    });
  }

  loadPumpDetails() {
    this.statsService.getPumpDetails().subscribe({
      next: (data) => {
        setTimeout(() => this.initPumpDetailsChart(data), 150);
      },
      error: (error) => console.error('Ошибка деталей насоса:', error)
    });
  }

  private checkAndInitChart() {
    if (!this.pumpChartRef?.nativeElement) {
      console.warn('Canvas элемент еще не готов, пытаемся снова...');
      setTimeout(() => this.checkAndInitChart(), 200);
      return;
    }

    const data = this.pumpsHealth();
    if (data && data.length > 0) {
      this.initPumpChart(data);
    }
  }

  private initPumpChart(pumpsData: PumpHealth[]) {
    const defaultColor = { main: '#32b8c6', light: 'rgba(50, 184, 198, 0.6)' };

    // Всегда сортируем по критичности
    const sortedData = this.sortByCriticality(pumpsData);

    const labels = sortedData.map(p => `Насос ${p.id}`);
    const hoursData = sortedData.map(p => p.operatingHours);
    const cyclesData = sortedData.map(p => p.startStopCycles);

    const colors = sortedData.map(p => {
      const color = this.COLOR_MAP[p.oilStatus as keyof typeof this.COLOR_MAP];
      return color ? color.main : defaultColor.main;
    });

    const colorsLight = sortedData.map(p => {
      const color = this.COLOR_MAP[p.oilStatus as keyof typeof this.COLOR_MAP];
      return color ? color.light : defaultColor.light;
    });

    if (this.pumpChart) {
      this.pumpChart.destroy();
    }

    const ctx = this.pumpChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Canvas context не получен');
      return;
    }

    this.pumpChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Часы работы',
            data: hoursData,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 20
          },
          {
            label: 'Циклы пуск-стоп',
            data: cyclesData,
            backgroundColor: colorsLight,
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 20
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#fff',
              padding: 20,
              usePointStyle: true,
              pointStyle: 'rect'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#32b8c6',
            bodyColor: '#fff',
            borderColor: '#32b8c6',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              afterLabel: (context: any) => {
                const pump = sortedData[context.dataIndex];
                return `Статус: ${pump.oilStatus}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              drawTicks: true
            },
            ticks: {
              color: '#aaa',
              font: { size: 12 }
            },
            title: {
              display: true,
              text: 'Значение (часы / циклы)',
              color: '#32b8c6',
              font: { size: 13, weight: 'bold' }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#fff',
              font: { size: 14, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  private initPumpDetailsChart(pumps: PumpDetails[]) {
  const statusColors = [
    this.COLOR_MAP['Критическое'].main,
    this.COLOR_MAP['Предельное'].main,
    this.COLOR_MAP['Удовлетворительное'].main,
    this.COLOR_MAP['Нормальное'].main
  ];

  // Конфиг каждой оси
  const axisConfigs = [
    { min: 20, max: 120 },      // Температура
    { min: 0, max: 20 },        // Вибрация
    { min: 0, max: 5 }      // Загрязнение
  ];

  const datasets = pumps.map((pump, index) => {
    const statusValue = this.getStatusValue(pump.oilStatus);
    const color = statusColors[index % statusColors.length];
    
    // Нормализуем значения к диапазону [0, 100]
    const normalizedData = [
      ((pump.oilTemperature - axisConfigs[0].min) / (axisConfigs[0].max - axisConfigs[0].min)) * 100,
      ((pump.vibration - axisConfigs[1].min) / (axisConfigs[1].max - axisConfigs[1].min)) * 100,
      ((pump.oilContamination - axisConfigs[2].min) / (axisConfigs[2].max - axisConfigs[2].min)) * 100,
      
    ];

    return {
      label: `Насос ${pump.pumpId}`,
      data: normalizedData,
      borderColor: color,
      backgroundColor: `rgba(${this.hexToRgb(color)}, 0.2)`,
      borderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true 
    };
  });

  if (this.pumpDetailsChart) {
    this.pumpDetailsChart.destroy();
  }

  const ctx = this.pumpDetailsChartRef?.nativeElement?.getContext('2d');
  if (!ctx) {
    console.warn('Canvas для деталей не готов');
    return;
  }

  this.pumpDetailsChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Температура (°C)', 'Вибрация (мм/с)', 'Загрязнение (мкм)'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#fff',
            font: { size: 13 }
          }
        },
        filler:{
          propagate: true
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            display : false,
            callback: (value: any) => {
              return value; // Показываем процент 0-100
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

  private getStatusValue(status: string): number {
    const statusMap: Record<string, number> = {
      'Критическое': 0,
      'Предельное': 33,
      'Удовлетворительное': 66,
      'Нормальное': 100
    };
    return statusMap[status] || 50;
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '100, 100, 100';
  }

  // Сортировка по критичности (от критичного к нормальному)
  private sortByCriticality(data: PumpHealth[]): PumpHealth[] {
    return [...data].sort((a, b) => {
      const orderA = this.CRITICALITY_ORDER[a.oilStatus as keyof typeof this.CRITICALITY_ORDER] ?? 999;
      const orderB = this.CRITICALITY_ORDER[b.oilStatus as keyof typeof this.CRITICALITY_ORDER] ?? 999;
      return orderA - orderB;
    });
  }

  private updateStatusChart(stats: OilStatistics) {
    this.statusChartData.set({
      labels: ['Нормальное', 'Требует внимания'],
      datasets: [{
        data: [stats.normalOils, stats.warningOils],
        backgroundColor: [
          this.COLOR_MAP['Нормальное'].main,
          this.COLOR_MAP['Предельное'].main
        ],
        borderColor: [
          this.COLOR_MAP['Нормальное'].main,
          this.COLOR_MAP['Предельное'].main
        ],
        borderWidth: 2
      }]
    });
  }

  private updateCriticalChart(data: CriticalWear[]) {
    if (data.length === 0) return;

    const sorted = data.sort((a, b) => a.id - b.id);

    this.criticalChartData.set({
      labels: sorted.map(item => `Масло №${item.id}`),
      datasets: [
        {
          label: 'Износ (мг/л)',
          data: sorted.map(item => item.wear),
          backgroundColor: this.COLOR_MAP['Предельное'].main,
          borderColor: this.COLOR_MAP['Предельное'].main,
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Часы работы',
          data: sorted.map(item => item.operatingHours),
          backgroundColor: this.COLOR_MAP['Нормальное'].main,
          borderColor: this.COLOR_MAP['Нормальное'].main,
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    });
  }
}