import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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

import { RegisterPayload } from '../../../../core/auth/auth.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorService } from '../../../../core/http/api-error.service';

type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword';

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
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  feedbackMessage = '';

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.feedbackMessage = '';

    this.authService
      .register(this.crearPayloadRegistro())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.feedbackMessage = 'Cuenta creada correctamente.';
          void this.router.navigate(['/auth/login'], {
            queryParams: { registrado: '1' },
          });
        },
        error: (error: unknown) => {
          this.feedbackMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudo crear la cuenta.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  hasFieldError(fieldName: RegisterField): boolean {
    const control = this.form.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }

  hasPasswordMismatch(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;

    return (
      this.form.hasError('passwordMismatch') &&
      (confirmPassword.dirty || confirmPassword.touched)
    );
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

  getConfirmPasswordError(): string {
    if (this.form.controls.confirmPassword.hasError('required')) {
      return 'Confirma tu contrasena.';
    }

    if (this.hasPasswordMismatch()) {
      return 'Las contrasenas no coinciden.';
    }

    return '';
  }

  private crearPayloadRegistro(): RegisterPayload {
    const value = this.form.getRawValue();

    return {
      nombreCompleto: value.fullName.trim(),
      correo: value.email.trim(),
      password: value.password,
      confirmarPassword: value.confirmPassword,
    };
  }
}
