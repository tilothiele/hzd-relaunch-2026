import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { convertOfficeDocumentToPdf } from '@/lib/gotenberg';
import { ladeVorlageKoerungAusschreibung } from '@/lib/server/koerung-ausschreibung-vorlage';
import { serverLog } from '@/lib/server-only';
import type { KoerungAusschreibungFormData } from '@/types/koerung-ausschreibung-form';

/**
 * HZD-Körung-Ausschreibung – Template-basierter Dokument-Generator.
 *
 * Ablauf:
 *   1. DOCX-Vorlage aus dem Strapi-Backend laden (Single Collection
 *      'PWA Settings' > VorlageAusschreibungKoerung).
 *   2. docxtemplater-Platzhalter ({{Platz_Zeile1}}, {{Körmeister}}, …)
 *      mit den Formularwerten befüllen → befüllte DOCX.
 *   3. Befüllte DOCX an den Gotenberg-Server (/forms/libreoffice/convert)
 *      senden, der sie per LibreOffice in PDF umwandelt → PDF.
 *
 * Das Ergebnis (DOCX + PDF) wird je einmal als ArrayBuffer zurückgegeben.
 * Die Vorlage kann in Word oder LibreOffice geöffnet und verfeinert werden;
 * vorhandene {{…}}-Platzhalter bitte erhalten, neue Platzhalter in
 * derselben Notation ergänzen und sie anschließend in
 * buildKoerungAusschreibungModel pflegen.
 *
 * Hinweis: docxtemplater ersetzt Tag-Namen exakt. Für die Umlaut-Felder
 * werden daher beide Schreibweisen (Körmeister/Koermeister,
 * Körhelfer/Koerhelfer) befüllt, damit die Vorlage je nach Schreibweise
 * funktionieren kann.
 */

export const DATEINAME = 'Ausschreibung-HZD-Koerveranstaltung';

/** Platzhaltermodell der DOCX-Vorlage (Schlüssel = Platzhalter ohne {{…}}). */
export interface KoerungAusschreibungTemplateModel {
  Platz_Zeile1: string;
  Platz_Zeile2: string;
  Platz_Zeile3: string;
  Platz_Zeile4: string;
  Körmeister: string;
  Koermeister: string; // ASCII-Variante von Körmeister
  Zuchtrichter: string;
  Leiter_Zeile1: string;
  Leiter_Zeile2: string;
  Leiter_Zeile3: string;
  Leiter_Zeile4: string;
  Leiter_Zeile5: string;
  Körhelfer: string;
  Koerhelfer: string; // ASCII-Variante von Körhelfer
  Meldeschluss: string;
  Datum: string;
  Faelligkit_Gebuehr: string;
  Faelligkit_Papiere: string;
  Faelligkit_Bestaetigung: string;
  Konto_Zeile1: string;
  Konto_Zeile2: string;
  Konto_Zeile3: string;
  Einlass: string;
  Beginn: string;
}

/**
 * Baut das Platzhaltermodell aus den Formularwerten.
 *
 * Formatierung:
 *   - Meldeschluss / Datum: deutsches Datum (TT.MM.JJJJ)
 *   - Einlass / Beginn: "HH:mm Uhr"
 *
 * Standard-/Fallback-Werte:
 *   - Datum (Pflichtfeld): Körungs-Termin aus dem Formular
 *   - Faelligkit_Gebuehr: Standard im Formular "spätestens am 3. Banktag
 *     nach Meldeschluss"
 *   - Faelligkit_Papiere: Standard = Datum des Meldeschlusses
 *     (Service-Fallback, falls das Feld leer gelassen wurde)
 *   - Faelligkit_Bestaetigung: Standard im Formular "7 Tage"
 */
