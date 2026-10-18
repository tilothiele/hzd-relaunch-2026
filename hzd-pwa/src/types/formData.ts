// Frontend-spezifische FormData Interface
// Diese Datei kann im Frontend und Backend verwendet werden

export interface FormData {
  anrede: string;
  name: string;
  vorname: string;
  geburtsdatum: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  mitgliedschaftVDH: string;
  hundName: string;
  hundZwinger: string;
  hundZuchtbuch: string;
  hundChip: string;
  hundWurfdatum: string;
  hundRasse: string;
  hundGeschlecht: string;
  hundVersicherung: string;
  hundVersNr: string;
  kontoinhaber: string;
  mitgliedschaft: string; // MembershipType.id
  kurzzeitVon: string;
  kurzzeitBis: string;
  sepaName: string;
  sepaIban: string;
  sepaBic: string;
  sepaKreditinstitut: string;
  weitereMitteilungen: string;
}
