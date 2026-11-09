/**
 * Gemeinsame Definitionen für das HZD-Logo (isomorph: Browser + Node).
 *
 * - `hzd-logo.webp`: Quell-Logo, läuft in der Web-UI (Browser renderen WebP).
 * - `hzd-logo.png`:  daraus abgeleitetes statisches PNG für die PDF-Generatoren
 *   (pdf-lib und jsPDF können nur PNG/JPEG einbetten; die PNG wird einmalig
 *   mit `magick hzd-logo.webp hzd-logo.png` erzeugt).
 */

/** Statische URL in der Web-UI */
export const HZD_LOGO_WEBP_SRC = '/hzd-logo.webp';
/** Statische PNG für PDFs */
export const HZD_LOGO_PNG_SRC = '/hzd-logo.png';

/** Seitenverhältnis des aktuellen Logos (314 x 241) */
export const HZD_LOGO_ASPECT = 314 / 241;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Liest Breite/Höhe aus dem IHDR-Header eines PNG-Bytes-Arrays (reines JS,
 * läuft im Browser und in Node). Gibt `null` zurück, wenn kein gültiges PNG.
 */
export function pngDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 24) {
    return null;
  }
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      return null;
    }
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset + 16, 8);
  return { width: view.getUint32(0), height: view.getUint32(4) };
}
