import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { StatsService } from '../../data/services/stats.service';
import { OilStatistics, CriticalWear } from '../../data/interfaces/stats.interface';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, BarElement, BarController, DoughnutController } from 'chart.js';

ChartJS.register(
  ArcElement,
  DoughnutController,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement
);

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './stats-page.html',
  styleUrl: './stats-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsPage implements OnInit {
  private statsService = inject(StatsService);

  statistics = signal<OilStatistics | null>(null);
  criticalWear = signal<CriticalWear[]>([]);

  statusChartData = signal<any>({
    labels: ['Нормально', 'Предупреждение', 'Критично'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#32b8c6', '#e68159', '#c0152f'],
      borderColor: ['#208094', '#a84a2f', '#90101f'],
      borderWidth: 2
    }]
  });

  statusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
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
        borderWidth: 1
      },
      {
        label: 'Часы работы',
        data: [],
        backgroundColor: '#32b8c6',
        borderColor: '#208094',
        borderWidth: 1
      }
    ]
  });

  criticalChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Износ'
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Часы работы'
      },
      grid: {
        drawOnChartArea: false  
      }
    }
  }
};


  ngOnInit() {
    this.loadStatistics();
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


  private updateStatusChart(stats: OilStatistics) {
    const critical = stats.totalOils - stats.normalOils - stats.warningOils;
    this.statusChartData.set({
      labels: ['Нормально', 'Предупреждение', 'Критично'],
      datasets: [{
        data: [stats.normalOils, stats.warningOils, critical],
        backgroundColor: ['#32b8c6', '#e68159', '#c0152f'],
        borderColor: ['#208094', '#a84a2f', '#90101f'],
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
        backgroundColor: '#e68159',
        borderColor: '#a84a2f',
        borderWidth: 1,
        yAxisID: 'y' 
      },
      {
        label: 'Часы работы',
        data: sorted.map(item => item.operatingHours),
        backgroundColor: '#32b8c6',
        borderColor: '#208094',
        borderWidth: 1,
        yAxisID: 'y1'  
      }
    ]
  });
}

}
