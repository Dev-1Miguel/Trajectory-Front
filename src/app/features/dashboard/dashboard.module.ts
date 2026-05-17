import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { DashboardPageComponent } from './components/dashboard-page/dashboard-page.component';
import { DashboardSidebarComponent } from './components/dashboard-sidebar/dashboard-sidebar.component';
import { FinanceAlertComponent } from './components/finance-alert/finance-alert.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { MonthlySummaryComponent } from './components/monthly-summary/monthly-summary.component';
import { MovementBoardComponent } from './components/movement-board/movement-board.component';
import { MovementFormComponent } from './components/movement-form/movement-form.component';
import { MovementWorkbenchComponent } from './components/movement-workbench/movement-workbench.component';
import { MovementsPageComponent } from './components/movements-page/movements-page.component';
import { MovementsListComponent } from './components/movements-list/movements-list.component';

@NgModule({
  declarations: [
    CategoryChartComponent,
    DashboardPageComponent,
    DashboardSidebarComponent,
    FinanceAlertComponent,
    MetricCardComponent,
    MovementBoardComponent,
    MovementFormComponent,
    MovementWorkbenchComponent,
    MovementsPageComponent,
    MonthlySummaryComponent,
    MovementsListComponent,
  ],
  exports: [DashboardPageComponent, MovementsPageComponent],
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class DashboardModule {}
