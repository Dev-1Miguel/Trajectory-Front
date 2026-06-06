import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
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
  CerrarSesionesResponse,
  ConsultarSesionesResponse,
  SesionActiva,
} from '../../../../core/auth/auth.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorService } from '../../../../core/http/api-error.service';
import { WalletStateService } from '../../../wallets/services/wallet-state.service';

type SecurityField =
  | 'passwordActual'
  | 'passwordNueva'
  | 'confirmarPasswordNueva';

interface SessionViewModel {
  idSesion: string;
  dispositivo: string;
  ip: string;
  fechaInicio: string;
  fechaExpiracion: string;
  estado: string;
  activa: boolean;
  esActual: boolean;
}

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
export class SecurityPageComponent implements OnInit {
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

  showPasswordActual = false;
  showPasswordNueva = false;
  showConfirmarPasswordNueva = false;
  loading = false;
  feedbackMessage = '';
  errorMessage = '';
  sessions: SessionViewModel[] = [];
  selectedSessionIds = new Set<string>();
  sessionsLoading = false;
  sessionsActionLoading = false;
  sessionsFeedbackMessage = '';
  sessionsErrorMessage = '';

  ngOnInit(): void {
    this.loadSessions();
  }

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

  togglePasswordActualVisibility(): void {
    this.showPasswordActual = !this.showPasswordActual;
  }

  togglePasswordNuevaVisibility(): void {
    this.showPasswordNueva = !this.showPasswordNueva;
  }

  toggleConfirmarPasswordNuevaVisibility(): void {
    this.showConfirmarPasswordNueva = !this.showConfirmarPasswordNueva;
  }

  loadSessions(): void {
    this.sessionsLoading = true;
    this.sessionsErrorMessage = '';

    this.authService
      .consultarSesiones()
      .pipe(
        finalize(() => {
          this.sessionsLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => this.handleSessionsLoaded(response),
        error: (error: unknown) => {
          this.sessions = [];
          this.selectedSessionIds.clear();
          this.sessionsErrorMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudieron cargar las sesiones.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  toggleSessionSelection(session: SessionViewModel): void {
    if (session.esActual || this.sessionsActionLoading) {
      return;
    }

    if (this.selectedSessionIds.has(session.idSesion)) {
      this.selectedSessionIds.delete(session.idSesion);
    } else {
      this.selectedSessionIds.add(session.idSesion);
    }
  }

  isSessionSelected(session: SessionViewModel): boolean {
    return this.selectedSessionIds.has(session.idSesion);
  }

  hasCurrentSessionMarker(): boolean {
    return this.sessions.some((session) => session.esActual);
  }

  getSelectedSessionsCount(): number {
    return this.selectedSessionIds.size;
  }

  closeSelectedSessions(): void {
    if (this.selectedSessionIds.size === 0) {
      this.sessionsErrorMessage = 'Selecciona al menos una sesion para cerrar.';
      this.sessionsFeedbackMessage = '';
      return;
    }

    if (!window.confirm('Deseas cerrar las sesiones seleccionadas?')) {
      return;
    }

    this.executeSessionAction(
      this.authService.cerrarSesiones([...this.selectedSessionIds]),
    );
  }

  closeAllSessions(): void {
    if (
      !window.confirm(
        'Esta accion puede cerrar tambien la sesion actual. Deseas continuar?',
      )
    ) {
      return;
    }

    this.executeSessionAction(this.authService.cerrarTodasSesiones());
  }

  trackBySession(_: number, session: SessionViewModel): string {
    return session.idSesion;
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
    this.authService.clearSession();

    void this.router.navigate(['/auth/login'], {
      queryParams: { passwordActualizada: '1' },
    });
  }

  private handleSessionsLoaded(response: ConsultarSesionesResponse): void {
    const sessions = response.sesiones ?? response.data ?? [];

    this.sessions = sessions
      .map((session) => this.toSessionViewModel(session))
      .filter(
        (session): session is SessionViewModel =>
          session !== null && session.activa,
      );
    this.selectedSessionIds.clear();
  }

  private executeSessionAction(
    action$: ReturnType<AuthService['cerrarSesiones']>,
  ): void {
    this.sessionsActionLoading = true;
    this.sessionsFeedbackMessage = '';
    this.sessionsErrorMessage = '';

    action$
      .pipe(
        finalize(() => {
          this.sessionsActionLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => this.handleSessionsClosed(response),
        error: (error: unknown) => {
          this.sessionsErrorMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudieron cerrar las sesiones.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private handleSessionsClosed(response: CerrarSesionesResponse): void {
    this.sessionsFeedbackMessage =
      response.mensaje || response.message || 'Sesiones cerradas correctamente.';
    this.selectedSessionIds.clear();
    this.loadSessions();
  }

  private toSessionViewModel(session: SesionActiva): SessionViewModel | null {
    const idSesion = this.getText(session, ['idSesion', 'IdSesion', 'IDSESION']);

    if (!idSesion) {
      return null;
    }

    const fechaExpiracion = this.getText(session, [
      'fechaExpiracion',
      'FechaExpiracion',
      'FECHAEXPIRACION',
    ]);
    const activa = this.isActiveSession(session, fechaExpiracion);

    return {
      idSesion,
      dispositivo:
        this.getText(session, ['dispositivo', 'Dispositivo', 'DISPOSITIVO']) ||
        'Dispositivo no identificado',
      ip: this.getText(session, ['ip', 'Ip', 'IP']) || 'IP no disponible',
      fechaInicio: this.formatDate(
        this.getText(session, ['fechaInicio', 'FechaInicio', 'FECHAINICIO']),
      ),
      fechaExpiracion: this.formatDate(fechaExpiracion),
      estado: activa ? 'Activa' : 'Inactiva',
      activa,
      esActual:
        this.getBoolean(session, [
          'esActual',
          'EsActual',
          'actual',
          'Actual',
          'sesionActual',
          'SesionActual',
        ]) ?? false,
    };
  }

  private isActiveSession(session: SesionActiva, expirationDate: string): boolean {
    if (this.isExpiredSession(expirationDate)) {
      return false;
    }

    const activeFlag = this.getBoolean(session, ['activa', 'Activa', 'ACTIVA']);

    if (activeFlag !== undefined) {
      return activeFlag;
    }

    const status = this.normalizeStatus(
      this.getText(session, [
        'estado',
        'Estado',
        'ESTADO',
        'estadoSesion',
        'EstadoSesion',
        'ESTADOSESION',
      ]),
    );

    if (['activa', 'activo', 'active', 'vigente', 'abierta', 'abierto'].includes(status)) {
      return true;
    }

    return false;
  }

  private isExpiredSession(value: string): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
  }

  private normalizeStatus(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private getText(session: SesionActiva, keys: string[]): string {
    const value = this.getValue(session, keys);

    if (value === undefined || value === null) {
      return '';
    }

    return String(value).trim();
  }

  private getBoolean(
    session: SesionActiva,
    keys: string[],
  ): boolean | undefined {
    const value = this.getValue(session, keys);

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();

      if (['true', '1', 'activa', 'actual', 'si'].includes(normalizedValue)) {
        return true;
      }

      if (['false', '0', 'inactiva', 'no'].includes(normalizedValue)) {
        return false;
      }
    }

    return undefined;
  }

  private getValue(session: SesionActiva, keys: string[]): unknown {
    return keys.map((key) => session[key]).find((value) => value !== undefined);
  }

  private formatDate(value: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
