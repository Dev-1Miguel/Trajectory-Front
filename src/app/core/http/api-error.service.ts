import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  obtenerMensaje(error: unknown, fallback = 'No se pudo completar la accion.'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error.message : fallback;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa que el backend este activo.';
    }

    if (error.status === 400) {
      return this.extraerMensaje(error.error) || 'Revisa los datos ingresados.';
    }

    if (error.status === 401) {
      return 'Tu sesion expiro. Inicia sesion nuevamente.';
    }

    if (error.status === 409) {
      return 'El correo ya esta registrado.';
    }

    if (error.status >= 500) {
      return 'Ocurrio un error en el servidor. Intenta nuevamente mas tarde.';
    }

    return this.extraerMensaje(error.error) || fallback;
  }

  private extraerMensaje(payload: unknown): string {
    if (typeof payload === 'string') {
      return payload;
    }

    if (!this.esRegistro(payload)) {
      return '';
    }

    const mensaje =
      payload['mensaje'] ??
      payload['message'] ??
      payload['messages'] ??
      payload['errors'] ??
      payload['error'];

    return this.normalizarMensaje(mensaje);
  }

  private normalizarMensaje(valor: unknown): string {
    if (typeof valor === 'string') {
      return valor;
    }

    if (Array.isArray(valor)) {
      return valor
        .map((item) => this.normalizarMensaje(item))
        .filter(Boolean)
        .join(' ');
    }

    if (this.esRegistro(valor)) {
      return Object.values(valor)
        .map((item) => this.normalizarMensaje(item))
        .filter(Boolean)
        .join(' ');
    }

    return '';
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }
}
