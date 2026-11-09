import fs from 'fs';
import path from 'path';
import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFArray,
  PDFDict,
  rgb,
} from 'pdf-lib';
import {
  GLAEUBIGER_ID,
  getAdresszeilen,
} from '../lib/sepa-mandat-validation';
import { serverLog } from '../lib/server-only';
import type { SepaMandatFormData } from '../types/sepa-mandat-form';

/**
 * SepaMandatPdfService – generiert das SEPA-Lastschriftmandat (HZD Formular 032,
 * Version 03) auf Basis der Original-Vorlage src/templates/sepa-mandat-032-03.pdf.
 *
 * Vorgehen pro PDF:
 * 1. ALLE Formular-Felder der Vorlage werden entfernt (Bedien-Buttons, RG-Grid,
 *    gelbe Hinweisbox, Kontodaten-Felder, …) – unten wird kompakt neu gezeichnet.
 * 2. Die Adresszeilen der zuständigen Regionalgruppe (aus
 *    config/regionalgruppen-adressen.json) werden an der Originalposition gezeichnet.
 * 3. Die Gläubiger-Identifikationsnummer (ebenfalls aus der JSON) wird an der
 *    Originalposition gezeichnet.
 * 4. Kompakter Zwei-Spalten-Block 'Mitglied' | 'Kontoinhaber' (je Vorname, Name,
 *    Straße, PLZ, Ort) + IBAN / BIC / Kreditinstitut + Ort, Datum / Unterschrift
 *    werden gezeichnet – kleiner geschnitten, damit alles auf eine Seite passt.
 *    Der eingerahmte Footer (Formularnummer/Version/Datum/Bereich/…) wird
 *    mit einer weißen Abdeckung entfernt.
 */

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'src',
  'templates',
  'sepa-mandat-032-03.pdf',
);

/**
 * Alle Formular-Felder der Originalvorlage – werden im fertigen PDF komplett
 * entfernt, damit die Inhalte unten kompakt als statischer Text gezeichnet
 * werden können (keine Formularwerte mehr nötig).
 */
const ZU_ENTFERNENDE_VORLAGENFELDER = [
  // 6 versteckte Adress-Buttons (eingebackene Adressen je RG)
  'Ost',
  'Nord',
  'Süd',
  'Mitte',
  'West',
  'Präsidium',
  // 5 Regionalgruppen-Auswahlfelder
  'RG Ost',
  'RG Nord',
  'RG Süd',
  'RG Mitte',
  'RG West',
  // 2 Bedien-Buttons + 1 Hinweisfeld (gelbe Box)
  'Drucken',
  'Daten löschen',
  'Text1',
  // 9 Kontodaten-Felder (Vorname … Ort, Datum)
  'Vorname',
  'Name',
  'Straße',
  'PLZ',
  'Ort',
  'IBAN',
  'BIC nur bei Konten im Ausland erforderlich',
  'Kreditinstitut',
  'Ort Datum',
];

/* ------------------------------------------------------------------ *
 * Geometrie (PDF-Punkte, Ursprung links unten) – A4 = 595 × 842
 * ------------------------------------------------------------------ */

// Adressblock (oben links)
const ADRESS_X = 72.2;
const ADRESS_OBERE_BASELINE = 719;
const ADRESS_ZEILEN_ABSTAND = 26;
const ADRESS_COVER_X = 58;
const ADRESS_COVER_BREITE = 305;
const ADRESS_COVER_OBEN = 742;

// Gläubiger-Identifikationsnummer (statische Zeile in der Vorlage bei ca. y=456)
const GLAEUBIGER_COVER = { x: 58, y: 447, width: 488, height: 17 };
const GLAEUBIGER_X = 72.2;
const GLAEUBIGER_Y = 455;

// Große weiße Abdeckung: statisches 'Kontoinhaber'-Label + alte Kontodaten-
// Bereiche (inkl. rechter Randstriche) + Footer (eingerahmte Versionstabelle
// Bereich/Formularnummer/Version/Datum/Bearbeiter/…). Deckt y≈6…394,
// lässt den SEPA-Text oben (Gläubiger-Zeile ~456) intakt.
const GROSSE_COVER = { x: 55, y: 4, width: 505, height: 390 };

// Zwei Spalten: Links = Mitglied, Rechts = Kontoinhaber
const L_X = 60;
const R_X = 305;
const VAL_W = 232; // Breite eines vollen Feldes in einer Spalte
const SUB = 118; // Aufteilung: Vorname | Name (Linke Spalte: 118 + 114)
const PLZ_W = 70;

