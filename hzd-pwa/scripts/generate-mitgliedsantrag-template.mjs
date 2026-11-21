/**
 * Erzeugt die initiale DOCX-Vorlage für den Ortsgruppen-Mitgliedsantrag.
 * Inhalt und Reihenfolge entsprechen dem bisherigen jsPDF-Antrag
 * (HZD Formular 040-01). Platzhalter werden serverseitig gefüllt.
 *
 * Aufruf:  node scripts/generate-mitgliedsantrag-template.mjs
 * Ergebnis: src/templates/mitgliedsantrag-og.docx
 *
 * Die Datei wird in Strapi unter PWA Settings > Mitgliedsantrag_OG hinterlegt.
 */
import JSZip from 'jszip';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(root, 'src', 'templates', 'mitgliedsantrag-og.docx');

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
<dc:title>Ortsgruppen-Aufnahmeantrag</dc:title>
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
<w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>`;

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

const BORDERS = `<w:tblBorders>
<w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>
<w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>
</w:tblBorders>`;

const p = (text, { bold = false, size = 20, before = 0, after = 60 } = {}) =>
  `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}"/></w:pPr>` +
  `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>` +
  `<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

const labelCell = (label, width) =>
  `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>` +
  `<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
  `<w:t>${label}</w:t></w:r></w:p></w:tc>`;

const valueCell = (value, width) =>
  `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>` +
  `<w:p><w:r><w:t xml:space="preserve">${value}</w:t></w:r></w:p></w:tc>`;

const pairRow = (label, value) =>
  `<w:tr>${labelCell(label, 2800)}${valueCell(value, 6838)}</w:tr>`;

const fieldTable = (rows) => `
<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/>${BORDERS}</w:tblPr>
<w:tblGrid><w:gridCol w:w="2800"/><w:gridCol w:w="6838"/></w:tblGrid>
${rows.map(([label, value]) => pairRow(label, value)).join('')}
</w:tbl>`;

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>

<w:tbl>
<w:tblPr><w:tblW w:w="9638" w:type="dxa"/></w:tblPr>
<w:tblGrid><w:gridCol w:w="7000"/><w:gridCol w:w="2638"/></w:tblGrid>
<w:tr>
<w:tc><w:tcPr><w:tcW w:w="7000" w:type="dxa"/></w:tcPr>
${p('{{Headline}}', { size: 16, after: 0 })}
${p('{{Name}}', { size: 16, after: 0 })}
${p('{{Street}}', { size: 16, after: 0 })}
${p('{{ZipCity}}', { size: 16, after: 0 })}
${p('{{Phone}}', { size: 16, after: 0 })}
${p('{{Email1}}', { size: 16, after: 0 })}
${p('{{Email2}}', { size: 16, after: 40 })}
</w:tc>
<w:tc><w:tcPr><w:tcW w:w="2638" w:type="dxa"/></w:tcPr>
<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${LOGO}</w:p>
${p('www.hovawarte.com', { size: 18, after: 0 })}
</w:tc>
</w:tr>
</w:tbl>

${p('Ortsgruppen-Aufnahmeantrag für {{antrag_fuer}}', { bold: true, size: 28, before: 200, after: 160 })}

${p('Hiermit beantrage ich in Anerkennung der Satzung, Ordnungen und Beschlüsse der HZD die Mitgliedschaft in der Hovawart Zuchtgemeinschaft Deutschland e.V.. Ich gehöre keinem kynologischen Verein außerhalb des Verbandes für das Deutsche Hundewesen (VDH) bzw. außerhalb der Fédération Cynologique Internationale (FCI) an. Ich bestätige, dass ich aus keinem anderen VDH-Verein ausgeschlossen wurde und dass gegen mich kein Ausschlussverfahren läuft. Ich bin weder gewerbsmäßiger Hundehändler/-züchter noch Hundeverkaufsvermittler.', { before: 80, after: 160 })}

