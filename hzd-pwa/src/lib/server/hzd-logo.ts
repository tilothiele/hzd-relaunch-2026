import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Aktuelles HZD-Logo (public/hzd-logo.webp).
 *
 * pdf-lib und jsPDF können WebP nicht direkt einbetten, daher liefert
 * `getHzdLogoPng()` das Logo als PNG-Buffer (Transparenz bleibt erhalten)
 * plus die Seitenverhältnis-Metadaten der Quelldatei.
 * `sharp` ist über Next.js (optionalDependency) verfügbar.
 */

/** URL, unter der das Logo als statische Datei ausgeliefert wird */
export const HZD_LOGO_SRC = '/hzd-logo.webp';

export interface HzdLogoPng {
  /** Logo-Daten als PNG */
  data: Buffer;
  /** Breite / Höhe des Originals (z.B. 314/241 ≈ 1,303) */
  aspectRatio: number;
  width: number;
  height: number;
}

/**
 * Lädt das HZD-Logo aus public/ und konvertiert es zu PNG.
 * Gibt `null` zurück, wenn die Datei fehlt oder die Konvertierung fehlschlägt.
 */
export async function getHzdLogoPng(): Promise<HzdLogoPng | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'hzd-logo.webp');
    if (!fs.existsSync(file)) {
      console.error(`HZD-Logo nicht gefunden: ${file}`);
      return null;
    }
    const input = fs.readFileSync(file);
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) {
      return null;
    }
    const data = await sharp(input).png().toBuffer();
    return {
      data: Buffer.from(data),
      aspectRatio: meta.width / meta.height,
      width: meta.width,
      height: meta.height,
    };
  } catch (error) {
    console.error('Fehler beim Laden des HZD-Logos:', error);
    return null;
  }
}
