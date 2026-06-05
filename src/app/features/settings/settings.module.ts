import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { SettingsRoutingModule } from './settings-routing.module';

@NgModule({
  declarations: [SettingsPageComponent],
  imports: [CommonModule, IonicModule, SettingsRoutingModule],
})
export class SettingsModule {}