// Zeilen (Label-Baseline / Wert-Baseline): Reihenfolge von oben nach unten
const H_Y = 385; // Kopfzeilen 'Mitglied' | 'Kontoinhaber'
const R1_L = 363, R1_V = 350; // Vorname | Name
const R2_L = 333, R2_V = 320; // Straße
const R3_L = 303, R3_V = 290; // PLZ | Ort
const R4_L = 269, R4_V = 256; // IBAN (Vollbreite)
const R5_L = 239, R5_V = 225; // BIC | Kreditinstitut (Vollbreite)
const SIGN_L = 186, SIGN_V = 172; // Ort, Datum | Unterschrift

const LABEL_SIZE = 7.5;
const VALUE_SIZE = 10.5;

const WEISS = rgb(1, 1, 1);
const SCHWARZ = rgb(0, 0, 0);
const LINIE = rgb(0.3, 0.3, 0.3);

function readTemplate(): Buffer {
  try {
    return fs.readFileSync(TEMPLATE_PATH);
  } catch {
    serverLog(`SEPA-Vorlage nicht lesbar: ${TEMPLATE_PATH}`);
    throw new Error(
      'SEPA-Lastschriftmandat-Vorlage (src/templates/sepa-mandat-032-03.pdf) nicht gefunden',
    );
  }
}

