import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PersonalInfoPageComponent } from './pages/personal-info-page/personal-info-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'informacion-personal',
    pathMatch: 'full',
  },
  {
    path: 'informacion-personal',
    component: PersonalInfoPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileRoutingModule {}
