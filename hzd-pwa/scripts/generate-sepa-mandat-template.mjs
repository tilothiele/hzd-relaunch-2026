/**
 * Erzeugt die rudimentäre DOCX-Vorlage "SEPA-Lastschriftmandat"
 * (HZD Formular 032) aus OOXML unter Verwendung von docxtemplater-Tags
 * ({{plazhalter}}). Die Vorlage wird dann vom Server mit den Formular-
 * und Strapi-Daten befüllt und per Gotenberg (/forms/libreoffice/convert)
 * nach PDF konvertiert.
 *
 * Aufruf:  node scripts/generate-sepa-mandat-template.mjs
 * Ergebnis: src/templates/sepa-mandat-032.docx
 *
 * Platzhalter im Dokument:
 *   {{Headline}} {{Name}} {{Street}} {{ZipCity}} {{Phone}}
 *   {{Email1}} {{Email2}}         Kontakt der Finanzverwaltung, je Feld
 *   {{glaeubiger_info}}           Gläubiger-Identifikationsnummer-Satz
 *   {{mitglied_vorname}} … {{mitglied_ort}}
 *   {{kontoinhaber_vorname}} … {{kontoinhaber_ort}}
 *   {{iban}}  {{bic}}  {{kreditinstitut}}
 */
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(root, 'src', 'templates', 'sepa-mandat-032.docx');

/* --------------------------------- XML --------------------------------- */

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/hzd-logo.png"/>
</Relationships>`;

const CORE_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>SEPA-Lastschriftmandat</dc:title>
<dc:creator>HZD</dc:creator>
<cp:lastModifiedBy>HZD</cp:lastModifiedBy>
</cp:coreProperties>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>
<w:sz w:val="20"/><w:szCs w:val="20"/>
<w:lang w:val="de-DE" w:eastAsia="de-DE" w:bidi="ar-SA"/>
</w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="260" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>`;

/* Logo: Höhe 46,5 pt → 590550 EMU, Breite 60,6 pt → 769620 EMU (314:241) */
const LOGO = `<w:r><w:drawing>
<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<wp:extent cx="769620" cy="590550"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:docPr id="1" name="HZD-Logo"/>
<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:nvPicPr><pic:cNvPr id="1" name="hzd-logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="769620" cy="590550"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
</pic:pic>
</a:graphicData>
</a:graphic>
</wp:inline>
</w:drawing></w:r>`;

/* Tabelle: dünne graue Ränder */
const BORDERS = `<w:tblBorders>
<w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>
</w:tblBorders>`;

/** Label-Zelle (fett, 9 pt) mit optionalem Grid-Span. */
const labelCell = (label, width, span = 1) => {
  const gridSpan = span > 1 ? `<w:gridSpan w:val="${span}"/>` : '';
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${gridSpan}</w:tcPr>` +
    `<w:p><w:pPr><w:spacing w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
    `<w:t>${label}</w:t></w:r></w:p></w:tc>`
  );
};