/** Entfernt die Vorlagenelemente aus Seite + AcroForm (nach Feldname) */
function entferneVorlagenelemente(doc: PDFDocument) {
  const toRemove = new Set(ZU_ENTFERNENDE_VORLAGENFELDER);
  const nameOf = (dict: PDFDict): string | null => {
    try {
      const t = dict.lookup(PDFName.of('T'));
      // In dieser Vorlage ist /T ein PDFString (beide Typen unterstützen
      // decodeText(); toString() liefert die PDF-Form inkl. Klammern und
      // wäre damit nicht vergleichbar).
      if (t instanceof PDFString) return t.decodeText();
      if (t instanceof PDFName) return t.decodeText();
      return null;
    } catch {
      return null;
    }
  };

  const annots = doc
    .getPage(0)
    .node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (annots) {
    for (let i = annots.size() - 1; i >= 0; i--) {
      try {
        const dict = annots.lookup(i, PDFDict);
        if (dict && toRemove.has(nameOf(dict) || '')) annots.remove(i);
      } catch {
        /* ignorieren */
      }
    }
  }

  const acro = doc.getForm().acroForm.dict;
  const fields = acro.lookupMaybe(PDFName.of('Fields'), PDFArray);
  if (fields) {
    for (let i = fields.size() - 1; i >= 0; i--) {
      try {
        const dict = fields.lookup(i, PDFDict);
        if (dict && toRemove.has(nameOf(dict) || '')) fields.remove(i);
      } catch {
        /* ignorieren */
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Zeichen-Helfer
 * ------------------------------------------------------------------ */

/** Ein Feld: Label (klein) über einer Linie, Wert (falls vorhanden) darauf */
function zeichneFeld(
  page: ReturnType<PDFDocument['getPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  x: number,
  breite: number,
  labelY: number,
  wertY: number,
  label: string,
  wert: string | undefined,
) {
  page.drawText(label, { x, y: labelY, size: LABEL_SIZE, font, color: SCHWARZ });

  if (wert && wert.trim()) {
    let size = VALUE_SIZE;
    const maxB = breite - 3;
    while (size > 7 && font.widthOfTextAtSize(wert.trim(), size) > maxB) {
      size -= 0.5;
    }
    page.drawText(wert.trim(), {
      x: x + 1.5,
      y: wertY,
      size,
      font,
      color: SCHWARZ,
    });
  }

  page.drawLine({
    start: { x, y: wertY - 1.4 },
    end: { x: x + breite, y: wertY - 1.4 },
    thickness: 0.6,
    color: LINIE,
  });
}

type Person = {
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
};

/** Zeichnet den 5-Felder-Block (Vorname,Name / Straße / PLZ,Ort) in einer Spalte */
function zeichnePerson(
  page: ReturnType<PDFDocument['getPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  x: number,
  person: Person,
) {
  zeichneFeld(page, font, x, SUB, R1_L, R1_V, 'Vorname', person.vorname);
  zeichneFeld(page, font, x + SUB, VAL_W - SUB, R1_L, R1_V, 'Name', person.nachname);
  zeichneFeld(page, font, x, VAL_W, R2_L, R2_V, 'Straße', person.strasse);
  zeichneFeld(page, font, x, PLZ_W, R3_L, R3_V, 'PLZ', person.plz);
  zeichneFeld(page, font, x + PLZ_W, VAL_W - PLZ_W, R3_L, R3_V, 'Ort', person.ort);
}

class SepaMandatPdfService {
  async createPdf(data: SepaMandatFormData): Promise<ArrayBuffer> {
    try {
      serverLog(
        `SEPA-Lastschriftmandat PDF: Regionalgruppe ${data.regionalgruppe}`,
      );

      const doc = await PDFDocument.load(readTemplate());
      entferneVorlagenelemente(doc);

      const font = await doc.embedFont('Helvetica');
      const fontBold = await doc.embedFont('Helvetica-Bold');
      const page = doc.getPage(0);

      // ---- Adressblock der zuständigen Regionalgruppe (aus der JSON) -----
      const zeilen = getAdresszeilen(data.regionalgruppe);
      const coverUnten =
        Math.max(
          1,
          zeilen.length,
        ) === 0
          ? ADRESS_OBERE_BASELINE - ADRESS_ZEILEN_ABSTAND
          : ADRESS_OBERE_BASELINE - (Math.max(1, zeilen.length) - 1) * ADRESS_ZEILEN_ABSTAND - 10;
      page.drawRectangle({
        x: ADRESS_COVER_X,
        y: coverUnten,
        width: ADRESS_COVER_BREITE,
        height: ADRESS_COVER_OBEN - coverUnten,
        color: WEISS,
      });
      let y = ADRESS_OBERE_BASELINE;
      zeilen.forEach((zeile, index) => {
        page.drawText(zeile, {
          x: ADRESS_X,
          y,
          size: 11,
          font: index === 0 ? fontBold : font,
          color: SCHWARZ,
        });
        y -= ADRESS_ZEILEN_ABSTAND;
      });

      // ---- Gläubiger-Identifikationsnummer (aus der JSON) ----------------
      page.drawRectangle({ ...GLAEUBIGER_COVER, color: WEISS });
      page.drawText(
        `Gläubiger-Identifikationsnummer: ${GLAEUBIGER_ID}. Mandatsreferenz ist die Mitgliedsnummer.`,
        { x: GLAEUBIGER_X, y: GLAEUBIGER_Y, size: 10, font, color: SCHWARZ },
      );

      // ---- Große Abdeckung: alte Kontodaten + Footer ----------------------
      page.drawRectangle({ ...GROSSE_COVER, color: WEISS });

      // ---- Daten: Kontoinhaber = abweichend ? kontoinhaber : mitglied ----
      const mitglied: Person = {
        vorname: data.mitglied?.vorname ?? '',
        nachname: data.mitglied?.nachname ?? '',
        strasse: data.mitglied?.strasse ?? '',
        plz: data.mitglied?.plz ?? '',
        ort: data.mitglied?.ort ?? '',
      };
      const quelle: Person = data.abweichenderKontoinhaber ? data.kontoinhaber : data.mitglied;
      const konto: Person = {
        vorname: quelle?.vorname ?? '',
        nachname: quelle?.nachname ?? '',
        strasse: quelle?.strasse ?? '',
        plz: quelle?.plz ?? '',
        ort: quelle?.ort ?? '',
      };

      // ---- Kopfzeilen der beiden Blöcke ----------------------------------
      page.drawText('Mitglied', { x: L_X, y: H_Y, size: 11, font: fontBold, color: SCHWARZ });
      page.drawText('Kontoinhaber', { x: R_X, y: H_Y, size: 11, font: fontBold, color: SCHWARZ });

      // ---- Mitglied (links) | Kontoinhaber (rechts) ----------------------
      zeichnePerson(page, font, L_X, mitglied);
      zeichnePerson(page, font, R_X, konto);

      // ---- Konto / Bank (Vollbreite, Konto des Kontoinhabers) ------------
      zeichneFeld(page, font, L_X, 250, R4_L, R4_V, 'IBAN', data.iban);
      zeichneFeld(page, font, L_X, 120, R5_L, R5_V, 'BIC', data.bic);
      zeichneFeld(page, font, L_X + 250, 215, R5_L, R5_V, 'Kreditinstitut', data.kreditinstitut);

      // ---- Ort, Datum | Unterschrift -------------------------------------
      zeichneFeld(page, font, L_X, 195, SIGN_L, SIGN_V, 'Ort, Datum', undefined);
      zeichneFeld(page, font, R_X, VAL_W, SIGN_L, SIGN_V, 'Unterschrift', undefined);

      const bytes = await doc.save();
      serverLog('SEPA-Lastschriftmandat PDF erfolgreich erstellt');
      return bytes.buffer as ArrayBuffer;
    } catch (error) {
      console.error('Fehler bei der SEPA-Lastschriftmandat-PDF-Generierung:', error);
      serverLog(
        `Fehler bei SEPA-PDF-Generierung: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

let sepaMandatPdfService: SepaMandatPdfService | null = null;

export function getSepaMandatPdfService(): SepaMandatPdfService {
  if (!sepaMandatPdfService) {
    sepaMandatPdfService = new SepaMandatPdfService();
  }
  return sepaMandatPdfService;
}
