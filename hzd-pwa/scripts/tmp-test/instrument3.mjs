import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const lex = require('docxtemplater/js/lexer.js');
const origParse = lex.parse;
lex.parse = function (xmllexed, delimiters, syntax, fileType) {
  if (xmllexed.some((p) => p.type === 'content' && String(p.value).includes('name'))) {
    console.error('=== document.xml parts:');
    for (const [i, p] of xmllexed.entries()) {
      const val = typeof p.value === 'string' ? JSON.stringify(p.value.slice(0, 80)) : p.value;
      console.error(i, JSON.stringify({ type: p.type, pos: p.position, off: p.offset, val }));
    }
    process.exit(0);
  }
  return origParse.apply(this, arguments);
};
const PizZip = (await import('pizzip')).default;
const Docxtemplater = (await import('docxtemplater')).default;
const zip = new PizZip();
zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
zip.file('_rels/.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{name}}</w:t></w:r></w:p></w:body></w:document>`);
try {
  new Docxtemplater(zip, { nullGetter: () => '' });
} catch (e) { /* expected */ }
