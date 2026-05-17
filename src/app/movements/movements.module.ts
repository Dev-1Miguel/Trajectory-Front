import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { DashboardModule } from '../features/dashboard/dashboard.module';
import { MovementsPageRoutingModule } from './movements-routing.module';
import { MovementsPage } from './movements.page';

@NgModule({
  imports: [CommonModule, IonicModule, DashboardModule, MovementsPageRoutingModule],
  declarations: [MovementsPage],
})
export class MovementsPageModule {}
