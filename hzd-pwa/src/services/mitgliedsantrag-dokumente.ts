import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { convertOfficeDocumentToPdf } from '@/lib/gotenberg';
import {
  buildLocalCommunityHeader,
  buildRegionalUnitHeader,
} from '@/lib/regional-unit';
import { getGlaeubigerId } from '@/lib/server/finanverwaltung';
import {
  getLocalCommunity,
  getRegionalUnit,
} from '@/lib/server/regional-units';
import { ladePwaSettingVorlage } from '@/lib/server/koerung-ausschreibung-vorlage';
import { serverLog } from '@/lib/server-only';
import type { FormData } from '@/types/formData';

/**
 * Ortsgruppen-Mitgliedsantrag – Template-basierter PDF-Generator.
 *
 * Ablauf:
 *   1. DOCX-Vorlage aus Strapi laden (PWA Settings > Mitgliedsantrag_OG).
 *   2. Platzhalter mit Formulardaten und der gewählten RegionalUnit füllen.
 *   3. Die befüllte DOCX per Gotenberg in ein PDF wandeln.
 */

const VORLAGE_ATTRIBUT = 'Mitgliedsantrag_OG';
const VORLAGE_LEER_MELDUNG =
  'Keine Vorlage für den Mitgliedsantrag hinterlegt ' +
  '(Strapi > PWA Settings > Mitgliedsantrag_OG ist leer).';
const GOTENBERG_FILENAME = 'Mitgliedsantrag.docx';

const FAMILIEN_HINWEIS =
  'Familienmitglied kann werden, wer in häuslicher Gemeinschaft mit einem OG-Vollmitglied lebt.';

interface MitgliedschaftZeile {
  label: string;
  preis: string;
  zeitraum: string;
}

/** Texte und Beiträge wie im bisherigen Antrags-PDF. */
const MITGLIEDSCHAFTEN: Record<string, Omit<MitgliedschaftZeile, 'label'> & { label: string | ((von: string, bis: string) => string) }> = {
  'HZD Vollmitgliedschaft': {
    label: 'Ortsgruppenmitglied mit HZD Vollmitgliedschaft',
    preis: '31,00 €',
    zeitraum: 'jährlich',
  },
  Ortsgruppenmitglied: {
    label: 'Ortsgruppenmitglied',
    preis: '138,00 €',
    zeitraum: 'jährlich',
  },
  Kurzzeitmitglied: {
    label: (von, bis) => `Kurzmitgliedschaft von: ${von} bis: ${bis}`,
    preis: '11,50 €',
    zeitraum: 'monatlich',
  },
  'OG Familienmitglied': {
    label: 'Ortsgruppenfamilienmitglied ohne HZD Familienmitgliedschaft',
    preis: '16,00 €',
    zeitraum: 'jährlich',
  },
  'HZD Familienmitglied': {
    label: 'Ortsgruppenfamilienmitglied mit HZD Familienmitgliedschaft',
    preis: '16,00 €',
    zeitraum: 'jährlich',
  },
};

