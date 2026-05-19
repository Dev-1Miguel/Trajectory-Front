import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { DashboardSidebarComponent } from './components/dashboard-sidebar/dashboard-sidebar.component';

@NgModule({
  declarations: [DashboardSidebarComponent],
  exports: [DashboardSidebarComponent],
  imports: [CommonModule, IonicModule, RouterModule],
})
export class SharedModule {}
