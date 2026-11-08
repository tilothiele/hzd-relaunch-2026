import jsPDF from 'jspdf';
import regionalgruppenAdressen from '../config/regionalgruppen-adressen.json';
import { serverLog } from '../lib/server-only';
import type { SepaMandatFormData } from '../types/sepa-mandat-form';

const MARGIN = 15;

// Statische Kopf-/Fussdaten des Formulars (Vorlage HZD Formular 032, Version 03)
const GLAEUBIGER_ID = 'DE79 ZZZ0 0000 5154 60';
const FOOTER = {
  bereich: 'Präsidium',
  verantwortlich: 'Präsidium',
  bearbeiter: 'Dietmar Krohn',
  formularnummer: '032',
  version: '03',
  formularDatum: '17.03.2021',
};

const MANDAT_TEXT_1 =
  'Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. ' +
  'Zugleich weise ich mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen.';

const MANDAT_TEXT_2 =
  'Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. ' +
  'Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.';

const HINWEIS_TEXT =
  'Bitte senden Sie das ausgefüllte Formular an den Finanzverwalter Ihrer zuständigen Regionalgruppe:';

/**
 * SepaMandatPdfService - Generiert das SEPA-Lastschriftmandat (HZD Formular 032)
 * als PDF. Der Adressblock oben links stammt aus config/regionalgruppen-adressen.json
 * und hängt von der gewählten Regionalgruppe ab.
 */
