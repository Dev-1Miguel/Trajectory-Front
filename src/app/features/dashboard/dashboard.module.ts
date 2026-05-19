import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { FinanceAlertComponent } from './components/finance-alert/finance-alert.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { MonthlySummaryComponent } from './components/monthly-summary/monthly-summary.component';
import { MovementsListComponent } from './components/movements-list/movements-list.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';

@NgModule({
  declarations: [
    CategoryChartComponent,
    DashboardPageComponent,
    FinanceAlertComponent,
    MetricCardComponent,
    MonthlySummaryComponent,
    MovementsListComponent,
  ],
  imports: [CommonModule, IonicModule, DashboardRoutingModule],
})
export class DashboardModule {}
