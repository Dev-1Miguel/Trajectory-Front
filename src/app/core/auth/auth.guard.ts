import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

const validarAccesoPrivado = (returnUrl: string) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validarSesionActiva().pipe(
    map((sesionValida) =>
      sesionValida
        ? true
        : router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl },
          }),
    ),
  );
};

export const authGuard: CanActivateFn = (_route, state) => {
  return validarAccesoPrivado(state.url);
};

export const authMatchGuard: CanMatchFn = (_route, segments) => {
  const returnUrl = `/${segments.map((segment) => segment.path).join('/')}`;

  return validarAccesoPrivado(returnUrl);
};