export function buildKoerungAusschreibungModel(
  data: KoerungAusschreibungFormData,
): KoerungAusschreibungTemplateModel {
  const t = (value: string | undefined): string => value?.trim() ?? '';
  const koermeister = t(data.koermeister);
  const koerhelfer = t(data.koerhelfer);

  return {
    Platz_Zeile1: t(data.platzZeile1),
    Platz_Zeile2: t(data.platzZeile2),
    Platz_Zeile3: t(data.platzZeile3),
    Platz_Zeile4: t(data.platzZeile4),

    Körmeister: koermeister,
    Koermeister: koermeister,
    Zuchtrichter: t(data.zuchtrichter),

    Leiter_Zeile1: t(data.leiterZeile1),
    Leiter_Zeile2: t(data.leiterZeile2),
    Leiter_Zeile3: t(data.leiterZeile3),
    Leiter_Zeile4: t(data.leiterZeile4),
    Leiter_Zeile5: t(data.leiterZeile5),

    Körhelfer: koerhelfer,
    Koerhelfer: koerhelfer,

    Meldeschluss: formatMeldeschluss(data.meldeschluss),
    // Dokument-/Ortsdatum (ISO → TT.MM.JJJJ); leer → leer
    Datum: formatMeldeschluss(t(data.datum)),
    Faelligkit_Gebuehr: t(data.faelligkitGebuehr),
    // Standard laut Ausschreibung: Papiere müssen bis Meldeschluss vorliegen
    Faelligkit_Papiere:
      t(data.faelligkitPapiere) || formatMeldeschluss(data.meldeschluss),
    Faelligkit_Bestaetigung: t(data.faelligkitBestaetigung),

    Konto_Zeile1: t(data.kontoZeile1),
    Konto_Zeile2: t(data.kontoZeile2),
    Konto_Zeile3: t(data.kontoZeile3),

    Einlass: formatUhrzeit(data.einlass),
    Beginn: formatUhrzeit(data.beginn),
  };
}

/** Meldeschluss (JJJJ-MM-TT) als deutsches Datum TT.MM.JJJJ. */
export function formatMeldeschluss(iso: string): string {
  const trimmed = iso.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  const datum = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return datum.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Uhrzeit (HH:mm) als "HH:mm Uhr". */
export function formatUhrzeit(uhrzeit: string): string {
  const trimmed = uhrzeit.trim();
  return trimmed === '' ? '' : `${trimmed} Uhr`;
}

/** Liest die DOCX-Vorlage und ersetzt die {{…}}-Platzhalter. */
export function renderKoerungAusschreibungDocx(
  vorlage: Buffer,
  model: KoerungAusschreibungTemplateModel,
): Buffer {
  // docxtemplater 3.x erwartet im Konstruktor ein Zip-Objekt (PizZip),
  // keinen rohen Buffer (würde mit "You passed a Buffer…" werfen).
  const zip = new PizZip(vorlage.toString('base64'), { base64: true });

  // docxtemplater 3.x defaultet auf einfache {…}-Delimiters; unsere
  // Vorlagen nutzen {{Platzhalter}} → Delimiter ausdrücklich setzen.
  const doc = new Docxtemplater(zip, {
    nullGetter: () => '',
    delimiters: { start: '{{', end: '}}' },
  });
  doc.render(model);

  // PizZip.generate liefert synchron den fertigen Buffer (Node).
  // compression: DEFLATE, sonst werden die Zip-Einträge (insb. die
  // eingebetteten HZD-/VDH-Logos in der Vorlage) ungekomprimiert
  // gespeichert und die DOCX ist mehrfach größer als nötig.
  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

export interface GenerierteDokumente {
  /** Befüllte DOCX (ArrayBuffer) */
  docx: ArrayBuffer;
  /** Aus der DOCX konvertiertes PDF (ArrayBuffer) */
  pdf: ArrayBuffer;
}

class KoerungAusschreibungDokumenteService {
  /** Erzeugt DOCX + PDF aus der Vorlage und den Formularwerten. */
  async createDokumente(
    data: KoerungAusschreibungFormData,
    userJwt: string | null = null,
  ): Promise<GenerierteDokumente> {
    serverLog('HZD-Körung-Ausschreibung: lade Vorlage aus Strapi');

    const vorlage = await ladeVorlageKoerungAusschreibung(userJwt);
    const model = buildKoerungAusschreibungModel(data);
    const docxBuffer = renderKoerungAusschreibungDocx(vorlage, model);
    const pdfBuffer = await convertOfficeDocumentToPdf(
      docxBuffer,
      `${DATEINAME}.docx`,
    );

    serverLog(
      `HZD-Körung-Ausschreibung erfolgreich erstellt ` +
        `(DOCX ${docxBuffer.length} Byte, PDF ${pdfBuffer.length} Byte)`,
    );

    return {
      docx: toArrayBuffer(docxBuffer),
      pdf: toArrayBuffer(pdfBuffer),
    };
  }
}

/** Node-Buffer → exakt geschnittenes ArrayBuffer. */
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

let koerungAusschreibungService: KoerungAusschreibungDokumenteService | null =
  null;

export function getKoerungAusschreibungService(): KoerungAusschreibungDokumenteService {
  if (!koerungAusschreibungService) {
    koerungAusschreibungService =
      new KoerungAusschreibungDokumenteService();
  }
  return koerungAusschreibungService;
}
