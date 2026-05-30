import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(
        (m) => m.DashboardModule,
      ),
  },
  {
    path: 'inicio',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'movimientos',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/movements/movements.module').then(
        (m) => m.MovementsModule,
      ),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then(
        (m) => m.ProfileModule,
      ),
  },
  {
    path: 'cuentas',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'reportes',
    redirectTo: 'home',
    pathMatch: 'full',
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
