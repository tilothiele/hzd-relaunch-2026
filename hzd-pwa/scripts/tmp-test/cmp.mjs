import fs from 'node:fs';
import PizZip from 'pizzip';
const zip = new PizZip();
zip.load(fs.readFileSync('src/templates/sepa-mandat-032.docx'));
const viaPizzip = zip.file('word/document.xml').asText();
const viaUnzip = fs.readFileSync('/tmp/opencode/docx-check/word/document.xml', 'utf8');
console.log('pizzip len:', viaPizzip.length, '| unzip len:', viaUnzip.length);
console.log('identical:', viaPizzip === viaUnzip);
if (viaPizzip !== viaUnzip) {
  for (let i = 0; i < Math.min(viaPizzip.length, viaUnzip.length); i++) {
    if (viaPizzip[i] !== viaUnzip[i]) {
      console.log('first diff at', i);
      console.log('pizzip:', JSON.stringify(viaPizzip.slice(i - 80, i + 80)));
      console.log('unzip :', JSON.stringify(viaUnzip.slice(i - 80, i + 80)));
      break;
    }
  }
}
console.log('---pizzip around 484---');
console.log(JSON.stringify(viaPizzip.slice(440, 700)));