class SepaMandatPdfService {
  async createPdf(data: SepaMandatFormData): Promise<ArrayBuffer> {
    try {
      serverLog(`SEPA-Lastschriftmandat PDF: Regionalgruppe ${data.regionalgruppe}`);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * MARGIN;

      pdf.setTextColor(0, 0, 0);

      // ---- Kopf links: Adressblock der zuständigen Regionalgruppe
      const adressen = regionalgruppenAdressen as Record<string, string[]>;
      const zeilen: string[] = Array.isArray(adressen[data.regionalgruppe])
        ? adressen[data.regionalgruppe]
        : [];

      let addressBottom = MARGIN + 2;
      const addressLineGap = 4.8;
      zeilen.forEach((zeile, index) => {
        const y = MARGIN + 2 + index * addressLineGap;
        pdf.setFont('helvetica', index === 0 ? 'bold' : 'normal');
        pdf.setFontSize(index === 0 ? 10.5 : 9.5);
        pdf.text(zeile, MARGIN, y);
      });
      addressBottom = MARGIN + 2 + Math.max(0, zeilen.length - 1) * addressLineGap + 5;

      // ---- Kopf rechts: Hinweis + Regionalgruppen-Checkboxen
      const rightX = 118;
      const rightWidth = pageWidth - MARGIN - rightX;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const hinweisZeilen = pdf.splitTextToSize(HINWEIS_TEXT, rightWidth);
      pdf.text(hinweisZeilen, rightX, MARGIN + 2);

      const gridTop = MARGIN + 2 + hinweisZeilen.length * 3.6 + 6;
      const keys = Object.keys(adressen);
      const colGap = 36;
      const rowGap = 5.5;
      const boxSize = 3;

      keys.forEach((key, index) => {
        const x = rightX + (index % 2) * colGap;
        const y = gridTop + Math.floor(index / 2) * rowGap;
        pdf.rect(x, y - 2.7, boxSize, boxSize);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(key === 'HZD' ? 'HZD' : `RG ${key}`, x + boxSize + 1.5, y);
        if (key === data.regionalgruppe) {
          pdf.text('x', x + boxSize / 2, y, { align: 'center' });
        }
      });
      const gridBottom = gridTop + Math.ceil(keys.length / 2) * rowGap;

      // ---- Titel
      let yPos = Math.max(addressBottom, gridBottom) + 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('SEPA-Lastschriftmandat', MARGIN, yPos);
      yPos += 8;

      // ---- Mandatstext
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const para1 = pdf.splitTextToSize(MANDAT_TEXT_1, contentWidth);
      pdf.text(para1, MARGIN, yPos);
      yPos += para1.length * 4.4 + 2;

      const para2 = pdf.splitTextToSize(MANDAT_TEXT_2, contentWidth);
      pdf.text(para2, MARGIN, yPos);
      yPos += para2.length * 4.4 + 4;

      const glaebiger = `Gläubiger-Identifikationsnummer: ${GLAEUBIGER_ID}. Mandatsreferenz ist die Mitgliedsnummer.`;
      const para3 = pdf.splitTextToSize(glaebiger, contentWidth);
      pdf.text(para3, MARGIN, yPos);
      yPos += para3.length * 4.4 + 7;

      // ---- Felder (Kontoinhaber: Vorname/Nachname, Straße, PLZ/Ort)
      const rightColumnX = 110;
      const fieldRowGap = 6.5;

      const field = (x: number, y: number, label: string, value: string) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const text = (value ?? '').trim();
        pdf.text(`${label}: ${text === '' ? '_________________' : text}`, x, y);
      };

      field(MARGIN, yPos, 'Vorname', data.vorname);
      field(rightColumnX, yPos, 'Name', data.nachname);
      yPos += fieldRowGap;
      field(MARGIN, yPos, 'Straße', data.strasse);
      yPos += fieldRowGap;
      field(MARGIN, yPos, 'PLZ', data.plz);
      field(rightColumnX, yPos, 'Ort', data.ort);
      yPos += fieldRowGap;
      field(MARGIN, yPos, 'IBAN', data.iban);
      field(rightColumnX, yPos, 'BIC', data.bic);
      yPos += fieldRowGap;
      field(MARGIN, yPos, 'Kreditinstitut', data.kreditinstitut);
      yPos += fieldRowGap + 6;

      // ---- Ort, Datum / Unterschrift (werden handschriftlich ergänzt)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Ort, Datum: ____________________', MARGIN, yPos);
      pdf.text('Unterschrift: ____________________', 130, yPos);
      yPos += 6;

      // ---- Fusszeile (Formular 032 / Version 03)
      pdf.setFontSize(8);
      const footerLine1 = pageHeight - 18;
      const footerLine2 = pageHeight - 13;

      pdf.text('Bereich:', MARGIN, footerLine1);
      pdf.text(FOOTER.bereich, 33, footerLine1);
      pdf.text('Verantwortlich:', 62, footerLine1);
      pdf.text(FOOTER.verantwortlich, 90, footerLine1);
      pdf.text('Bearbeiter:', 122, footerLine1);
      pdf.text(FOOTER.bearbeiter, 143, footerLine1);

      pdf.text('Formularnummer:', MARGIN, footerLine2);
      pdf.text(FOOTER.formularnummer, 42, footerLine2);
      pdf.text('Version', 62, footerLine2);
      pdf.text(FOOTER.version, 85, footerLine2);
      pdf.text('Datum', 122, footerLine2);
      pdf.text(FOOTER.formularDatum, 138, footerLine2);
      pdf.text('Seite 1 von 1', pageWidth - MARGIN, footerLine2, { align: 'right' });

      const pdfBuffer = pdf.output('arraybuffer');
      serverLog('SEPA-Lastschriftmandat PDF erfolgreich erstellt');
      return pdfBuffer;
    } catch (error) {
      console.error('Fehler bei der SEPA-Lastschriftmandat-PDF-Generierung:', error);
      serverLog(`Fehler bei SEPA-PDF-Generierung: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Singleton-Instanz
let sepaMandatPdfService: SepaMandatPdfService | null = null;

export function getSepaMandatPdfService(): SepaMandatPdfService {
  if (!sepaMandatPdfService) {
    sepaMandatPdfService = new SepaMandatPdfService();
  }
  return sepaMandatPdfService;
}
