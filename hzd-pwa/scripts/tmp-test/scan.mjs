import fs from 'node:fs';
import PizZip from 'pizzip';
const zip = new PizZip();
zip.load(fs.readFileSync('src/templates/sepa-mandat-032.docx'));
const xml = zip.file('word/document.xml').asText();
const events = [];
let i = 0;
while (i < xml.length) {
  const o = xml.indexOf('{{', i);
  const c = xml.indexOf('}}', i);
  if (o === -1 && c === -1) break;
  const pos = (o !== -1 && (c === -1 || o < c)) ? o : c;
  events.push({ kind: xml[pos] === '{' ? 'start' : 'end', off: pos });
  i = pos + 2;
}
console.log('total events:', events.length);
for (let k = 0; k < events.length; k++) {
  const e = events[k];
  const ctx = xml.slice(e.off - 12, e.off + 24).replace(/\n/g, '\\n');
  const prev = events[k-1];
  const status = (prev && prev.kind === e.kind) ? ' <== SAME KIND AS PREVIOUS!' : '';
  console.log(e.kind, e.off, JSON.stringify(ctx), status);
}
