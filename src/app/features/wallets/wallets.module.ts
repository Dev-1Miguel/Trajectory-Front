import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { WalletsRoutingModule } from './wallets-routing.module';
import { WalletsPage } from './wallets.page';

@NgModule({
  declarations: [WalletsPage],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    WalletsRoutingModule,
  ],
})
export class WalletsModule {}
