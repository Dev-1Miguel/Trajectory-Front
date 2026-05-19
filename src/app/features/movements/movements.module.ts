import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MovementBoardComponent } from './components/movement-board/movement-board.component';
import { MovementFormComponent } from './components/movement-form/movement-form.component';
import { MovementWorkbenchComponent } from './components/movement-workbench/movement-workbench.component';
import { MovementsRoutingModule } from './movements-routing.module';
import { MovementsPage } from './pages/movements-shell/movements.page';
import { MovementsPageComponent } from './pages/movements-page/movements-page.component';

@NgModule({
  declarations: [
    MovementBoardComponent,
    MovementFormComponent,
    MovementWorkbenchComponent,
    MovementsPage,
    MovementsPageComponent,
  ],
  imports: [CommonModule, IonicModule, ReactiveFormsModule, MovementsRoutingModule],
})
export class MovementsModule {}
