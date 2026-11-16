import fs from 'node:fs';
import PizZip from 'pizzip';
const zip = new PizZip();
zip.load(fs.readFileSync('src/templates/sepa-mandat-032.docx'));
const content = zip.file('word/document.xml').asText();
const events = [];
let cursor = 0;
while (cursor < content.length) {
  cursor = content.indexOf('<', cursor);
  if (cursor === -1) break;
  const nextOpening = content.indexOf('<', cursor + 1);
  const gt = content.indexOf('>', cursor);
  if (gt === -1) break;
  const tagText = content.slice(cursor, gt + 1);
  const isEnd = tagText[1] === '/';
  const selfClose = tagText[tagText.length - 2] === '/';
  let name = tagText.slice(isEnd ? 2 : 1);
  const sp = name.indexOf(' ');
  if (sp !== -1) name = name.slice(0, sp);
  if (selfClose) name = name.slice(0, -1); // crude
  if (name === 'w:t') {
    events.push({ pos: isEnd ? 'end' : (selfClose ? 'self' : 'start'), off: cursor, tag: tagText });
  }
  cursor = gt + 1;
}
console.log('w:t events:', events.length);
for (let i = 0; i < events.length; i++) {
  const e = events[i];
  const prev = events[i - 1];
  const bad = prev && prev.pos === 'start' && e.pos === 'start';
  const bad2 = prev && prev.pos === 'end' && e.pos === 'end';
  console.log(e.pos, e.off, e.tag.slice(0, 40), bad ? ' <== duplicate start!' : bad2 ? ' <== duplicate end!' : '');
}
