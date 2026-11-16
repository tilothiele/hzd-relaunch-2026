// Formularfelder für die HZD-Körung-Ausschreibung (/ausschreibung-hzd-koerung)
//
// Die Feldnamen entsprechen 1:1 den {{…}}-Platzhaltern der DOCX-Vorlage
// (Strapi > PWA Settings > VorlageAusschreibungKoerung), so dass das
// Platzhaltermodell direkt aus den Formularwerten aufgebaut werden kann:
//
//   platzZeile1 … platzZeile4   →  {{Platz_Zeile1}} … {{Platz_Zeile4}}
//   koermeister                 →  {{Körmeister}}
//   zuchtrichter                →  {{Zuchtrichter}}
//   leiterZeile1 … leiterZeile5 →  {{Leiter_Zeile1}} … {{Leiter_Zeile5}}
//   koerhelfer                  →  {{Körhelfer}}
//   datum                       →  {{Datum}}
//   meldeschluss                →  {{Meldeschluss}}
//   faelligkitGebuehr           →  {{Faelligkit_Gebuehr}}
//   faelligkitPapiere           →  {{Faelligkit_Papiere}}
//   faelligkitBestaetigung      →  {{Faelligkit_Bestaetigung}}
//   kontoZeile1 … kontoZeile3   →  {{Konto_Zeile1}} … {{Konto_Zeile3}}
//   einlass                     →  {{Einlass}}
//   beginn                      →  {{Beginn}}

export interface KoerungAusschreibungFormData {
  // Ort der Körung (4 Adresszeilen – nur Zeile 1 Pflicht)
  platzZeile1: string;
  platzZeile2?: string;
  platzZeile3?: string;
  platzZeile4?: string;

  // Funktionsträger
  koermeister: string;
  zuchtrichter: string;

  // Veranstaltungsleitung (5 Zeilen, z. B. Name, Straße Nr., PLZ Ort, Tel, E-Mail – nur Zeile 1 Pflicht)
  leiterZeile1: string;
  leiterZeile2?: string;
  leiterZeile3?: string;
  leiterZeile4?: string;
  leiterZeile5?: string;

  koerhelfer: string;

  /** Meldeschluss als ISO-Datum (JJJJ-MM-TT, Wert eines <input type="date">) */
  meldeschluss: string;

  /** Körungs-Datum / -Termin als ISO-Datum (JJJJ-MM-TT, <input type="date">) */
  datum: string;

  /**
   * Fälligkeiten – optional, im Formular mit Standardwerten vorbelegt:
   *   - faelligkitGebuehr    → Fälligkeit der Meldegebühr
   *                            (Standard: "spätestens am 3. Banktag nach Meldeschluss")
   *   - faelligkitPapiere    → Fälligkeit der einzureichenden Papiere
   *                            (Standard: Datum des Meldeschlusses)
   *   - faelligkitBestaetigung → Fälligkeit der Bestätigung
   *                            (Standard: "7 Tage")
   */
  faelligkitGebuehr?: string;
  faelligkitPapiere?: string;
  faelligkitBestaetigung?: string;

  // Bankverbindung (3 Zeilen, z. B. IBAN, BIC, Bank – nur Zeile 1 Pflicht)
  kontoZeile1: string;
  kontoZeile2?: string;
  kontoZeile3?: string;

  /** Einlass als Uhrzeit (HH:mm, Wert eines <input type="time">) */
  einlass: string;
  /** Beginn als Uhrzeit (HH:mm, Wert eines <input type="time">) */
  beginn: string;
}
