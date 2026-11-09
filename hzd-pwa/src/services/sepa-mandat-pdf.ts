import fs from 'fs';
import path from 'path';
import {
  PDFDocument,
  PDFName,
  PDFBool,
  PDFTextField,
  PDFArray,
  PDFDict,
  rgb,
} from 'pdf-lib';
import {
  GLAEUBIGER_ID,
  REGIONALGRUPPEN,
  getAdresszeilen,
} from '../lib/sepa-mandat-validation';
import { serverLog } from '../lib/server-only';
import type { SepaMandatFormData } from '../types/sepa-mandat-form';

/**
 * SepaMandatPdfService – generiert das SEPA-Lastschriftmandat (HZD Formular 032,
 * Version 03) auf Basis der Original-Vorlage src/templates/sepa-mandat-032-03.pdf.
 *
 * Vorgehen pro PDF:
 * 1. Die in der Vorlage versteckten Adress-Buttons (je einer pro RG mit
 *    eingebackener Adresse) werden entfernt.
 * 2. Die Adresszeilen der zuständigen Regionalgruppe (aus
 *    config/regionalgruppen-adressen.json) werden an der Originalposition
 *    gezeichnet.
 * 3. Die Gläubiger-Identifikationsnummer (ebenfalls aus der JSON) wird
 *    an der Originalposition gezeichnet.
 * 4. Die Kontodaten werden als echte PDF-Formularwerte eingetragen.
 * 5. Im Regionalgruppen-Grid wird nur bei gewählter RG ein 'x' markiert –
 *    ist keine RG gewählt, bleibt das Grid unbezeichnet.
 */

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'src',
  'templates',
  'sepa-mandat-032-03.pdf',
);

// Versteckte Buttons in der Vorlage, die die eingebackenen Adressen tragen
const VERSTECKTE_ADRESS_BUTTONS = [
  'Ost',
  'Nord',
  'Süd',
  'Mitte',
  'West',
  'Präsidium',
];

// Geometrie (PDF-Punkte, Ursprung links unten) – orientiert an der Originalvorlage
const ADRESS_X = 72.2;
const ADRESS_OBERE_BASELINE = 719;
const ADRESS_ZEILEN_ABSTAND = 26;
const ADRESS_COVER_X = 64;
const ADRESS_COVER_BREITE = 290;
const ADRESS_COVER_OBEN = 738;
const GLAEUBIGER_BASELINE = 450;
const GLAEUBIGER_COVER = { x: 64, y: 440, width: 500, height: 22 };

const ADRESSE_FONT_SIZE = 11;
const TEXT_FONT_SIZE = 10;

/**
 * Checkbox-Grid: die 5 Label-Positionen stammen aus der Vorlage
 * (Koordinaten der /Ch-Felder 'RG Ost' … 'RG West'), 'HZD' ist der
 * sechste Slot direkt darunter.
 */
const CHECKBOX_SLOTS: Array<{
  rg: string;
  x: number;
  y: number;
  label?: string;
}> = [
  { rg: 'Ost', x: 361.3, y: 717.7 },
  { rg: 'Nord', x: 434.6, y: 717.3 },
  { rg: 'Süd', x: 361.3, y: 677.6 },
  { rg: 'Mitte', x: 433.7, y: 677.6 },
  { rg: 'West', x: 360.9, y: 638.7 },
  { rg: 'HZD', x: 360.9, y: 599.7, label: 'HZD' },
];
const BOX_GROESSE = 6;
const BOX_ABSTAND_VOR_LABEL = 9;
const BOX_OFFSET_IN_LABEL = 7;

const WEISS = rgb(1, 1, 1);
const SCHWARZ = rgb(0, 0, 0);

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

