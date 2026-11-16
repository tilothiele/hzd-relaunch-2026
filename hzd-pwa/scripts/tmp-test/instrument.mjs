import fs from 'node:fs';
import { createRequire } from 'node:module';
import PizZip from 'pizzip';
const require = createRequire(import.meta.url);
const lex = require('docxtemplater/js/lexer.js');
const origParse = lex.parse;
let printed = false;
lex.parse = function (xmllexed, delimiters, syntax, fileType) {
  if (!printed) {
    printed = true;
    const parts = xmllexed;
    console.error('== parts:', parts.length, '==');
    const fullText = parts.map((p) => (typeof p.value === 'string' ? p.value : '')).join('');
    console.error('fullText len:', fullText.length);
    console.error('FULLTEXT[350..900] =', JSON.stringify(fullText.slice(350, 900)));
  }
  return origParse.apply(this, arguments);
};
const Docxtemplater = (await import('docxtemplater')).default;
const zip = new PizZip();
zip.load(fs.readFileSync('src/templates/sepa-mandat-032.docx'));
try {
  const doc = new Docxtemplater(zip, { nullGetter: () => '' });
  doc.render({ a: 'b' });
  console.log('OK');
} catch (e) {
  console.log('ERR (expected):', e.message.slice(0, 100));
}
