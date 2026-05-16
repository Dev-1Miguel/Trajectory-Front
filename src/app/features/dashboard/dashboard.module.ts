import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { DashboardPageComponent } from './components/dashboard-page/dashboard-page.component';
import { DashboardSidebarComponent } from './components/dashboard-sidebar/dashboard-sidebar.component';
import { FinanceAlertComponent } from './components/finance-alert/finance-alert.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { MonthlySummaryComponent } from './components/monthly-summary/monthly-summary.component';
import { MovementsListComponent } from './components/movements-list/movements-list.component';

@NgModule({
  declarations: [
    CategoryChartComponent,
    DashboardPageComponent,
    DashboardSidebarComponent,
    FinanceAlertComponent,
    MetricCardComponent,
    MonthlySummaryComponent,
    MovementsListComponent,
  ],
  exports: [DashboardPageComponent],
  imports: [CommonModule, IonicModule],
})
export class DashboardModule {}
