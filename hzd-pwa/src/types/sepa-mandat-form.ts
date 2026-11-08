// Formularfelder für das SEPA-Lastschriftmandat (/sepa-lastschriftmandat)
export interface SepaMandatFormData {
  /** Regionalgruppe (Schlüssel aus config/regionalgruppen-adressen.json) */
  regionalgruppe: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  kreditinstitut: string;
  iban: string;
  bic: string;
}
