import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/http/api-error.service';
import {
  countryOptions,
  currencyOptions,
  timeZoneOptions,
} from '../../constants/personal-info-options.constants';
import {
  PersonalInfo,
  PersonalInfoApiResponse,
  PersonalInfoFormValue,
  UpdatePersonalInfoPayload,
} from '../../models/personal-info.models';
import { PersonalInfoApiService } from '../../services/personal-info-api.service';

const emptyPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  country: '',
  countryCode: '',
  primaryCurrency: '',
  timeZone: '',
  avatarUrl: '',
};

@Component({
  selector: 'app-personal-info-page',
  templateUrl: './personal-info-page.component.html',
  styleUrls: ['./personal-info-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfoPageComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly personalInfoApiService = inject(PersonalInfoApiService);
  private readonly apiErrorService = inject(ApiErrorService);

  user: PersonalInfo = { ...emptyPersonalInfo };
  readonly countries = countryOptions;
  readonly currencies = currencyOptions;
  readonly timeZones = timeZoneOptions;
  readonly form = this.formBuilder.group({
    fullName: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(80)],
    ],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(120)],
    ],
    country: ['', Validators.required],
    primaryCurrency: ['', Validators.required],
    timeZone: ['', Validators.required],
  });

  loading = false;
  saving = false;
  feedbackMessage = '';

  get displayName(): string {
    return this.form.controls.fullName.value || this.user.fullName || 'Tu perfil';
  }

  ngOnInit(): void {
    this.cargarInformacionPersonal();
  }

  handleChangePhoto(): void {
    this.feedbackMessage = 'El cambio de foto queda pendiente de la integracion de archivos.';
    this.changeDetectorRef.markForCheck();
  }

  saveChanges(value: PersonalInfoFormValue): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.crearPayloadActualizacion(value);

    this.saving = true;
    this.feedbackMessage = '';

    this.personalInfoApiService
      .actualizar(payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.aplicarInformacionPersonal({
            nombreCompleto: response?.nombreCompleto ?? payload.nombreCompleto,
            correo: response?.correo ?? value.email,
            fotoPerfilUrl: response?.fotoPerfilUrl ?? payload.fotoPerfilUrl,
            pais: response?.pais ?? payload.pais,
            codigoPais: response?.codigoPais ?? payload.codigoPais,
            monedaPrincipal:
              response?.monedaPrincipal ?? payload.monedaPrincipal,
            zonaHoraria: response?.zonaHoraria ?? payload.zonaHoraria,
          });
          this.feedbackMessage = 'Cambios guardados correctamente.';
          this.form.markAsPristine();
          this.changeDetectorRef.markForCheck();
        },
        error: (error: unknown) => {
          this.feedbackMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudieron guardar los cambios.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private cargarInformacionPersonal(): void {
    this.loading = true;
    this.feedbackMessage = '';

    this.personalInfoApiService
      .obtener()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.aplicarInformacionPersonal(response);
          this.form.markAsPristine();
          this.changeDetectorRef.markForCheck();
        },
        error: (error: unknown) => {
          this.feedbackMessage = this.apiErrorService.obtenerMensaje(
            error,
            'No se pudo cargar la informacion personal.',
          );
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private aplicarInformacionPersonal(response: PersonalInfoApiResponse): void {
    const countryCode =
      response.codigoPais ??
      this.obtenerCodigoPais(response.pais) ??
      this.user.countryCode;
    const countryName =
      response.pais ?? this.obtenerNombrePais(countryCode) ?? this.user.country;

    this.user = {
      fullName: response.nombreCompleto ?? this.user.fullName,
      email: response.correo ?? this.user.email,
      country: countryName,
      countryCode,
      primaryCurrency: response.monedaPrincipal ?? this.user.primaryCurrency,
      timeZone: response.zonaHoraria ?? this.user.timeZone,
      avatarUrl: response.fotoPerfilUrl ?? this.user.avatarUrl,
    };

    this.form.patchValue({
      fullName: this.user.fullName,
      email: this.user.email,
      country: this.user.countryCode,
      primaryCurrency: this.user.primaryCurrency,
      timeZone: this.user.timeZone,
    });
  }

  private crearPayloadActualizacion(
    value: PersonalInfoFormValue,
  ): UpdatePersonalInfoPayload {
    const countryName = this.obtenerNombrePais(value.country) ?? this.user.country;

    return {
      nombreCompleto: value.fullName,
      fotoPerfilUrl: this.user.avatarUrl ?? '',
      pais: countryName,
      codigoPais: value.country,
      monedaPrincipal: value.primaryCurrency,
      zonaHoraria: value.timeZone,
    };
  }

  private obtenerNombrePais(countryCode: string): string | undefined {
    return this.countries.find((country) => country.value === countryCode)?.label;
  }

  private obtenerCodigoPais(countryName?: string): string | undefined {
    return this.countries.find((country) => country.label === countryName)?.value;
  }
}
