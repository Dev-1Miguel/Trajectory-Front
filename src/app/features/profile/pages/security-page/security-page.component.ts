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

import {
  CambiarPasswordPayload,
  CambiarPasswordResponse,
} from '../../../../core/auth/auth.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorService } from '../../../../core/http/api-error.service';
import { WalletStateService } from '../../../wallets/services/wallet-state.service';

type SecurityField =
  | 'passwordActual'
  | 'passwordNueva'
  | 'confirmarPasswordNueva';

const passwordChangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const passwordActual = control.get('passwordActual')?.value;
  const passwordNueva = control.get('passwordNueva')?.value;
  const confirmarPasswordNueva = control.get('confirmarPasswordNueva')?.value;
  const errors: ValidationErrors = {};

  if (passwordActual && passwordNueva && passwordActual === passwordNueva) {
    errors['samePassword'] = true;
  }

  if (
    passwordNueva &&
    confirmarPasswordNueva &&
    passwordNueva !== confirmarPasswordNueva
  ) {
    errors['passwordMismatch'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

@Component({
  selector: 'app-security-page',
  templateUrl: './security-page.component.html',
  styleUrls: ['./security-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly walletStateService = inject(WalletStateService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.group(
    {
      passwordActual: ['', Validators.required],
      passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmarPasswordNueva: ['', Validators.required],
    },
    { validators: passwordChangeValidator },
  );

  loading = false;
  feedbackMessage = '';
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.feedbackMessage = '';
    this.errorMessage = '';

    this.authService
      .cambiarPassword(this.crearPayload())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => this.handlePasswordChanged(response),
        error: (error: unknown) => {
          this.errorMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudo actualizar la contrasena.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  hasFieldError(fieldName: SecurityField): boolean {
    const control = this.form.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }

  hasPasswordMismatch(): boolean {
    const control = this.form.controls.confirmarPasswordNueva;

    return (
      this.form.hasError('passwordMismatch') &&
      (control.dirty || control.touched)
    );
  }

  hasSamePassword(): boolean {
    const passwordActual = this.form.controls.passwordActual;
    const passwordNueva = this.form.controls.passwordNueva;

    return (
      this.form.hasError('samePassword') &&
      (passwordActual.dirty ||
        passwordActual.touched ||
        passwordNueva.dirty ||
        passwordNueva.touched)
    );
  }

  getPasswordNuevaError(): string {
    const control = this.form.controls.passwordNueva;

    if (control.hasError('required')) {
      return 'Ingresa una nueva contrasena.';
    }

    if (control.hasError('minlength')) {
      return 'La nueva contrasena debe tener al menos 8 caracteres.';
    }

    if (this.hasSamePassword()) {
      return 'La nueva contrasena debe ser diferente a la actual.';
    }

    return '';
  }

  getConfirmarPasswordNuevaError(): string {
    const control = this.form.controls.confirmarPasswordNueva;

    if (control.hasError('required')) {
      return 'Confirma la nueva contrasena.';
    }

    if (this.hasPasswordMismatch()) {
      return 'Las contrasenas no coinciden.';
    }

    return '';
  }

  private crearPayload(): CambiarPasswordPayload {
    const value = this.form.getRawValue();

    return {
      passwordActual: value.passwordActual,
      passwordNueva: value.passwordNueva,
      confirmarPasswordNueva: value.confirmarPasswordNueva,
    };
  }

  private handlePasswordChanged(response: CambiarPasswordResponse): void {
    this.feedbackMessage =
      response.mensaje || 'Contrasena actualizada correctamente.';
    this.walletStateService.clearActiveWallet();
    this.authService.logout();

    void this.router.navigate(['/auth/login'], {
      queryParams: { passwordActualizada: '1' },
    });
  }
}
