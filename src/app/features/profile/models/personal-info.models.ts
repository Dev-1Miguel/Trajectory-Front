import { FormControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  country: string;
  primaryCurrency: string;
  timeZone: string;
  avatarUrl?: string;
}

export interface PersonalInfoFormValue {
  fullName: string;
  email: string;
  country: string;
  primaryCurrency: string;
  timeZone: string;
}

export interface PersonalInfoFormControls {
  fullName: FormControl<string>;
  email: FormControl<string>;
  country: FormControl<string>;
  primaryCurrency: FormControl<string>;
  timeZone: FormControl<string>;
}
