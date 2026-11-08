// Gemeinsame Validierung für das SEPA-Lastschriftmandat (Frontend + API).
// Die IBAN-Regel entspricht der des Mitgliedsantrags (applicationService.validateFormData).
import regionalgruppenAdressen from '../config/regionalgruppen-adressen.json';
import type { SepaMandatFormData } from '../types/sepa-mandat-form';

const adressen = regionalgruppenAdressen as Record<string, string[]>;

export const REGIONALGRUPPEN = Object.keys(adressen);

/** Gleiche IBAN-Regel wie beim Mitgliedsantrag (ohne Leerzeichen, Großbuchstaben) */
export function isValidIban(iban: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban.replace(/\s/g, ''));
}

/** Gleiche PLZ-Regel wie beim Mitgliedsantrag (5-stellig) */
export function isValidPlz(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}

export type SepaMandatErrors = Partial<Record<keyof SepaMandatFormData, string>>;

export function validateSepaMandatFormData(
  data: SepaMandatFormData,
): { isValid: boolean; errors: SepaMandatErrors } {
  const errors: SepaMandatErrors = {};

  const required: Array<[keyof SepaMandatFormData, string]> = [
    ['regionalgruppe', 'Bitte wählen Sie die zuständige Regionalgruppe'],
    ['vorname', 'Vorname ist erforderlich'],
    ['nachname', 'Nachname ist erforderlich'],
    ['strasse', 'Straße ist erforderlich'],
    ['plz', 'PLZ ist erforderlich'],
    ['ort', 'Ort ist erforderlich'],
    ['kreditinstitut', 'Kreditinstitut ist erforderlich'],
    ['iban', 'IBAN ist erforderlich'],
    ['bic', 'BIC ist erforderlich'],
  ];

  for (const [field, message] of required) {
    const value = data[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors[field] = message;
    }
  }

  if (!errors.regionalgruppe && !adressen[data.regionalgruppe]) {
    errors.regionalgruppe = 'Unbekannte Regionalgruppe';
  }

  if (!errors.plz && !isValidPlz(data.plz)) {
    errors.plz = 'PLZ muss 5-stellig sein';
  }

  if (!errors.iban && !isValidIban(data.iban)) {
    errors.iban = 'Ungültige IBAN';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
