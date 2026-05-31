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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showPassword = false;
  loading = false;
  feedbackMessage = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registrado') === '1') {
      this.feedbackMessage = 'Cuenta creada correctamente. Inicia sesion.';
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.loading = true;
    this.feedbackMessage = '';

    this.authService
      .login(value.email.trim(), value.password)
      .pipe(
        switchMap(() => this.authService.validarSesionActiva()),
        finalize(() => {
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

  notifyPendingRecovery(): void {
    this.feedbackMessage = 'Recuperacion de contrasena preparada para una proxima integracion.';
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
