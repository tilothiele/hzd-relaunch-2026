import fs from 'node:fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const tpl = fs.readFileSync('src/templates/sepa-mandat-032.docx');
const model = {
  finanverwaltung_adresse: 'Finanzverwalterin Nord\nAnja Dannenberg',
  finanverwaltung_mail: 'finanzen.nord@hovawarte.com, RG.nord@hovawarte.com',
  glaeubiger_info: 'Gläubiger-Identifikationsnummer: DE79 ZZZZ 1111 2222 33. Mandatsreferenz ist die Mitgliedsnummer.',
  mitglied_vorname: 'Max', mitglied_name: 'Hovawart', mitglied_strasse: 'Bachweg 3', mitglied_plz: '21035', mitglied_ort: 'Hamburg',
  kontoinhaber_vorname: 'Max', kontoinhaber_name: 'Hovawart', kontoinhaber_strasse: 'Bachweg 3', kontoinhaber_plz: '21035', kontoinhaber_ort: 'Hamburg',
  iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFFXXX', kreditinstitut: 'Testbank AG',
};
try {
  const zip = new PizZip();
  zip.load(tpl);
  const doc = new Docxtemplater(zip, { nullGetter: () => '' });
  doc.render(model);
  console.log('render OK');
  const buf = zip.generate({ type: 'nodebuffer' });
  console.log('docx generated:', buf.length, 'bytes');
  fs.writeFileSync('/tmp/opencode/sepa-filled.docx', buf);
  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(buf).buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'SEPA-Lastschriftmandat.docx');
  const res = await fetch('http://localhost:3010/forms/libreoffice/convert', { method: 'POST', body: form });
  console.log('gotenberg:', res.status, res.headers.get('content-type'));
  const bytes = new Uint8Array(await res.arrayBuffer());
  fs.writeFileSync('/tmp/opencode/sepa-filled.pdf', bytes);
  console.log('PDF:', bytes.length, 'bytes');
} catch (e) {
  console.error('FAILED:', e.message);
}
