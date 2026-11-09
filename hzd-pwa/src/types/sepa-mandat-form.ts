// Formularfelder für das SEPA-Lastschriftmandat (/sepa-lastschriftmandat)
export interface SepaMandatFormData {
  /** Regionalgruppe (Nord/West/Mitte/Süd/Ost/HZD → Finanzverwaltung_* in HZD Settings) */
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
