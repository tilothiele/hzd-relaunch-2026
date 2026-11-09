// Formularfelder für das SEPA-Lastschriftmandat (/sepa-lastschriftmandat)

/** Personendaten (Mitglied bzw. Kontoinhaber) – gleiche 5 Felder */
export interface SepaMandatPerson {
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
}

export interface SepaMandatFormData {
  /** Regionalgruppe (Schlüssel aus config/regionalgruppen-adressen.json) */
  regionalgruppe: string;
  /** Mitglied – immer Pflicht (erscheint als eigener Block im PDF) */
  mitglied: SepaMandatPerson;
  /**
   * Schalter 'Abweichender Kontoinhaber'.
   * default aus: der Kontoinhaber ist das Mitglied selbst (Personendaten = mitglied).
   * ein: die Personendaten 'kontoinhaber' werden enabled + Pflicht und von 'mitglied' abweichend.
   */
  abweichenderKontoinhaber: boolean;
  /** Kontoinhaber – nur Pflicht/validiert, wenn abweichenderKontoinhaber = true */
  kontoinhaber: SepaMandatPerson;
  kreditinstitut: string;
  iban: string;
  /** optional (nur bei Konten im Ausland erforderlich) */
  bic: string;
}