/** Platzhaltermodell der DOCX-Vorlage. */
export interface MitgliedsantragTemplateModel {
  Headline: string;
  Name: string;
  Street: string;
  ZipCity: string;
  Phone: string;
  Email1: string;
  Email2: string;
  anrede: string;
  vorname: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  geburtsdatum: string;
  email: string;
  telefon: string;
  mitgliedschaft_vdh: string;
  hund_name: string;
  hund_zwinger: string;
  hund_zuchtbuch: string;
  hund_wurfdatum: string;
  hund_rasse: string;
  hund_versicherung: string;
  hund_vers_nr: string;
  hund_geschlecht: string;
  hund_chip: string;
  mitgliedschaft_label: string;
  mitgliedschaft_preis: string;
  mitgliedschaft_zeitraum: string;
  familien_hinweis: string;
  glaeubiger_id: string;
  kontoinhaber: string;
  anschrift: string;
  kreditinstitut: string;
  iban: string;
  bic: string;
  weitere_mitteilungen: string;
  antrag_fuer: string;
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

/** ISO-Datum (JJJJ-MM-TT) als TT.M.JJJJ, sonst den Rohwert. */
function formatDatum(value: string | undefined): string {
  const trimmed = text(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  return `${Number(match[3])}.${Number(match[2])}.${match[1]}`;
}

function mitgliedschaftZeile(data: FormData): MitgliedschaftZeile {
  const eintrag = MITGLIEDSCHAFTEN[data.mitgliedschaft];
  if (!eintrag) {
    return { label: text(data.mitgliedschaft), preis: '', zeitraum: '' };
  }
  const von = formatDatum(data.kurzzeitVon) || '_________________';
  const bis = formatDatum(data.kurzzeitBis) || '_________________';
  const label = typeof eintrag.label === 'function'
    ? eintrag.label(von, bis)
    : eintrag.label;
  return { label, preis: eintrag.preis, zeitraum: eintrag.zeitraum };
}

export async function buildMitgliedsantragModel(
  data: FormData,
): Promise<MitgliedsantragTemplateModel> {
  const emptyHeader = {
    headline: '',
    name: '',
    street: '',
    zipCity: '',
    phone: '',
    email1: '',
    email2: '',
    antragFuer: '',
  };
  let header = emptyHeader;
  const localCommunityId = data.localCommunityId?.trim() ?? '';
  if (localCommunityId) {
    const selected = await getLocalCommunity(localCommunityId);
    if (!selected) {
      throw new Error('Die gewählte Ortsgruppe wurde nicht gefunden.');
    }
    header = buildLocalCommunityHeader(selected.unit, selected.community);
  } else {
    const regionalUnitId = data.regionalUnitId?.trim() ?? '';
    if (regionalUnitId) {
      const unit = await getRegionalUnit(regionalUnitId);
      if (!unit) {
        throw new Error('Die gewählte Ortsgruppe wurde nicht gefunden.');
      }
      header = buildRegionalUnitHeader(unit);
    }
  }

  let glaeubigerId = '';
  try {
    glaeubigerId = (await getGlaeubigerId()) ?? '';
  } catch (error) {
    console.error('Fehler beim Laden der Gläubiger-Identifikationsnummer:', error);
  }

  const vorname = text(data.vorname);
  const nachname = text(data.name);
  const kontoinhaber = text(data.kontoinhaber) || `${vorname} ${nachname}`.trim();
  const anschrift = [text(data.strasse), `${text(data.plz)} ${text(data.ort)}`.trim()]
    .filter((teil) => teil !== '')
    .join(', ');
  const zeile = mitgliedschaftZeile(data);

  return {
    Headline: header.headline,
    Name: header.name,
    Street: header.street,
    ZipCity: header.zipCity,
    Phone: header.phone,
    Email1: header.email1,
    Email2: header.email2,
    anrede: text(data.anrede),
    vorname,
    name: nachname,
    strasse: text(data.strasse),
    plz: text(data.plz),
    ort: text(data.ort),
    geburtsdatum: formatDatum(data.geburtsdatum),
    email: text(data.email),
    telefon: text(data.telefon),
    mitgliedschaft_vdh: text(data.mitgliedschaftVDH),
    hund_name: text(data.hundName),
    hund_zwinger: text(data.hundZwinger),
    hund_zuchtbuch: text(data.hundZuchtbuch),
    hund_wurfdatum: formatDatum(data.hundWurfdatum),
    hund_rasse: text(data.hundRasse),
    hund_versicherung: text(data.hundVersicherung),
    hund_vers_nr: text(data.hundVersNr),
    hund_geschlecht: text(data.hundGeschlecht),
    hund_chip: text(data.hundChip),
    mitgliedschaft_label: zeile.label,
    mitgliedschaft_preis: zeile.preis,
    mitgliedschaft_zeitraum: zeile.zeitraum,
    familien_hinweis: data.mitgliedschaft?.includes('Familie') ? FAMILIEN_HINWEIS : '',
    glaeubiger_id: glaeubigerId,
    kontoinhaber,
    anschrift,
    kreditinstitut: text(data.sepaKreditinstitut),
    iban: text(data.sepaIban),
    bic: text(data.sepaBic),
    weitere_mitteilungen: text(data.weitereMitteilungen),
    antrag_fuer: header.antragFuer,
  };
}

export function renderMitgliedsantragDocx(
  vorlage: Buffer,
  model: MitgliedsantragTemplateModel,
): Buffer {
  const zip = new PizZip(vorlage.toString('base64'), { base64: true });
  const doc = new Docxtemplater(zip, {
    nullGetter: () => '',
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });
  doc.render(model);
  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

class MitgliedsantragDokumenteService {
  async createPdf(
    data: FormData,
    userJwt: string | null = null,
  ): Promise<ArrayBuffer> {
    serverLog('Mitgliedsantrag: lade Vorlage Mitgliedsantrag_OG aus Strapi');
    const vorlage = await ladePwaSettingVorlage(
      VORLAGE_ATTRIBUT,
      VORLAGE_LEER_MELDUNG,
      userJwt,
    );
    const model = await buildMitgliedsantragModel(data);
    const docxBuffer = renderMitgliedsantragDocx(vorlage, model);
    const pdfBuffer = await convertOfficeDocumentToPdf(
      docxBuffer,
      GOTENBERG_FILENAME,
    );
    serverLog(`Mitgliedsantrag-PDF erstellt (${pdfBuffer.length} Byte)`);
    return pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength,
    ) as ArrayBuffer;
  }
}

let service: MitgliedsantragDokumenteService | null = null;

export function getMitgliedsantragDokumenteService(): MitgliedsantragDokumenteService {
  if (!service) {
    service = new MitgliedsantragDokumenteService();
  }
  return service;
}
