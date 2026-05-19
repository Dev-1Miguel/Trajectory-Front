import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MovementsPage } from './pages/movements-shell/movements.page';

const routes: Routes = [
  {
    path: '',
    component: MovementsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MovementsRoutingModule {}
