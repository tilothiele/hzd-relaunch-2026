// Gemeinsame Validierung für das SEPA-Lastschriftmandat (Frontend + API).
// Die IBAN-Regel entspricht der des Mitgliedsantrags (applicationService.validateFormData).
// Die Konfiguration (Adressen pro Regionalgruppe, Gläubiger-Identifikationsnummer)
// stammt aus config/regionalgruppen-adressen.json.
import sepaMandatConfig from '../config/regionalgruppen-adressen.json';
import type { SepaMandatFormData, SepaMandatPerson } from '../types/sepa-mandat-form';

/** Gläubiger-Identifikationsnummer (aus der Konfigurations-JSON) */
export const GLAEUBIGER_ID: string = sepaMandatConfig.glaeubigerId;

const regionalgruppen = sepaMandatConfig.regionalgruppen as Record<string, string[]>;

/** Regionalgruppen in Dropdown-Reihenfolge (Schlüsselreihenfolge der JSON) */
export const REGIONALGRUPPEN = Object.keys(regionalgruppen);

/** Adresszeilen (Array von Strings = Zeilen im PDF-Adressblock) für eine Regionalgruppe */
export function getAdresszeilen(regionalgruppe: string): string[] {
  return regionalgruppen[regionalgruppe] ?? [];
}

/** Gleiche IBAN-Regel wie beim Mitgliedsantrag (ohne Leerzeichen, Großbuchstaben) */
export function isValidIban(iban: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban.replace(/\s+/g, ''));
}

/** Gleiche PLZ-Regel wie beim Mitgliedsantrag (5-stellig) */
export function isValidPlz(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}

/**
 * Fehlertastern (flach, lesbar im Formular + in der API-Antwort).
 * 'mitglied*' → Mitglied-Block; 'kontoinhaber*' → Kontoinhaber-Block (nur relevant,
 * wenn 'Abweichender Kontoinhaber' aktiviert ist).
 */
export type SepaMandatErrorKey =
  | 'regionalgruppe'
  | 'mitgliedVorname'
  | 'mitgliedNachname'
  | 'mitgliedStrasse'
  | 'mitgliedPlz'
  | 'mitgliedOrt'
  | 'kontoinhaberVorname'
  | 'kontoinhaberNachname'
  | 'kontoinhaberStrasse'
  | 'kontoinhaberPlz'
  | 'kontoinhaberOrt'
  | 'iban'
  | 'bic'
  | 'kreditinstitut';

export type SepaMandatErrors = Partial<Record<SepaMandatErrorKey, string>>;

/** Fehlertaster für ein Person-Feld: 'mitglied.'/'kontoinhaber.' + Feldname */
function personFeldKey(prefix: 'mitglied' | 'kontoinhaber', feld: keyof SepaMandatPerson): SepaMandatErrorKey {
  const kap = feld.charAt(0).toUpperCase() + feld.slice(1);
  return `${prefix}${kap}` as SepaMandatErrorKey;
}

const PERSON_FELDER: Array<{ feld: keyof SepaMandatPerson; meldung: string }> = [
  { feld: 'vorname', meldung: 'Vorname ist erforderlich' },
  { feld: 'nachname', meldung: 'Name ist erforderlich' },
  { feld: 'strasse', meldung: 'Straße ist erforderlich' },
  { feld: 'plz', meldung: 'PLZ ist erforderlich' },
  { feld: 'ort', meldung: 'Ort ist erforderlich' },
];

function pruefePerson(
  person: SepaMandatPerson | undefined,
  prefix: 'mitglied' | 'kontoinhaber',
  errors: SepaMandatErrors,
) {
  for (const { feld, meldung } of PERSON_FELDER) {
    const wert = typeof person?.[feld] === 'string' ? person[feld].trim() : '';
    if (wert === '') {
      errors[personFeldKey(prefix, feld)] = meldung;
    }
  }
  if (
    !errors[personFeldKey(prefix, 'plz')] &&
    person?.plz &&
    !isValidPlz(person.plz)
  ) {
    errors[personFeldKey(prefix, 'plz')] = 'PLZ muss 5-stellig sein';
  }
}

export function validateSepaMandatFormData(
  data: SepaMandatFormData,
): { isValid: boolean; errors: SepaMandatErrors } {
  const errors: SepaMandatErrors = {};

  // Regionalgruppe
  if (!data.regionalgruppe || data.regionalgruppe.trim() === '') {
    errors.regionalgruppe = 'Bitte wählen Sie die zuständige Regionalgruppe';
  } else if (!regionalgruppen[data.regionalgruppe]) {
    errors.regionalgruppe = 'Unbekannte Regionalgruppe';
  }

  // Mitglied – immer Pflicht (voller Block im PDF)
  pruefePerson(data.mitglied, 'mitglied', errors);

  // Kontoinhaber – nur wenn 'Abweichender Kontoinhaber' aktiviert ist;
  // dann Pflicht, sonst = Mitglied
  if (data.abweichenderKontoinhaber) {
    pruefePerson(data.kontoinhaber, 'kontoinhaber', errors);
  }

  // Konto / Bank
  if (!data.kreditinstitut || data.kreditinstitut.trim() === '') {
    errors.kreditinstitut = 'Kreditinstitut ist erforderlich';
  }
  if (!data.iban || data.iban.trim() === '') {
    errors.iban = 'IBAN ist erforderlich';
  } else if (!isValidIban(data.iban)) {
    errors.iban = 'Ungültige IBAN';
  }

  // BIC ist optional (nur bei Konten im Ausland erforderlich)
  return { isValid: Object.keys(errors).length === 0, errors };
}
