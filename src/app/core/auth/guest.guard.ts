import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validarSesionActiva().pipe(
    map((sesionValida) =>
      sesionValida ? router.createUrlTree(['/home']) : true,
    ),
  );
};
