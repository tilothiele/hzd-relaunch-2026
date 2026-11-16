import fs from 'node:fs';
import JSZip from 'jszip';
import PizZip from 'pizzip';

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{name}}</w:t></w:r></w:p></w:body></w:document>`;

function build(Z) {
  const z = new Z();
  z.file('[Content_Types].xml', CONTENT_TYPES);
  z.file('_rels/.rels', ROOT_RELS);
  z.file('word/document.xml', DOCUMENT);
  return z;
}

const Docxtemplater = (await import('docxtemplater')).default;

for (const [label, Z] of Object.entries({ pizzip: PizZip, jszip: JSZip })) {
  try {
    let zip;
    if (Z === PizZip) {
      zip = new PizZip();
      zip.file('[Content_Types].xml', CONTENT_TYPES);
      zip.file('_rels/.rels', ROOT_RELS);
      zip.file('word/document.xml', DOCUMENT);
    } else {
      zip = new JSZip();
      zip.file('[Content_Types].xml', CONTENT_TYPES);
      zip.file('_rels/.rels', ROOT_RELS);
      zip.file('word/document.xml', DOCUMENT);
    }
    const doc = new Docxtemplater(zip, { nullGetter: () => '' });
    doc.render({ name: 'Max' });
    console.log(label, '→ OK');
  } catch (e) {
    console.log(label, '→ FAIL:', e.message.slice(0, 80));
    if (e.errors) console.log('   er[0]:', e.errors[0]?.properties?.id ?? e.errors[0]?.message);
  }
}
