import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  PersonalInfoFormControls,
  PersonalInfoFormValue,
  SelectOption,
} from '../../models/personal-info.models';

@Component({
  selector: 'app-personal-info-form',
  templateUrl: './personal-info-form.component.html',
  styleUrls: ['./personal-info-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfoFormComponent {
  @Input({ required: true }) form!: FormGroup<PersonalInfoFormControls>;
  @Input({ required: true }) countries: SelectOption[] = [];
  @Input({ required: true }) currencies: SelectOption[] = [];
  @Input({ required: true }) timeZones: SelectOption[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<PersonalInfoFormValue>();

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.save.emit({
      fullName: value.fullName.trim(),
      email: value.email,
      country: value.country,
      primaryCurrency: value.primaryCurrency,
      timeZone: value.timeZone,
    });
  }

  hasFieldError(fieldName: keyof PersonalInfoFormControls): boolean {
    const control = this.form.controls[fieldName];

    return control.invalid && (control.dirty || control.touched);
  }
}
