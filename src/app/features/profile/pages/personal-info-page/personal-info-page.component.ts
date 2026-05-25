import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';

import {
  countryOptions,
  currencyOptions,
  mockPersonalInfo,
  timeZoneOptions,
} from '../../constants/personal-info.mock';
import { PersonalInfoFormValue } from '../../models/personal-info.models';

@Component({
  selector: 'app-personal-info-page',
  templateUrl: './personal-info-page.component.html',
  styleUrls: ['./personal-info-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfoPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly user = mockPersonalInfo;
  readonly countries = countryOptions;
  readonly currencies = currencyOptions;
  readonly timeZones = timeZoneOptions;
  readonly form = this.formBuilder.group({
    fullName: [
      this.user.fullName,
      [Validators.required, Validators.minLength(3), Validators.maxLength(80)],
    ],
    email: [
      this.user.email,
      [Validators.required, Validators.email, Validators.maxLength(120)],
    ],
    country: [this.user.country, Validators.required],
    primaryCurrency: [this.user.primaryCurrency, Validators.required],
    timeZone: [this.user.timeZone, Validators.required],
  });

  saving = false;
  feedbackMessage = '';

  get displayName(): string {
    return this.form.controls.fullName.value || this.user.fullName;
  }

  handleChangePhoto(): void {
    this.feedbackMessage = 'El cambio de foto quedó preparado para una próxima integración.';
    this.changeDetectorRef.markForCheck();
  }

  saveChanges(value: PersonalInfoFormValue): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.feedbackMessage = '';

    window.setTimeout(() => {
      this.saving = false;
      this.feedbackMessage = `Cambios listos para guardar: ${value.fullName}.`;
      this.form.markAsPristine();
      this.changeDetectorRef.markForCheck();
    }, 420);
  }
}
