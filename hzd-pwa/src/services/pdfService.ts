import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import { FormData } from '../types/formData';
import { serverLog } from '../lib/server-only';
import {
  MEMBERSHIP_TYPE_HZD_VOLLMITGLIED,
  MEMBERSHIP_TYPE_OG_MITGLIED,
  MEMBERSHIP_TYPE_OG_FAMILIENMITGLIED,
  MEMBERSHIP_TYPE_HZD_FAMILIENMITGLIED,
  MEMBERSHIP_TYPE_KURZZEITMITGLIED
} from '../constants/membership-types';

/**
 * PdfService - Generiert PDF-Dokumente für Antragsformulare
 */
class PdfService {
  
  /**
   * Erstellt ein PDF-Dokument aus den Formulardaten
   * 
   * @param formData - Die Formulardaten aus dem Antragsformular
   * @returns ArrayBuffer des generierten PDFs
   */
  async createPdf(formData: FormData): Promise<ArrayBuffer> {
    try {
      serverLog(`PDF-Generierung gestartet für: ${formData.email}`);
      
      // PDF erstellen
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Header: Adresse links, Logo rechts
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      // Adresse links
      const addressLines = [
        'HZD OG Hamburg u.U.',
        'Tilo Thiele',
        'Anne-Becker-Ring 8',
        '21031 Hamburg',
        'geschaeftsstelle@hzd-og-hamburg.de'
      ];
      addressLines.forEach((line, index) => {
        pdf.text(line, margin, yPosition + (index * 3.5));
      });

      // Logo rechts
      try {
        const absoluteLogoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(absoluteLogoPath)) {
          const logoBuffer = fs.readFileSync(absoluteLogoPath);
          const logoBase64 = logoBuffer.toString('base64');
          const logoWidth = 25;
          const logoHeight = 25;
          const logoX = pageWidth - margin - logoWidth;
          const logoY = yPosition;
          pdf.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Logos:', error);
      }

      // Website rechts vertikal
      pdf.setFontSize(12);
      const yPosLogo = yPosition + 50;
      pdf.text('www.hovawart', pageWidth - 6, yPosLogo, { angle: 90 });
      const w1 = pdf.getTextWidth('www.hovawart');
      pdf.setTextColor(255, 0, 0);
      pdf.text('e', pageWidth - 6, yPosLogo - w1, { angle: 90 });
      pdf.setTextColor(0, 0, 0);
      const w2 = pdf.getTextWidth('e');
      pdf.text('.com', pageWidth - 6, yPosLogo - w1 - w2, { angle: 90 });

      yPosition += 25;

      // Haupttitel
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ortsgruppen-Aufnahmeantrag für OG Hamburg Billwerder', margin, yPosition);
      yPosition += 10;

      // Einleitungstext
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const introText = 'Hiermit beantrage ich in Anerkennung der Satzung, Ordnungen und Beschlüsse der HZD die Mitgliedschaft in der Hovawart Zuchtgemeinschaft Deutschland e.V.. Ich gehöre keinem kynologischen Verein außerhalb des Verbandes für das Deutsche Hundewesen (VDH) bzw. außerhalb der Fédération Cynologique Internationale (FCI) an. Ich bestätige, dass ich aus keinem anderen VDH-Verein ausgeschlossen wurde und dass gegen mich kein Ausschlussverfahren läuft. Ich bin weder gewerbsmäßiger Hundehändler/-züchter noch Hundeverkaufsvermittler.';
      const introLines = pdf.splitTextToSize(introText, contentWidth);
      pdf.text(introLines, margin, yPosition);
      yPosition += introLines.length * 4 + 4;

      // Funktion zum Formatieren des Datums
      const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };

      // Antragsteller-Sektion
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Antragsteller', margin, yPosition);
      yPosition += 8;

      // Antragsteller-Felder in Tabellenformat
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const fields = [
        { label: 'Anrede:', value: formData.anrede },
        { label: 'Name:', value: `${formData.vorname} ${formData.name}` },
        { label: 'Straße:', value: `${formData.strasse}` },
        { label: 'Ort:', value: `${formData.plz} ${formData.ort}` },
        { label: 'Geb.-Datum:', value: formatDate(formData.geburtsdatum) },
        { label: 'E-Mail:', value: formData.email },
        { label: 'Telefon:', value: formData.telefon }
      ];

      // Zwei Spalten
      const colWidth = (contentWidth - 10) / 2;
      const leftCol = fields.slice(0, Math.ceil(fields.length / 2));
      const rightCol = fields.slice(Math.ceil(fields.length / 2));

      // Linke Spalte
      leftCol.forEach((field, index) => {
        const x = margin;
        const y = yPosition + (index * 6);
        pdf.text(`${field.value || '_________________'}`, x, y);
      });

      // Rechte Spalte
      rightCol.forEach((field, index) => {
        const x = margin + colWidth + 10;
        const y = yPosition + (index * 6);
        pdf.text(`${field.label} ${field.value || '_________________'}`, x, y);
      });

      yPosition += Math.max(leftCol.length, rightCol.length) * 6 + 2;

      // VDH Mitgliedschaften
      pdf.text('Ich bin/war bereits Mitglied in folgenden kynologischen Verbänden oder Vereinen des VDH:', margin, yPosition);
      yPosition += 5;
      pdf.text(formData.mitgliedschaftVDH || '________________________________________________', margin, yPosition);
      yPosition += 10;

      // Hund-Sektion
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Hund (keine Übernahme der Daten in die HZD-Datenbank oder das HZD-Zuchtbuch/Register)', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Hund-Felder (Geschlecht wird direkt verwendet, da es bereits "Rüde" oder "Hündin" ist)
      const hundFields = [
        { label: 'Name:', value: formData.hundName },
        { label: 'Zwingername:', value: formData.hundZwinger },
        { label: 'Zuchtbuchnr.:', value: formData.hundZuchtbuch },
        { label: 'Wurfdatum:', value: formatDate(formData.hundWurfdatum) },
        { label: 'Rasse:', value: formData.hundRasse },
        { label: 'Haftpflichtversicherung:', value: formData.hundVersicherung },
        { label: 'Nr.:', value: formData.hundVersNr },
        { label: 'Geschlect:', value: formData.hundGeschlecht },
        { label: 'Chipnr.:', value: formData.hundChip }
      ];

      // Hund-Felder in zwei Spalten
      const hundLeftCol = hundFields.slice(0, Math.ceil(hundFields.length / 2));
      const hundRightCol = hundFields.slice(Math.ceil(hundFields.length / 2));

      hundLeftCol.forEach((field, index) => {
        const x = margin;
        const y = yPosition + (index * 5);
        pdf.text(`${field.label} ${field.value || '_________________'}`, x, y);
      });

      hundRightCol.forEach((field, index) => {
        const x = margin + colWidth + 10;
        const y = yPosition + (index * 5);
        pdf.text(`${field.label} ${field.value || '_________________'}`, x, y);
      });

      yPosition += Math.max(hundLeftCol.length, hundRightCol.length) * 5 + 5;

      // Mitgliedschaften-Sektion
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ortsgruppen-Mitgliedschaften ', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const v = formatDate(formData.kurzzeitVon) || '_________________';
      const b = formatDate(formData.kurzzeitBis) || '_________________';

      const memberships = [
        { m_type: MEMBERSHIP_TYPE_HZD_VOLLMITGLIED.id, label: 'Ortsgruppenmitglied mit HZD Vollmitgliedschaft', price: '31,00 €', period: 'jährlich' },
        { m_type: MEMBERSHIP_TYPE_OG_MITGLIED.id, label: 'Ortsgruppenmitglied', price: '138,00 €', period: 'jährlich' },
        { m_type: MEMBERSHIP_TYPE_KURZZEITMITGLIED.id, label: `Kurzmitgliedschaft von: ${v} bis: ${b}`, price: '11,50 €', period: 'monatlich' },
        { m_type: MEMBERSHIP_TYPE_OG_FAMILIENMITGLIED.id, label: 'Ortsgruppenfamilienmitglied ohne HZD Familienmitgliedschaft', price: '16,00 €', period: 'jährlich' },
        { m_type: MEMBERSHIP_TYPE_HZD_FAMILIENMITGLIED.id, label: 'Ortsgruppenfamilienmitglied mit HZD Familienmitgliedschaft', price: '16,00 €', period: 'jährlich' }
      ];

      memberships.forEach((membership) => {
        // Checkbox
        const isSelected = formData.mitgliedschaft == membership.m_type;
        if (isSelected) {
          pdf.rect(margin, yPosition - 3, 3, 3);
          pdf.text('X', margin + 0.5, yPosition - 0.5);
          // Text
          pdf.text(membership.label, margin + 8, yPosition);
          pdf.text(membership.period, margin + contentWidth - 40, yPosition);
          pdf.text(membership.price, margin + contentWidth - 20, yPosition);
          yPosition += 5;
        }
      });

      yPosition += 5;

      // Familienmitglied Hinweis
      if (formData.mitgliedschaft.includes('Familie')) {
        pdf.setFontSize(9);
        pdf.text('Familienmitglied kann werden, wer in häuslicher Gemeinschaft mit einem OG-Vollmitglied lebt.', margin, yPosition);
        yPosition += 10;
      }

      // Datenschutz-Sektion
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Datenschutzrechtliche Einverständniserklärung', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const datenschutzText = 'Ich bin damit einverstanden, dass obenstehende Angaben für vereinsinterne Zwecke der HZD in einer elektronischen Datenverarbeitung gespeichert und verarbeitet und an Regionalgruppen der HZD bei Bedarf bekanntgegeben werden. Eine darüber hinausgehende Weitergabe der Daten findet nicht statt. Ich bin damit einverstanden, dass die HZD vereinsinterne Post (Einladungen, Infos etc.) an die genannte E-Mail-Adresse senden darf.';
      const datenschutzLines = pdf.splitTextToSize(datenschutzText, contentWidth);
      pdf.text(datenschutzLines, margin, yPosition);
      yPosition += datenschutzLines.length * 4 + 4;

      // Datum und Unterschrift
      pdf.text('Datum: _________________', margin, yPosition);
      pdf.text('Unterschrift: _________________', margin + 80, yPosition);
      yPosition += 8;

      // SEPA-Sektion
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SEPA-Lastschriftmandat', margin, yPosition);
      yPosition += 4;

      // SEPA Text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const sepaText = 'Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen. Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen. Gläubiger-Identifikationsnummer: DE79 ZZZO 0000 5154 60. Mandatsreferenz ist die Mitgliedsnummer (wird separat mitgeteilt).';
      const sepaLines = pdf.splitTextToSize(sepaText, contentWidth);
      pdf.text(sepaLines, margin, yPosition);
      yPosition += sepaLines.length * 4 + 4;

      // SEPA Felder
      const sepaFields = [
        { label: 'Kontoinhaber:', value: `${formData.vorname} ${formData.name}` },
        { label: 'Anschrift:', value: `${formData.strasse}, ${formData.plz} ${formData.ort}` },
        { label: 'Kreditinstitut:', value: formData.sepaKreditinstitut },
        { label: 'IBAN:', value: formData.sepaIban },
        { label: 'BIC:', value: formData.sepaBic }
      ];

      // SEPA-Felder in zwei Spalten
      const sepaLeftCol = sepaFields.slice(0, Math.ceil(sepaFields.length / 2));
      const sepaRightCol = sepaFields.slice(Math.ceil(sepaFields.length / 2));

      sepaLeftCol.forEach((field, index) => {
        const x = margin;
        const y = yPosition + (index * 5);
        pdf.text(`${field.label} ${field.value || '_________________'}`, x, y);
      });

      sepaRightCol.forEach((field, index) => {
        const x = margin + colWidth + 10;
        const y = yPosition + (index * 5);
        pdf.text(`${field.label} ${field.value || '_________________'}`, x, y);
      });

      yPosition += Math.max(sepaLeftCol.length, sepaRightCol.length) * 5 + 3;

      // SEPA Hinweis
      pdf.setFontSize(9);
      pdf.text('Falls Kontoinhaber abweichend vom Antragsteller: Dieses SEPA-Lastschriftmandat gilt für die Mitgliedschaft des Antragstellers.', margin, yPosition);
      yPosition += 10;

      // Ort, Datum und Unterschrift
      pdf.text('Ort, Datum: _________________', margin, yPosition);
      pdf.text('Unterschrift: _________________', margin + 80, yPosition);
      yPosition += 15;

      // Footer
      pdf.setFontSize(8);
      pdf.text('HZD Formular 040-01 Seite 1 von 1', pageWidth - margin - 40, pageHeight - margin + 10);

      // PDF als Buffer zurückgeben
      const pdfBuffer = pdf.output('arraybuffer');
      
      serverLog(`PDF-Generierung erfolgreich abgeschlossen für: ${formData.email}`);
      return pdfBuffer;
      
    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
      serverLog(`Fehler bei PDF-Generierung für ${formData.email}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Singleton-Instanz
let pdfService: PdfService | null = null;

export function getPdfService(): PdfService {
  if (!pdfService) {
    pdfService = new PdfService();
  }
  return pdfService;
}

