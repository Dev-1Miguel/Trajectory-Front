import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PersonalInfoPageComponent } from './pages/personal-info-page/personal-info-page.component';
import { SecurityPageComponent } from './pages/security-page/security-page.component';

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
  {
    path: 'seguridad',
    component: SecurityPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileRoutingModule {}
