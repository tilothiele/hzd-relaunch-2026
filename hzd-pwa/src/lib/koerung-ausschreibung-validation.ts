// Gemeinsame Validierung für die HZD-Körung-Ausschreibung (Frontend + API).
// Pflichtfelder (alle anderen Felder sind optional):
//   Platz_Zeile1, Körmeister, Zuchtrichter, Leiter_Zeile1, Körhelfer,
//   Datum, Meldeschluss, Konto_Zeile1, Einlass, Beginn.
// Datum und Uhrzeiten werden zusätzlich formatgeprüft. Die Regeln sind
// identisch für Frontend (Live-Validierung) und API-Route (Server-Validierung).
import type { KoerungAusschreibungFormData } from '@/types/koerung-ausschreibung-form';

export type KoerungAusschreibungErrorKey =
  keyof KoerungAusschreibungFormData;

export type KoerungAusschreibungErrors = Partial<
  Record<KoerungAusschreibungErrorKey, string>
>;

/** Lesbare Feldbezeichnungen (für die Meldung unter dem 'Generiere Dokument(e)'-Button). */
export const FELD_LABELS: Record<KoerungAusschreibungErrorKey, string> = {
  platzZeile1: 'Platz – Zeile 1',
  platzZeile2: 'Platz – Zeile 2',
  platzZeile3: 'Platz – Zeile 3',
  platzZeile4: 'Platz – Zeile 4',
  koermeister: 'Körmeister/in',
  zuchtrichter: 'Zuchtrichter/in',
  leiterZeile1: 'Veranstaltungsleitung – Zeile 1',
  leiterZeile2: 'Veranstaltungsleitung – Zeile 2',
  leiterZeile3: 'Veranstaltungsleitung – Zeile 3',
  leiterZeile4: 'Veranstaltungsleitung – Zeile 4',
  leiterZeile5: 'Veranstaltungsleitung – Zeile 5',
  koerhelfer: 'Körhelfer/in',
  datum: 'Datum der Körung',
  meldeschluss: 'Meldeschluss (Datum)',
  faelligkitGebuehr: 'Fälligkeit Gebühr',
  faelligkitPapiere: 'Fälligkeit Papiere',
  faelligkitBestaetigung: 'Fälligkeit Bestätigung',
  kontoZeile1: 'Konto/Bankverbindung – Zeile 1',
  kontoZeile2: 'Konto/Bankverbindung – Zeile 2',
  kontoZeile3: 'Konto/Bankverbindung – Zeile 3',
  einlass: 'Einlass (Uhrzeit)',
  beginn: 'Beginn (Uhrzeit)',
};

/**
 * Pflichtfelder in Anzeige-Reihenfolge (für die Zusammenfassung unter dem
 * Button). Alle übrigen Felder sind optional.
 */
export const PF_PFLICHTFELDER: KoerungAusschreibungErrorKey[] = [
  'platzZeile1',
  'koermeister',
  'zuchtrichter',
  'leiterZeile1',
  'koerhelfer',
  'datum',
  'meldeschluss',
  'kontoZeile1',
  'einlass',
  'beginn',
];

const DATUM_PATTERn = /^\d{4}-\d{2}-\d{2}$/;
const UHRZEIT_PATTERN = /^\d{1,2}:\d{2}(:\d{2})?$/;

function istGultigesDatum(wert: string): boolean {
  return DATUM_PATTERn.test(wert) && !Number.isNaN(Date.parse(wert));
}

function istGultigeUhrzeit(wert: string): boolean {
  const stunden = Number(wert.slice(0, wert.indexOf(':')));
  return UHRZEIT_PATTERN.test(wert) && stunden >= 0 && stunden <= 23;
}

export function validateKoerungAusschreibung(
  data: KoerungAusschreibungFormData,
): { isValid: boolean; errors: KoerungAusschreibungErrors } {
  const errors: KoerungAusschreibungErrors = {};

  // Textpflichtfelder
  for (const feld of PF_PFLICHTFELDER) {
    if (typeof data[feld] !== 'string' || data[feld].trim() === '') {
      errors[feld] = `${FELD_LABELS[feld]} ist erforderlich`;
    }
  }

  // Datum (Körung) + Datum (Meldeschluss)
  if (!errors.datum && !istGultigesDatum(data.datum)) {
    errors.datum = 'Datum der Körung muss ein gültiges Datum sein';
  }
  if (!errors.meldeschluss && !istGultigesDatum(data.meldeschluss)) {
    errors.meldeschluss = 'Meldeschluss muss ein gültiges Datum sein';
  }

  // Uhrzeiten (Einlass, Beginn)
  if (!errors.einlass && !istGultigeUhrzeit(data.einlass)) {
    errors.einlass = 'Einlass muss eine gültige Uhrzeit sein';
  }
  if (!errors.beginn && !istGultigeUhrzeit(data.beginn)) {
    errors.beginn = 'Beginn muss eine gültige Uhrzeit sein';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
