import fs from 'fs';
import path from 'path';

/**
 * Lädt ein E-Mail-Template aus dem templates-Verzeichnis
 */
export function loadEmailTemplate(templateName: string, format: 'html' | 'txt'): string {
  const templatePath = path.join(
    process.cwd(),
    'src',
    'templates',
    `${templateName}.${format}`
  );

  try {
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Fehler beim Laden des Templates ${templateName}.${format}:`, error);
    throw new Error(`Template ${templateName}.${format} konnte nicht geladen werden`);
  }
}

/**
 * Ersetzt Platzhalter im Template mit den übergebenen Variablen
 */
export function replaceTemplatePlaceholders(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    // Ersetze alle Vorkommen von {{KEY}} mit dem entsprechenden Wert
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value);
  }

  return result;
}

/**
 * Lädt ein E-Mail-Template und ersetzt die Platzhalter
 */
export function renderEmailTemplate(
  templateName: string,
  format: 'html' | 'txt',
  variables: Record<string, string>
): string {
  const template = loadEmailTemplate(templateName, format);
  return replaceTemplatePlaceholders(template, variables);
}


