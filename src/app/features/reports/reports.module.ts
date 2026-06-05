import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ReportsPageComponent } from './pages/reports-page/reports-page.component';
import { ReportsRoutingModule } from './reports-routing.module';

@NgModule({
  declarations: [ReportsPageComponent],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
  ],
})
export class ReportsModule {}