/** Entfernt die versteckten Adress-Buttons aus Seite + AcroForm */
function entferneAdressButtons(doc: PDFDocument) {
  const toRemove = new Set(VERSTECKTE_ADRESS_BUTTONS);
  const nameOf = (dict: PDFDict): string | null => {
    try {
      const t = dict.lookup(PDFName.of('T'));
      return t ? t.toString() : null;
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
  // Viewer sollen die Werte der Textfelder selbst aufbereiten
  acro.set(PDFName.of('NeedAppearances'), PDFBool.True);
}

/** Trägt einen Wert in das Textfeld mit dem Namen ein (Leerzeichen für IBAN/BIC gestrichen) */
function fülleTextfeld(
  doc: PDFDocument,
  name: string,
  wert: string,
): boolean {
  const form = doc.getForm();
  const field = form
    .getFields()
    .find((f): f is PDFTextField => f instanceof PDFTextField && f.getName() === name);
  if (!field || !wert) return false;
  let text = wert;
  try {
    if (field.getMaxLength() !== undefined) text = wert.replace(/\s+/g, '');
  } catch {
    /* ohne MaxLength */
  }
  try {
    field.setText(text);
  } catch {
    field.removeMaxLength();
    field.setText(text);
  }
  return true;
}

class SepaMandatPdfService {
  async createPdf(data: SepaMandatFormData): Promise<ArrayBuffer> {
    try {
      serverLog(
        `SEPA-Lastschriftmandat PDF: Regionalgruppe ${data.regionalgruppe}`,
      );

      const doc = await PDFDocument.load(readTemplate());
      entferneAdressButtons(doc);

      const helvetica = await doc.embedFont('Helvetica');
      const helveticaBold = await doc.embedFont('Helvetica-Bold');
      const page = doc.getPage(0);

      // ---- Adressblock der zuständigen Regionalgruppe (aus der JSON)
      // eingebackenen Adressbereich der Vorlage überdecken
      const zeilen = getAdresszeilen(data.regionalgruppe);
      const coverUnten =
        ADRESS_OBERE_BASELINE -
        Math.max(1, zeilen.length - 1) * ADRESS_ZEILEN_ABSTAND -
        8;
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
          size: ADRESSE_FONT_SIZE,
          font: index === 0 ? helveticaBold : helvetica,
          color: SCHWARZ,
        });
        y -= ADRESS_ZEILEN_ABSTAND;
      });

      // ---- Gläubiger-Identifikationsnummer (aus der JSON)
      page.drawRectangle({ ...GLAEUBIGER_COVER, color: WEISS });
      page.drawText(
        `Gläubiger-Identifikationsnummer: ${GLAEUBIGER_ID}. Mandatsreferenz ist die Mitgliedsnummer.`,
        {
          x: ADRESS_X,
          y: GLAEUBIGER_BASELINE,
          size: TEXT_FONT_SIZE,
          font: helvetica,
          color: SCHWARZ,
        },
      );

      // ---- Regionalgruppen-Grid: 'x' nur bei gewählter RG, sonst keines
      const gewaehlt = REGIONALGRUPPEN.includes(data.regionalgruppe ?? '')
        ? data.regionalgruppe
        : null;
      for (const slot of CHECKBOX_SLOTS) {
        const bx = slot.x - BOX_ABSTAND_VOR_LABEL;
        const by = slot.y + BOX_OFFSET_IN_LABEL;
        page.drawRectangle({
          x: bx,
          y: by,
          width: BOX_GROESSE,
          height: BOX_GROESSE,
          borderColor: SCHWARZ,
          borderWidth: 0.8,
        });
        if (slot.label) {
          page.drawText(slot.label, {
            x: slot.x + 2,
            y: by + 6,
            size: 12,
            font: helvetica,
            color: SCHWARZ,
          });
        }
        if (gewaehlt === slot.rg) {
          page.drawText('x', {
            x: bx + 0.6,
            y: by + 0.4,
            size: 8,
            font: helveticaBold,
            color: SCHWARZ,
          });
        }
      }

      // ---- Kontodaten (wahre PDF-Formularwerte)
      fülleTextfeld(doc, 'Vorname', data.vorname);
      fülleTextfeld(doc, 'Name', data.nachname);
      fülleTextfeld(doc, 'Straße', data.strasse);
      fülleTextfeld(doc, 'PLZ', data.plz);
      fülleTextfeld(doc, 'Ort', data.ort);
      fülleTextfeld(doc, 'IBAN', data.iban);
      fülleTextfeld(doc, 'Kreditinstitut', data.kreditinstitut);
      // BIC ist optional (nur bei Konten im Ausland erforderlich)
      if (data.bic) {
        const bic = doc
          .getForm()
          .getFields()
          .find(
            (f): f is PDFTextField =>
              f instanceof PDFTextField && f.getName().includes('BIC'),
          );
        if (bic) {
          const text = data.bic.replace(/\s+/g, '');
          try {
            bic.setText(text);
          } catch {
            bic.removeMaxLength();
            bic.setText(text);
          }
        }
      }

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