/** Wert-Zelle (10 pt) mit optionalem Grid-Span. */
const valueCell = (value, width, span = 1) => {
  const gridSpan = span > 1 ? `<w:gridSpan w:val="${span}"/>` : '';
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${gridSpan}</w:tcPr>` +
    `<w:p><w:pPr><w:spacing w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>` +
    `<w:r><w:t>${value}</w:t></w:r></w:p></w:tc>`
  );
};

/** Zeile mit einer Label- und einer breit gespannten Wert-Zelle. */
const pairRow = (label, value) =>
  `<w:tr>${labelCell(label, 2200)}${valueCell(value, 7438, 3)}</w:tr>`;

/**
 * Personentabelle (4 Spalten: Label 2200 | Wert 2600 | Label 1600 | Wert 3238).
 * SPalten: [2200, 2600, 1600, 3238], Breite gesamt 9638 Twips (A4 mit 2 cm Rand).
 */
const personTable = (prefix) => `
<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/>${BORDERS}</w:tblPr>
<w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="2600"/><w:gridCol w:w="1600"/><w:gridCol w:w="3238"/></w:tblGrid>
<w:tr>${labelCell('Vorname', 2200)}${valueCell(`{{${prefix}_vorname}}`, 7438, 3)}</w:tr>
<w:tr>${labelCell('Name', 2200)}${valueCell(`{{${prefix}_name}}`, 7438, 3)}</w:tr>
<w:tr>${labelCell('Straße', 2200)}${valueCell(`{{${prefix}_strasse}}`, 7438, 3)}</w:tr>
<w:tr>${labelCell('PLZ', 2200)}${valueCell(`{{${prefix}_plz}}`, 2600)}${labelCell('Ort', 1600)}${valueCell(`{{${prefix}_ort}}`, 3238)}</w:tr>
</w:tbl>`;

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>

<!-- Kopf: Postanschrift links, HZD-Logo rechts -->
<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/></w:tblPr>
<w:tblGrid><w:gridCol w:w="7838"/><w:gridCol w:w="1800"/></w:tblGrid>
<w:tr>
<w:tc><w:tcPr><w:tcW w:w="7838" w:type="dxa"/></w:tcPr>
<w:p><w:r><w:t>{{Headline}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{Name}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{Street}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{ZipCity}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{Phone}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{Email1}}</w:t></w:r></w:p>
<w:p><w:r><w:t>{{Email2}}</w:t></w:r></w:p>
</w:tc>
<w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr>
<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${LOGO}</w:p>
</w:tc>
</w:tr>
</w:tbl>

<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>

<!-- Titel -->
<w:p>
<w:pPr><w:spacing w:before="120" w:after="160"/></w:pPr>
<w:r><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>SEPA-Lastschriftmandat</w:t></w:r>
</w:p>

<!-- Mandatserteilung -->
<w:p><w:r><w:t>Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen.</w:t></w:r></w:p>
<w:p><w:r><w:t>Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.</w:t></w:r></w:p>

<!-- Gläubiger-Identifikationsnummer -->
<w:p><w:pPr><w:spacing w:before="120" w:after="200"/></w:pPr><w:r><w:t>{{glaeubiger_info}}</w:t></w:r></w:p>

<!-- Mitglied -->
<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Mitglied</w:t></w:r></w:p>
${personTable('mitglied')}

<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>

<!-- Kontoinhaber -->
<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Kontoinhaber</w:t></w:r></w:p>
${personTable('kontoinhaber')}

<w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>

<!-- Kontodaten -->
<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/>${BORDERS}</w:tblPr>
<w:tblGrid><w:gridCol w:w="3600"/><w:gridCol w:w="6038"/></w:tblGrid>
${pairRow('IBAN', '{{iban}}')}
${pairRow('BIC (nur bei Konten im Ausland erforderlich)', '{{bic}}')}
${pairRow('Kreditinstitut', '{{kreditinstitut}}')}
</w:tbl>

<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>

<!-- Unterschrift -->
<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/>${BORDERS}</w:tblPr>
<w:tblGrid><w:gridCol w:w="4819"/><w:gridCol w:w="4819"/></w:tblGrid>
<w:tr>
<w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>Ort, Datum</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="360" w:after="60"/></w:pPr></w:p>
</w:tc>
<w:tc><w:tcPr><w:tcW w:w="4819" w:type="dxa"/></w:tcPr>
<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>Unterschrift</w:t></w:r></w:p>
<w:p><w:pPr><w:spacing w:before="360" w:after="60"/></w:pPr></w:p>
</w:tc>
</w:tr>
</w:tbl>

<w:sectPr>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="850" w:footer="992" w:gutter="0"/>
</w:sectPr>

</w:body>
</w:document>`;

/* ------------------------------- Erzeugung ------------------------------ */

const logoPath = path.join(root, 'public', 'hzd-logo.png');
const logo = await fs.promises.readFile(logoPath);

const zip = new JSZip();
zip.file('[Content_Types].xml', CONTENT_TYPES);
zip.file('_rels/.rels', ROOT_RELS);
zip.file('docProps/core.xml', CORE_PROPS);
zip.file('word/styles.xml', STYLES);
zip.file('word/_rels/document.xml.rels', DOC_RELS);
zip.file('word/document.xml', DOCUMENT);
zip.file('word/media/hzd-logo.png', logo);

const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
await fs.promises.mkdir(path.dirname(OUT_PATH), { recursive: true });
await fs.promises.writeFile(OUT_PATH, out);
console.log(
  `Vorlage geschrieben: ${OUT_PATH} (${out.length} Byte, Logo ${logo.length} Byte)`,
);
