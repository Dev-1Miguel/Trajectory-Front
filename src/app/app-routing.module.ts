import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(
        (m) => m.DashboardModule,
      ),
  },
  {
    path: 'movimientos',
    loadChildren: () =>
      import('./features/movements/movements.module').then(
        (m) => m.MovementsModule,
      ),
  },
  {
    path: 'perfil',
    loadChildren: () =>
      import('./features/profile/profile.module').then(
        (m) => m.ProfileModule,
      ),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
