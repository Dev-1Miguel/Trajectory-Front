import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard, authMatchGuard } from './core/auth/auth.guard';
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
    canMatch: [authMatchGuard],
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
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/movements/movements.module').then(
        (m) => m.MovementsModule,
      ),
  },
  {
    path: 'categorias',
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/categories/categories.module').then(
        (m) => m.CategoriesModule,
      ),
  },
  {
    path: 'billeteras',
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/wallets/wallets.module').then(
        (m) => m.WalletsModule,
      ),
  },
  {
    path: 'perfil',
    canMatch: [authMatchGuard],
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then(
        (m) => m.ProfileModule,
      ),
  },
  {
    path: 'cuentas',
    redirectTo: 'billeteras',
    pathMatch: 'full',
  },
  {
    path: 'reportes',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'auth/login',
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
