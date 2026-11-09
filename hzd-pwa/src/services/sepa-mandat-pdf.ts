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
  getFinanverwaltungContact,
  finanContactAddressLines,
  getGlaeubigerId,
} from '../lib/server/finanverwaltung';
import { HZD_LOGO_ASPECT } from '../lib/hzd-logo';
import { serverLog } from '../lib/server-only';
import type { SepaMandatFormData, SepaMandatPerson } from '../types/sepa-mandat-form';

/**
 * SepaMandatPdfService – generiert das SEPA-Lastschriftmandat (HZD Formular 032,
 * Version 03) auf Basis der Original-Vorlage src/templates/sepa-mandat-032-03.pdf.
 *
 * Vorgehen pro PDF:
 * 1. ALLE Formular-Felder der Vorlage werden entfernt (versteckte Adress-Buttons,
 *    Regionalgruppen-Grid, Bedien-Buttons, gelbe Hinweisbox, Kontodaten-Felder…) –
 *    die Daten werden statisch kompakt gezeichnet.
 * 2. Der Adressblock der zuständigen Finanzverwaltung (je nach Regionalgruppe
 *    aus Strapi > HZD Settings, inkl. E-Mail-Adressen unter der Postanschrift)
 *    wird an der Originalposition gezeichnet – der eingebackene Adressbereich
 *    der Vorlage wird überdeckt.
 * 3. Die Gläubiger-Identifikationsnummer (aus Strapi > HZD Settings) wird an
 *    der Originalposition gezeichnet.
 *    Überschrift 'SEPA-Lastschriftmandat' + Zustimmungstext (statischer
 *    Vorlagentext) werden überdeckt und bündig mit dem Mitglied-Block
 *    (linke Kante x=60) neu gezeichnet.
 * 4. Das alte Logo oben rechts in der Vorlage wird überdeckt und durch das
 *    aktuelle HZD-Logo (public/hzd-logo.png) ersetzt.
 * 5. Kompakter Zwei-Spalten-Block 'Mitglied' | 'Kontoinhaber' (je Vorname, Name,
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
 * entfernt, damit die Inhalte statisch als Text gezeichnet werden können
 * (keine Formularwerte mehr nötig).
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

// Linke Textkante: bündig mit den Blöcken 'Mitglied'/'Kontoinhaber' (L_X = 60).
// Die Vorlage steht auf x=72,2 – Adressblock, Überschrift, Zustimmungstext und
// Gläubiger-Zeile werden deshalb alle bei x=60 (neu) gezeichnet.
const TEXT_X = 60;

// Adressblock (oben links) – eingebackene Vorlagen-Adresse + evtl. E-Mails
const ADRESS_X = TEXT_X;
const ADRESS_OBERE_BASELINE = 719;
const ADRESSE_FONT_SIZE = 11;
// Zeilenabstand innerhalb des Adressblocks (11-pt-Schrift).
const ADRESS_ZEILENABSTAND = 14;
// Zusätzlicher Abstand nach der Postanschrift (ZipCity), vor den E-Mail-Adressen.
const ABSTAND_NACH_POSTANSCHRIFT = 12;
const ADRESS_COVER_X = 58;
const ADRESS_COVER_BREITE = 305;
const ADRESS_COVER_OBEN = 742;

// Gläubiger-Identifikationsnummer: die statische Zeile der Vorlage erstreckt
// sich über bottomY 446,4–455,8 (Baseline ≈ 449) – Abdeckung muss sie komplett
// einschließen (inkl. Absteigern), daher unten bis 443, oben über gezeichnete
// Zeile (Baseline 455, Top ≈ 462).
const GLAEUBIGER_COVER = { x: 58, y: 443, width: 488, height: 22 };
const GLAEUBIGER_X = TEXT_X;
const GLAEUBIGER_Y = 455;
const GLAEUBIGER_FONT_SIZE = 10;

// Überschrift + Zustimmungstext der Vorlage (statisch, x=72,2):
// Um die linke Kante bündig mit dem Mitglied-Block (x=TEXT_X) zu stellen,
// wird die Vorlage mit Weiß überdeckt und der Text bei x=TEXT_X neu gezeichnet.
// Schriftarten via Breitenmessung ermittelt (Ziel: Titel 150,7 / L1 424,7 / L2 466,8 pt):
const TITEL_BASELINE = 546.2; // gemessen: Box 546,2–556,4
const TITEL_FONT_SIZE = 14; // Helvetica-Bold ≈ 150,8 pt
const PARAGRAPH_BASELINES = [520.4, 508.4, 496.4, 484.4, 472.4]; // gemessen, Zeilenabstand 12
const PARAGRAPH_FONT_SIZE = 9.5; // Helvetica ≈ L1 425,0 / L2 467,8 pt
const TITEL_PARAGRAPH_COVER = { x: 55, y: 468, width: 495, height: 92 };
const PARAGRAPH_TEXT = [
  'Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift',
  'einzuziehen. Zugleich weise ich mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto',
  'gezogenen Lastschriften einzulösen.',
  'Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des',
  'belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.',
];

// Altes Logo der Vorlage (oben rechts, neben dem "www.hovawarte.com"-Streifen):
// gemessen bei 300 dpi auf x 525,6–577,0 pt und 26,2–70,3 pt ab Seitenoberkante.
// Überdeckungsrechteck mit Sicherheitsrand (Ursprung links unten, A4 = 842 pt hoch).
const LOGO_COVER = { x: 524.5, y: 770.5, width: 54, height: 46.5 };

// Große weiße Abdeckung: statisches 'Kontoinhaber'-Label + alte Kontodaten-
// Bereiche (inkl. rechter Randstriche) + Footer (eingerahmte Versionstabelle
// Bereich/Formularnummer/Version/Datum/Bearbeiter/…). Deckt y≈6…394,
// lässt den SEPA-Text oben (Gläubiger-Zeile ~456) intakt.
const GROSSE_COVER = { x: 55, y: 4, width: 505, height: 390 };

// Zwei Spalten: Links = Mitglied, Rechts = Kontoinhaber
const L_X = 60;
const R_X = 305;
const VAL_W = 232; // Breite eines vollen Feldes in einer Spalte
const SUB = 118; // Aufteilung: Vorname | Name (118 + 114)
const PLZ_W = 70;

// Zeilen (Label-Baseline / Wert-Baseline): Reihenfolge von oben nach unten.
// Über der Bankverbindung (IBAN) und darunter (Ort/Datum) gibt es einen
// deutlich größeren Abschnittsabstand als innerhalb der Blöcke.
const H_Y = 385; // Kopfzeilen 'Mitglied' | 'Kontoinhaber'
const R1_L = 363, R1_V = 350; // Vorname | Name
const R2_L = 333, R2_V = 320; // Straße
const R3_L = 303, R3_V = 290; // PLZ | Ort (= untere Grenze der Person-Blöcke, Linie bei 288,6)
const R4_L = 248, R4_V = 235; // IBAN (Vollbreite) – ca. 40 pt Abstand zur Block-Linie
const R5_L = 214, R5_V = 201; // BIC | Kreditinstitut (Vollbreite)
const SIGN_L = 160, SIGN_V = 147; // Ort, Datum | Unterschrift – ca. 40 pt Abstand zur Bankzeile

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

/** Entfernt ALLE Vorlagen-Felder aus Seite + AcroForm (nach Feldname) */
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

