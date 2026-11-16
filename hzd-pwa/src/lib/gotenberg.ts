/**
 * Minimaler Gotenberg-Client (Docker-basierte PDF-API).
 *
 * Dokumentation: https://gotenberg.dev/docs/libreoffice/convert
 * Im Projekt wird Gotenberg nur für die LibreOffice-Konvertierung
 * (Office-Dokument → PDF) verwendet.
 */

/** Basis-URL des Gotenberg-Servers (Defaults: Entwicklungsumgebung). */
export function getGotenbergBaseUrl(): string {
  return (
    process.env.GOTENBERG_BASE_URL ?? 'http://localhost:3010'
  ).replace(/\/$/, '');
}

const MIMETYPEN: Record<string, string> = {
  doc: 'application/msword',
  docx:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
};

/**
 * Wandelt ein Office-Dokument (docx/odt/doc) über die Gotenberg-LibreOffice-Engine
 * in PDF um und liefert die Rohbytes zurück.
 *
 * @throws Wenn Gotenberg nicht erreichbar ist, oder ein Convertierungsfehler auftritt (mit Detail-Meldung).
 */
export async function convertOfficeDocumentToPdf(
  file: Buffer,
  filename: string,
): Promise<Buffer> {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = MIMETYPEN[extension] ?? 'application/octet-stream';

  // Exakt geschnittenen ArrayBuffer anhängen (ein Node-Buffer teilt ggf. Pools-Puffer).
  const docxBytes = new ArrayBuffer(file.length);
  new Uint8Array(docxBytes).set(file);
  const form = new FormData();
  form.append('files', new Blob([docxBytes], { type: mimeType }), filename);

  let response: Response;
  try {
    response = await fetch(
      `${getGotenbergBaseUrl()}/forms/libreoffice/convert`,
      {
        method: 'POST',
        body: form,
      },
    );
  } catch (error) {
    throw new Error(
      `Gotenberg (${getGotenbergBaseUrl()}) nicht erreichbar: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(
      `Gotenberg-LibreOffice-Antwort ${response.status}` +
        (detail ? `: ${detail}` : ''),
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error(
      'Gotenberg-LibreOffice hat kein PDF zurückgeliefert (leere Antwort).',
    );
  }
  return Buffer.from(bytes);
}
