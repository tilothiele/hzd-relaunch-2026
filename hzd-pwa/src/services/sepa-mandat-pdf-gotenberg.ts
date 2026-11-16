import fs from 'node:fs';
import path from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import {
  getFinanverwaltungContact,
  finanContactAddressLines,
  getGlaeubigerId,
} from '@/lib/server/finanverwaltung';
import { convertOfficeDocumentToPdf } from '@/lib/gotenberg';
import { serverLog } from '@/lib/server-only';
import type { SepaMandatFormData } from '@/types/sepa-mandat-form';

/**
 * SEPA-Lastschriftmandat (HZD Formular 032) – Template-basierter PDF-Generator.
 *
 * Ablauf:
 *   1. DOCX-Vorlage `src/templates/sepa-mandat-032.docx` (docxtemplater-Tags
 *      in Form von {{plazhalter}}) auslesen und mit Formulardaten + Strapi-Daten
 *      (Finanzverwaltung, Gläubiger-Identifikationsnummer) befüllen.
 *   2. Ergebnis an den Gotenberg-Server (/forms/libreoffice/convert) senden,
 *      der die befüllte Datei per LibreOffice in PDF umwandelt.
 *
 * Die Vorlage kann in Word oder LibreOffice geöffnet und verfeinert werden;
 * vorhandene {{…}}-Platzhalter bitte erhalten, neue Platzhalter in derselben
 * Notation ergänzen und sie anschließend in buildSepaMandatModel pflegen.
 */

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'src',
  'templates',
  'sepa-mandat-032.docx',
);
const GOTENBERG_FILENAME = 'SEPA-Lastschriftmandat.docx';

/** Platzhaltermodell der DOCX-Vorlage. */
export interface SepaMandatTemplateModel {
  finanverwaltung_adresse: string;
  finanverwaltung_mail: string;
  glaeubiger_info: string;
  mitglied_vorname: string;
  mitglied_name: string;
  mitglied_strasse: string;
  mitglied_plz: string;
  mitglied_ort: string;
  kontoinhaber_vorname: string;
  kontoinhaber_name: string;
  kontoinhaber_strasse: string;
  kontoinhaber_plz: string;
  kontoinhaber_ort: string;
  iban: string;
  bic: string;
  kreditinstitut: string;
}

/**
 * Baut das Platzhaltermodell aus Formulardaten und Strapi-Daten.
 * Bei Strapi-Fehlern (wie bisher) bleiben die betroffenen Zeilen leer.
 * Bei nicht abweichendem Kontoinhaber werden die Mitglied-Daten wiederholt.
 */
export async function buildSepaMandatModel(
  data: SepaMandatFormData,
): Promise<SepaMandatTemplateModel> {
  let adressZeilen: string[] = [];
  let mail: string = '';
  try {
    const contact = await getFinanverwaltungContact(data.regionalgruppe);
    adressZeilen = finanContactAddressLines(contact);
    mail = (contact?.emails ?? []).join(', ');
  } catch (error) {
    console.error('Fehler beim Laden der Finanzverwaltung-Adresse:', error);
  }

  let glaeubigerId: string | null = null;
  try {
    glaeubigerId = await getGlaeubigerId();
  } catch (error) {
    console.error(
      'Fehler beim Laden der Gläubiger-Identifikationsnummer:',
      error,
    );
  }

  const kontoinhaber = data.abweichenderKontoinhaber
    ? data.kontoinhaber
    : data.mitglied;

  const t = (value: string | undefined) => value?.trim() ?? '';

  return {
    finanverwaltung_adresse: adressZeilen.join('\n'),
    finanverwaltung_mail: mail,
    glaeubiger_info: glaeubigerId
      ? `Gläubiger-Identifikationsnummer: ${glaeubigerId}. Mandatsreferenz ist die Mitgliedsnummer.`
      : 'Mandatsreferenz ist die Mitgliedsnummer.',
    mitglied_vorname: t(data.mitglied?.vorname),
    mitglied_name: t(data.mitglied?.nachname),
    mitglied_strasse: t(data.mitglied?.strasse),
    mitglied_plz: t(data.mitglied?.plz),
    mitglied_ort: t(data.mitglied?.ort),
    kontoinhaber_vorname: t(kontoinhaber?.vorname),
    kontoinhaber_name: t(kontoinhaber?.nachname),
    kontoinhaber_strasse: t(kontoinhaber?.strasse),
    kontoinhaber_plz: t(kontoinhaber?.plz),
    kontoinhaber_ort: t(kontoinhaber?.ort),
    iban: t(data.iban),
    bic: t(data.bic),
    kreditinstitut: t(data.kreditinstitut),
  };
}

/** Liest die DOCX-Vorlage und ersetzt die {{…}}-Platzhalter. */
export async function renderSepaMandatDocx(
  model: SepaMandatTemplateModel,
): Promise<Buffer> {
  let templateBuffer: Buffer;
  try {
    templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  } catch {
    throw new Error(
      'SEPA-Lastschriftmandat-Vorlage (src/templates/sepa-mandat-032.docx) nicht gefunden',
    );
  }

  // docxtemplater 3.x erwartet im Konstruktor ein Zip-Objekt (PizZip),
  // keinen rohen Buffer (würde mit "You passed a Buffer…" werfen).
  const zip = new PizZip(templateBuffer.toString('base64'), { base64: true });

  // docxtemplater 3.x defaultet auf einfache {…}-Delimiters; die Vorlage
  // nutzt {{Platzhalter}} → Delimiter ausdrücklich setzen.
  const doc = new Docxtemplater(zip, {
    nullGetter: () => '',
    delimiters: { start: '{{', end: '}}' },
  });
  doc.render(model);

  // PizZip.generate liefert synchron den fertigen Buffer (Node).
  return doc.getZip().generate({ type: 'nodebuffer' });
}

class SepaMandatPdfService {
  /** Erzeugt das SEPA-Lastschriftmandat als PDF (ArrayBuffer). */
  async createPdf(data: SepaMandatFormData): Promise<ArrayBuffer> {
    serverLog(
      `SEPA-Lastschriftmandat PDF (Vorlage + Gotenberg): Regionalgruppe ${data.regionalgruppe}`,
    );

    const model = await buildSepaMandatModel(data);
    const docxBuffer = await renderSepaMandatDocx(model);
    const pdfBuffer = await convertOfficeDocumentToPdf(
      docxBuffer,
      GOTENBERG_FILENAME,
    );

    serverLog(`SEPA-Lastschriftmandat PDF erfolgreich erstellt (${pdfBuffer.length} Byte)`);
    // Node-Buffers liegen auf einem ArrayBuffer (SharedArrayBuffer ist hier ausgeschlossen) →
    // exakten, eigenen ArrayBuffer an die Route zurückgeben.
    return pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength,
    ) as ArrayBuffer;
  }
}

let sepaMandatPdfService: SepaMandatPdfService | null = null;

export function getSepaMandatPdfService(): SepaMandatPdfService {
  if (!sepaMandatPdfService) {
    sepaMandatPdfService = new SepaMandatPdfService();
  }
  return sepaMandatPdfService;
}