/** Zeichnet den 5-Felder-Block (Vorname,Name / Straße / PLZ,Ort) in einer Spalte */
function zeichnePerson(
  page: ReturnType<PDFDocument['getPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  x: number,
  person: SepaMandatPerson,
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

      // ---- Adressblock: zuständige Finanzverwaltung (Strapi > HZD Settings)
      // E-Mail-Adressen unter der Postanschrift. Ohne Regionalgruppe oder
      // ohne hinterlegten Kontakt bleibt der Adressblock leer.
      let adressZeilen: string[] = [];
      let mailZeilen: string[] = [];
      try {
        const contact = await getFinanverwaltungContact(data.regionalgruppe);
        adressZeilen = finanContactAddressLines(contact);
        mailZeilen = contact?.emails ?? [];
      } catch (error) {
        console.error('Fehler beim Laden der Finanzverwaltung-Adresse:', error);
      }
      const mitAbstand =
        adressZeilen.length > 0 && mailZeilen.length > 0;
      const zeilenGesamt =
        adressZeilen.length + mailZeilen.length + (mitAbstand ? 1 : 0);
      const spannung =
        Math.max(0, zeilenGesamt - 1) * ADRESS_ZEILENABSTAND +
        (mitAbstand ? ABSTAND_NACH_POSTANSCHRIFT : 0);
      const coverUnten = ADRESS_OBERE_BASELINE - spannung - 8;
      page.drawRectangle({
        x: ADRESS_COVER_X,
        y: coverUnten,
        width: ADRESS_COVER_BREITE,
        height: ADRESS_COVER_OBEN - coverUnten,
        color: WEISS,
      });

      let y = ADRESS_OBERE_BASELINE;
      adressZeilen.forEach((zeile, index) => {
        page.drawText(zeile, {
          x: ADRESS_X,
          y,
          size: ADRESSE_FONT_SIZE,
          font: index === 0 ? fontBold : font,
          color: SCHWARZ,
        });
        y -= ADRESS_ZEILENABSTAND;
      });
      if (mailZeilen.length > 0) {
        if (mitAbstand) y -= ABSTAND_NACH_POSTANSCHRIFT;
        mailZeilen.forEach((mail) => {
          page.drawText(mail, {
            x: ADRESS_X,
            y,
            size: ADRESSE_FONT_SIZE,
            font,
            color: SCHWARZ,
          });
          y -= ADRESS_ZEILENABSTAND;
        });
      }

      // ---- Gläubiger-Identifikationsnummer (Strapi > HZD Settings) ----------
      let glaeubigerId: string | null = null;
      try {
        glaeubigerId = await getGlaeubigerId();
      } catch (error) {
        console.error('Fehler beim Laden der Gläubiger-Identifikationsnummer:', error);
      }
      const glaeubigerText = glaeubigerId
        ? `Gläubiger-Identifikationsnummer: ${glaeubigerId}. Mandatsreferenz ist die Mitgliedsnummer.`
        : `Mandatsreferenz ist die Mitgliedsnummer.`;
      page.drawRectangle({ ...GLAEUBIGER_COVER, color: WEISS });
      page.drawText(
        glaeubigerText,
        {
          x: GLAEUBIGER_X,
          y: GLAEUBIGER_Y,
          size: GLAEUBIGER_FONT_SIZE,
          font,
          color: SCHWARZ,
        },
      );

      // ---- Überschrift + Zustimmungstext: linke Kante bündig zum
      // Mitglied-Block (x=TEXT_X). Statische Vorlagenschrift (x=72,2) überdecken
      // und mit der gemessenen Originalschrift neu zeichnen.
      page.drawRectangle({ ...TITEL_PARAGRAPH_COVER, color: WEISS });
      page.drawText('SEPA-Lastschriftmandat', {
        x: TEXT_X,
        y: TITEL_BASELINE,
        size: TITEL_FONT_SIZE,
        font: fontBold,
        color: SCHWARZ,
      });
      PARAGRAPH_TEXT.forEach((zeile, i) => {
        page.drawText(zeile, {
          x: TEXT_X,
          y: PARAGRAPH_BASELINES[i],
          size: PARAGRAPH_FONT_SIZE,
          font,
          color: SCHWARZ,
        });
      });

      // ---- HZD-Logo: alte Logo-Grafik der Vorlage überdecken und
      // das aktuelle HZD-Logo (Quadrat, transparent) an gleicher Stelle zeichnen.
      page.drawRectangle({ ...LOGO_COVER, color: WEISS });
      const logoFile = path.join(process.cwd(), 'public', 'hzd-logo.png');
      if (fs.existsSync(logoFile)) {
        // Logo mit Seitenverhältnis in das Überdeckungsrechteck einpassen
        let logoW = LOGO_COVER.width;
        let logoH = logoW / HZD_LOGO_ASPECT;
        if (logoH > LOGO_COVER.height) {
          logoH = LOGO_COVER.height;
          logoW = logoH * HZD_LOGO_ASPECT;
        }
        const logoX = LOGO_COVER.x + (LOGO_COVER.width - logoW) / 2;
        const logoY = LOGO_COVER.y + (LOGO_COVER.height - logoH) / 2;
        const embeddedLogo = await doc.embedPng(fs.readFileSync(logoFile));
        page.drawImage(embeddedLogo, {
          x: logoX,
          y: logoY,
          width: logoW,
          height: logoH,
        });
      }

      // ---- Große Abdeckung: alte Kontodaten + Footer ----------------------
      page.drawRectangle({ ...GROSSE_COVER, color: WEISS });

      // ---- Daten: Kontoinhaber = abweichend ? kontoinhaber : mitglied ----
      const mitglied: SepaMandatPerson = {
        vorname: data.mitglied?.vorname ?? '',
        nachname: data.mitglied?.nachname ?? '',
        strasse: data.mitglied?.strasse ?? '',
        plz: data.mitglied?.plz ?? '',
        ort: data.mitglied?.ort ?? '',
      };
      const quelle: SepaMandatPerson = data.abweichenderKontoinhaber
        ? data.kontoinhaber
        : data.mitglied;
      const konto: SepaMandatPerson = {
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
