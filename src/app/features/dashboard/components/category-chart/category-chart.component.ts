import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { CategoryExpense, ExpenseCategory } from '../../models/dashboard.models';

interface DonutLabel {
  value: string;
  percentage: number;
  left: number;
  top: number;
  visible: boolean;
}

const DONUT_LABEL_RADIUS = 41;
const MIN_LABEL_PERCENTAGE = 5;
const MIN_LABEL_DISTANCE = 18;

@Component({
  selector: 'app-category-chart',
  templateUrl: './category-chart.component.html',
  styleUrls: ['./category-chart.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChartComponent {
  @Input({ required: true }) categories: CategoryExpense[] = [];
  @Input({ required: true }) expenseCategories: ExpenseCategory[] = [];

  get donutLabels(): DonutLabel[] {
    let progress = 0;

    const labels = this.categories.map((category, index) => {
      const percentage = Math.max(category.percentage, 0);
      const midpoint = progress + percentage / 2;
      const angle = (midpoint / 100) * Math.PI * 2;
      const label: DonutLabel & { index: number } = {
        index,
        value: `${category.percentage}%`,
        percentage,
        left: 50 + Math.sin(angle) * DONUT_LABEL_RADIUS,
        top: 50 - Math.cos(angle) * DONUT_LABEL_RADIUS,
        visible: false,
      };

      progress += percentage;

      return label;
    });
    const visibleLabels: DonutLabel[] = [];

    labels
      .filter((label) => label.percentage >= MIN_LABEL_PERCENTAGE)
      .sort((left, right) => right.percentage - left.percentage)
      .forEach((label) => {
        const overlaps = visibleLabels.some(
          (visibleLabel) =>
            Math.hypot(
              visibleLabel.left - label.left,
              visibleLabel.top - label.top,
            ) < MIN_LABEL_DISTANCE,
        );

        label.visible = !overlaps;

        if (label.visible) {
          visibleLabels.push(label);
        }
      });

    return labels.sort((left, right) => left.index - right.index);
  }

  get chartBackground(): string {
    if (
      this.categories.length === 0 ||
      this.categories.every((category) => category.percentage <= 0)
    ) {
      return '#e4e8f0';
    }

    let progress = 0;

    const segments = this.categories.map((category) => {
      const start = progress;
      progress += category.percentage;
      return `${category.color} ${start}% ${progress}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }
}
