import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesPage } from './categories.page';

@NgModule({
  declarations: [CategoriesPage],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    CategoriesRoutingModule,
  ],
})
export class CategoriesModule {}
