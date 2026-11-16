import fs from 'node:fs';
import { createRequire } from 'node:module';
import PizZip from 'pizzip';
const require = createRequire(import.meta.url);
const lex = require('docxtemplater/js/lexer.js');
const origParse = lex.parse;
lex.parse = function (xmllexed, delimiters, syntax, fileType) {
  console.error('=== parse call, xmllexed length:', xmllexed.length);
  for (const [i, p] of xmllexed.slice(0, 40).entries()) {
    const val = typeof p.value === 'string' ? p.value.slice(0, 60).replace(/\n/g, '\\n') : p.value;
    console.error(i, JSON.stringify({ type: p.type, pos: p.position, off: p.offset, text: p.text, val }));
  }
  process.exit(0);
};
const Docxtemplater = (await import('docxtemplater')).default;
const zip = new PizZip();
zip.load(fs.readFileSync('src/templates/sepa-mandat-032.docx'));
try {
  new Docxtemplater(zip, { nullGetter: () => '' });
} catch (e) { /* expected */ }
