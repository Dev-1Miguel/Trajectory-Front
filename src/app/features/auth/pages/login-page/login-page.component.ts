import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorService } from '../../../../core/http/api-error.service';
import { WalletStateService } from '../../../wallets/services/wallet-state.service';

type LoginField = 'email' | 'password';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly walletStateService = inject(WalletStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showPassword = false;
  loading = false;
  showSlowLoginMessage = false;
  feedbackMessage = '';
  private slowLoginTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === '1') {
      this.feedbackMessage = 'Tu sesión finalizó por inactividad.';
      return;
    }

    if (this.route.snapshot.queryParamMap.get('registrado') === '1') {
      this.feedbackMessage = 'Cuenta creada correctamente. Inicia sesion.';
      return;
    }

    if (this.route.snapshot.queryParamMap.get('passwordActualizada') === '1') {
      this.feedbackMessage =
        'Contrasena actualizada correctamente. Inicia sesion nuevamente.';
      return;
    }

    if (this.route.snapshot.queryParamMap.get('passwordRestablecida') === '1') {
      this.feedbackMessage =
        'Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.';
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.loading = true;
    this.showSlowLoginMessage = false;
    this.feedbackMessage = '';
    this.slowLoginTimeout = setTimeout(() => {
      if (!this.loading) {
        return;
      }

      this.showSlowLoginMessage = true;
      this.changeDetectorRef.markForCheck();
    }, 3000);

    this.authService
      .login(value.email.trim(), value.password)
      .pipe(
        switchMap(() => this.authService.validarSesionActiva()),
        finalize(() => {
          this.clearSlowLoginTimeout();
          this.showSlowLoginMessage = false;
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (sesionValida) => {
          if (!sesionValida) {
            this.feedbackMessage = 'No se pudo validar la sesion.';
            this.changeDetectorRef.markForCheck();
            return;
          }

          this.walletStateService.refreshWallets();
          void this.router.navigateByUrl(this.obtenerRutaPosteriorAlLogin());
        },
        error: (error: unknown) => {
          this.feedbackMessage =
            error instanceof HttpErrorResponse && error.status === 401
              ? 'Correo o contrasena incorrectos.'
              : this.apiErrorService.obtenerMensaje(
                  error,
                  'Correo o contrasena incorrectos.',
                );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  hasFieldError(fieldName: LoginField): boolean {
    const control = this.form.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }

  getEmailError(): string {
    const control = this.form.controls.email;

    if (control.hasError('required')) {
      return 'Ingresa tu correo electronico.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electronico valido.';
    }

    return '';
  }

  private clearSlowLoginTimeout(): void {
    if (!this.slowLoginTimeout) {
      return;
    }

    clearTimeout(this.slowLoginTimeout);
    this.slowLoginTimeout = undefined;
  }

  private obtenerRutaPosteriorAlLogin(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (
      returnUrl?.startsWith('/') &&
      !returnUrl.startsWith('/auth') &&
      !returnUrl.startsWith('//')
    ) {
      return returnUrl;
    }

    return '/home';
  }
}
