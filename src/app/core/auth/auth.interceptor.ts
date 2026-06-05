import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();
  const omitirAuthorization =
    request.url.endsWith('/auth/forgot-password') ||
    request.url.endsWith('/auth/login') ||
    request.url.endsWith('/auth/register') ||
    request.url.endsWith('/auth/reset-password');
  const authRequest = token && !omitirAuthorization
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.clearSession();

        if (!router.url.startsWith('/auth/login')) {
          void router.navigateByUrl('/auth/login');
        }
      }

      return throwError(() => error);
    }),
  );
};
