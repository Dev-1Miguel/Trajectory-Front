import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { CategoryExpense } from '../../models/dashboard.models';

@Component({
  selector: 'app-category-chart',
  templateUrl: './category-chart.component.html',
  styleUrls: ['./category-chart.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChartComponent {
  @Input({ required: true }) categories: CategoryExpense[] = [];

  get chartBackground(): string {
    let progress = 0;

    const segments = this.categories.map((category) => {
      const start = progress;
      progress += category.percentage;
      return `${category.color} ${start}% ${progress}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }
}
