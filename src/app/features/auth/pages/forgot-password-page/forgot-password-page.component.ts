import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../../../../core/auth/auth.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorService } from '../../../../core/http/api-error.service';

type ForgotPasswordStep = 'email' | 'reset';
type EmailField = 'email';
type ResetField = 'code' | 'password' | 'confirmPassword';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent implements OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly emailForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.formBuilder.group(
    {
      code: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{6}$/),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  step: ForgotPasswordStep = 'email';
  emailLoading = false;
  resetLoading = false;
  feedbackMessage = '';
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  private recoveryEmail = '';
  private redirectTimeoutId?: number;

  ngOnDestroy(): void {
    if (this.redirectTimeoutId !== undefined) {
      window.clearTimeout(this.redirectTimeoutId);
    }
  }

  submitEmail(): void {
    if (this.emailForm.invalid || this.emailLoading) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.controls.email.value.trim();

    this.emailLoading = true;
    this.feedbackMessage = '';
    this.errorMessage = '';

    this.authService
      .forgotPassword(email)
      .pipe(
        finalize(() => {
          this.emailLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.recoveryEmail = email;
          this.feedbackMessage =
            response.mensaje ||
            'Si el correo está registrado, enviaremos un código de recuperación.';
          this.step = 'reset';
          this.resetForm.reset();
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.errorMessage =
            'No se pudo procesar la solicitud. Intenta nuevamente.';
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  submitReset(): void {
    if (this.resetForm.invalid || this.resetLoading) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resetLoading = true;
    this.feedbackMessage = '';
    this.errorMessage = '';

    this.authService
      .resetPassword(this.crearPayloadReset())
      .pipe(
        finalize(() => {
          this.resetLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => this.handlePasswordReset(response),
        error: (error: unknown) => {
          this.errorMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudo restablecer la contraseña.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  backToEmailStep(): void {
    if (this.emailLoading || this.resetLoading) {
      return;
    }

    this.step = 'email';
    this.errorMessage = '';
    this.feedbackMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  hasEmailFieldError(fieldName: EmailField): boolean {
    const control = this.emailForm.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }

  hasResetFieldError(fieldName: ResetField): boolean {
    const control = this.resetForm.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }

  hasPasswordMismatch(): boolean {
    const confirmPassword = this.resetForm.controls.confirmPassword;

    return (
      this.resetForm.hasError('passwordMismatch') &&
      (confirmPassword.dirty || confirmPassword.touched)
    );
  }

  getEmailError(): string {
    const control = this.emailForm.controls.email;

    if (control.hasError('required')) {
      return 'Ingresa tu correo electrónico.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electrónico válido.';
    }

    return '';
  }

  getCodeError(): string {
    const control = this.resetForm.controls.code;

    if (control.hasError('required')) {
      return 'Ingresa el código de recuperación.';
    }

    if (control.hasError('pattern')) {
      return 'El código debe tener 6 dígitos.';
    }

    return '';
  }

  getPasswordError(): string {
    const control = this.resetForm.controls.password;

    if (control.hasError('required')) {
      return 'Ingresa una nueva contraseña.';
    }

    if (control.hasError('minlength')) {
      return 'La nueva contraseña debe tener al menos 8 caracteres.';
    }

    return '';
  }

  getConfirmPasswordError(): string {
    const control = this.resetForm.controls.confirmPassword;

    if (control.hasError('required')) {
      return 'Confirma la nueva contraseña.';
    }

    if (this.hasPasswordMismatch()) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

  private crearPayloadReset(): ResetPasswordPayload {
    const value = this.resetForm.getRawValue();

    return {
      correo: this.recoveryEmail,
      codigo: value.code.trim(),
      passwordNueva: value.password,
      confirmarPasswordNueva: value.confirmPassword,
    };
  }

  private handlePasswordReset(response: ResetPasswordResponse): void {
    this.feedbackMessage =
      response.mensaje || 'Contraseña restablecida correctamente.';
    this.resetForm.reset();

    this.redirectTimeoutId = window.setTimeout(() => {
      void this.router.navigate(['/auth/login'], {
        queryParams: { passwordRestablecida: '1' },
      });
    }, 900);
  }
}
