import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const lex = require('docxtemplater/js/lexer.js');
const orig = lex.parseDelimiters;
lex.parseDelimiters = function (innerContentParts, delimiters, syntaxOptions) {
  const full = innerContentParts.map((p) => p.value).join('');
  console.error('=== parseDelimiters:', innerContentParts.length, 'parts, full len', full.length, JSON.stringify(full.slice(0, 120)));
  console.error('    delimiters:', JSON.stringify(delimiters), 'syntax:', JSON.stringify(syntaxOptions));
  const r = orig.apply(this, arguments);
  console.error('    → errors:', r.errors.map((e) => e.properties.id + '@' + e.properties.offset));
  return r;
};
const PizZip = (await import('pizzip')).default;
const Docxtemplater = (await import('docxtemplater')).default;
const zip = new PizZip();
zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
zip.file('_rels/.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{name}}</w:t></w:r></w:p></w:body></w:document>`);
try {
  new Docxtemplater(zip, { nullGetter: () => '' });
  console.log('OK');
} catch (e) {
  console.log('FAIL:', e.message.slice(0, 60));
}
