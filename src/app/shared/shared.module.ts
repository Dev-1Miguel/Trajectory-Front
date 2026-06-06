import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { BottomNavigationComponent } from './components/bottom-navigation/bottom-navigation.component';
import { DashboardSidebarComponent } from './components/dashboard-sidebar/dashboard-sidebar.component';

@NgModule({
  declarations: [BottomNavigationComponent, DashboardSidebarComponent],
  exports: [BottomNavigationComponent, DashboardSidebarComponent],
  imports: [CommonModule, IonicModule, RouterModule],
})
export class SharedModule {}