${p('Antragsteller', { bold: true, size: 24, before: 160, after: 80 })}
${fieldTable([
  ['Anrede', '{{anrede}}'],
  ['Vorname', '{{vorname}}'],
  ['Name', '{{name}}'],
  ['Straße', '{{strasse}}'],
  ['PLZ', '{{plz}}'],
  ['Ort', '{{ort}}'],
  ['Geb.-Datum', '{{geburtsdatum}}'],
  ['E-Mail', '{{email}}'],
  ['Telefon', '{{telefon}}'],
])}

${p('Ich bin/war bereits Mitglied in folgenden kynologischen Verbänden oder Vereinen des VDH:', { before: 160, after: 40 })}
${p('{{mitgliedschaft_vdh}}', { after: 160 })}

${p('Hund (keine Übernahme der Daten in die HZD-Datenbank oder das HZD-Zuchtbuch/Register)', { bold: true, size: 24, before: 80, after: 80 })}
${fieldTable([
  ['Name', '{{hund_name}}'],
  ['Zwingername', '{{hund_zwinger}}'],
  ['Zuchtbuchnr.', '{{hund_zuchtbuch}}'],
  ['Wurfdatum', '{{hund_wurfdatum}}'],
  ['Rasse', '{{hund_rasse}}'],
  ['Haftpflichtversicherung', '{{hund_versicherung}}'],
  ['Nr.', '{{hund_vers_nr}}'],
  ['Geschlecht', '{{hund_geschlecht}}'],
  ['Chipnr.', '{{hund_chip}}'],
])}

${p('Ortsgruppen-Mitgliedschaften', { bold: true, size: 24, before: 200, after: 80 })}
${fieldTable([
  ['Mitgliedschaft', '{{mitgliedschaft_label}}'],
  ['Zeitraum', '{{mitgliedschaft_zeitraum}}'],
  ['Beitrag', '{{mitgliedschaft_preis}}'],
])}
${p('{{familien_hinweis}}', { size: 18, before: 80, after: 120 })}

${p('Datenschutzrechtliche Einverständniserklärung', { bold: true, size: 24, before: 120, after: 80 })}
${p('Ich bin damit einverstanden, dass obenstehende Angaben für vereinsinterne Zwecke der HZD in einer elektronischen Datenverarbeitung gespeichert und verarbeitet und an Regionalgruppen der HZD bei Bedarf bekanntgegeben werden. Eine darüber hinausgehende Weitergabe der Daten findet nicht statt. Ich bin damit einverstanden, dass die HZD vereinsinterne Post (Einladungen, Infos etc.) an die genannte E-Mail-Adresse senden darf.', { after: 160 })}
${p('Datum: _________________          Unterschrift: _________________', { before: 80, after: 200 })}

${p('SEPA-Lastschriftmandat', { bold: true, size: 24, before: 80, after: 80 })}
${p('Ich ermächtige die Hovawart Zuchtgemeinschaft Deutschland, den Mitgliedsbeitrag mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die von der Hovawart Zuchtgemeinschaft auf mein Konto gezogenen Lastschriften einzulösen. Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen. Gläubiger-Identifikationsnummer: {{glaeubiger_id}}. Mandatsreferenz ist die Mitgliedsnummer (wird separat mitgeteilt).', { after: 120 })}
${fieldTable([
  ['Kontoinhaber', '{{kontoinhaber}}'],
  ['Anschrift', '{{anschrift}}'],
  ['Kreditinstitut', '{{kreditinstitut}}'],
  ['IBAN', '{{iban}}'],
  ['BIC', '{{bic}}'],
])}
${p('Falls Kontoinhaber abweichend vom Antragsteller: Dieses SEPA-Lastschriftmandat gilt für die Mitgliedschaft des Antragstellers.', { size: 18, before: 80, after: 160 })}
${p('Ort, Datum: _________________          Unterschrift: _________________', { before: 80, after: 200 })}

${p('Weitere Mitteilungen', { bold: true, size: 24, before: 80, after: 80 })}
${p('{{weitere_mitteilungen}}', { after: 200 })}

${p('HZD Formular 040-01 Seite 1 von 1', { size: 16, before: 200, after: 0 })}

<w:sectPr>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="851" w:header="567" w:footer="567" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>`;

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
console.log(`Vorlage geschrieben: ${OUT_PATH} (${out.length} Byte)`);
