import { PersonalInfo, SelectOption } from '../models/personal-info.models';

export const mockPersonalInfo: PersonalInfo = {
  fullName: 'Miguel Andrade',
  email: 'miguel.andrade@email.com',
  country: 'EC',
  primaryCurrency: 'USD',
  timeZone: 'America/Guayaquil',
};

export const countryOptions: SelectOption[] = [
  { label: 'Ecuador', value: 'EC' },
  { label: 'Colombia', value: 'CO' },
  { label: 'Perú', value: 'PE' },
  { label: 'México', value: 'MX' },
  { label: 'Estados Unidos', value: 'US' },
];

export const currencyOptions: SelectOption[] = [
  { label: 'Dólar estadounidense (USD)', value: 'USD' },
  { label: 'Peso colombiano (COP)', value: 'COP' },
  { label: 'Sol peruano (PEN)', value: 'PEN' },
  { label: 'Peso mexicano (MXN)', value: 'MXN' },
  { label: 'Euro (EUR)', value: 'EUR' },
];

export const timeZoneOptions: SelectOption[] = [
  { label: 'Quito / Guayaquil (GMT-5)', value: 'America/Guayaquil' },
  { label: 'Bogotá (GMT-5)', value: 'America/Bogota' },
  { label: 'Lima (GMT-5)', value: 'America/Lima' },
  { label: 'Ciudad de México (GMT-6)', value: 'America/Mexico_City' },
  { label: 'Nueva York (GMT-5)', value: 'America/New_York' },
];
