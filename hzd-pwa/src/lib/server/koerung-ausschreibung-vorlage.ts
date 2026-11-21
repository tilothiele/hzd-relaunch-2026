import { getStrapiBaseUrl } from '@/lib/strapi-api';

/**
 * Lädt DOCX-Vorlagen aus der Strapi-Single-Collection 'PWA Settings'.
 *
 * `ladePwaSettingVorlage` ist der gemeinsame Abruf. Die Körungs-Ausschreibung
 * nutzt das Medien-Attribut VorlageAusschreibungKoerung
 * (in der Aufgabenstellung 'PWA Setting'.VorlageAusschreibung; dort ist
 * normalerweise ein docx hinterlegt).
 *
 * Zugriffsstrategie (in dieser Reihenfolge):
 *   1. Öffentliche API-Abruf (Strapi-Rolle 'public' hat Read-Zugriff)
 *   2. Service-Token aus der Umgebung (STRAPI_SERVICE_TOKEN), falls hinterlegt
 *   3. JWT der aktuellen PWA-Sitzung (falls z. B. eine Zuchtbuchstelle-
 *      Nutzerin eingeloggt ist)
 */

const KOERUNG_MEDIA_ATTRIBUT = 'VorlageAusschreibungKoerung';
const KOERUNG_LEER_MELDUNG =
  'Keine Vorlage für die HZD-Körung-Ausschreibung hinterlegt ' +
  '(Strapi > PWA Settings > VorlageAusschreibungKoerung ist leer).';

/** Die Vorlage selbst fehlt/einlesen nicht möglich (unabhängig von Berechtigungen). */
export class VorlageFehltError extends Error {
  constructor(meldung: string) {
    super(meldung);
    this.name = 'VorlageFehltError';
  }
}

interface VorlageMedia {
  id: number;
  url: string;
  name?: string;
  ext?: string;
  mime?: string;
}

function istMediaRef(value: unknown): value is VorlageMedia {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as VorlageMedia).url === 'string' &&
    (value as VorlageMedia).url.length > 0
  );
}

async function fetchSettingMedia(
  mediaAttribut: string,
  leerMeldung: string,
  headers: Record<string, string>,
): Promise<VorlageMedia> {
  const strapiBase = getStrapiBaseUrl();
  // Ganz-Entity-Populate: Feld-selektive populate-Syntax liefert je nach
  // Strapi-Version Validationsfehler → "populate=*" ist der verlässliche Weg.
  const settingUrl = `${strapiBase}/api/pwa-setting?populate=*`;

  const response = await fetch(settingUrl, {
    headers: { Accept: 'application/json', ...headers },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Strapi antwortet mit Status ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: Record<string, unknown> | null }
    | null;

  // Ältere Strapi-Versionen nesten Attribute unter `data.attributes`,
  // neuere liefern `data` flach → beide Varianten abdecken.
  const data = payload?.data;
  const attrs =
    data !== null &&
    typeof data === 'object' &&
    data.attributes !== null &&
    typeof data.attributes === 'object'
      ? (data.attributes as Record<string, unknown>)
      : (data as Record<string, unknown> | null | undefined) ?? null;

  const media = attrs?.[mediaAttribut];
  if (!istMediaRef(media)) {
    throw new VorlageFehltError(leerMeldung);
  }

  return media;
}

/**
 * Lädt eine Medien-Vorlage aus der Single Collection 'PWA Settings'.
 *
 * @param mediaAttribut Attributname, z. B. VorlageSepaLastschriftmandat
 * @param leerMeldung Fehlermeldung, wenn das Attribut keine Datei enthält
 * @param userJwt JWT der aktuellen PWA-Sitzung (optional, Fallback-Bearer)
 * @throws VorlageFehltError wenn die Single Collection keine Datei enthält
 * @throws VorlageFehltError wenn Strapi nicht erreichbar ist oder alle
 *         Zugriffsversuche fehlschlagen
 */
export async function ladePwaSettingVorlage(
  mediaAttribut: string,
  leerMeldung: string,
  userJwt: string | null = null,
): Promise<Buffer> {
  const strapiBase = getStrapiBaseUrl();
  const serviceToken =
    process.env.STRAPI_SERVICE_TOKEN || process.env.STRAPI_API_TOKEN;

  const versuche: { headers: Record<string, string> }[] = [
    { headers: {} },
  ];
  if (serviceToken && serviceToken.trim()) {
    versuche.push({
      headers: { Authorization: `Bearer ${serviceToken.trim()}` },
    });
  }
  if (userJwt && userJwt.length > 0) {
    versuche.push({ headers: { Authorization: `Bearer ${userJwt}` } });
  }

  let letzterFehler: unknown = null;

  for (const versuch of versuche) {
    try {
      const media = await fetchSettingMedia(
        mediaAttribut,
        leerMeldung,
        versuch.headers,
      );
      const mediaUrl = media.url.startsWith('http')
        ? media.url
        : `${strapiBase}${media.url.startsWith('/') ? '' : '/'}${media.url}`;

      const fileResponse = await fetch(mediaUrl, { cache: 'no-store' });
      if (!fileResponse.ok) {
        throw new VorlageFehltError(
          `Vorlagendatei ist nicht herunterladbar (Status ${fileResponse.status}).`,
        );
      }

      const bytes = new Uint8Array(await fileResponse.arrayBuffer());
      if (bytes.length === 0) {
        throw new VorlageFehltError('Vorlagendatei ist leer.');
      }

      return Buffer.from(bytes);
    } catch (error) {
      letzterFehler = error;
      // Eine fehlende Datei/leere Single Collection ändert nichts an einem
      // anderen Token → keine sinnvollen erneuten Versuche.
      if (error instanceof VorlageFehltError) {
        throw error;
      }
    }
  }

  const grundFehler =
    letzterFehler instanceof Error
      ? letzterFehler.message
      : String(letzterFehler);
  throw new VorlageFehltError(
    `Vorlage konnte nicht aus Strapi (${strapiBase}) geladen werden: ${grundFehler}`,
  );
}

/**
 * Lädt die DOCX-Vorlage der HZD-Körung-Ausschreibung.
 *
 * @param userJwt JWT der aktuellen PWA-Sitzung (optional, Fallback-Bearer)
 */
export async function ladeVorlageKoerungAusschreibung(
  userJwt: string | null = null,
): Promise<Buffer> {
  return ladePwaSettingVorlage(
    KOERUNG_MEDIA_ATTRIBUT,
    KOERUNG_LEER_MELDUNG,
    userJwt,
  );
}
