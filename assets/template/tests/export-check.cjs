/* Optional integration check: requires Playwright and Chromium. */
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'slides-export-'));
try{
 execFileSync(process.execPath,['tools/export.cjs','all','--lang','both','--output-dir',directory],{stdio:'inherit'});
 const deck=JSON.parse(fs.readFileSync('content/deck.json','utf8'));
 const html=fs.readFileSync(path.join(directory,'presentation.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="slide /g)].length,deck.slides.length);
 assert.ok(!/<(?:script|link)[^>]+(?:src|href)="(?:js|css)\//.test(html));
 for(const lang of ['zh','en']){
  const pdf=fs.readFileSync(path.join(directory,`presentation-${lang}.pdf`));
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,deck.slides.length,'PDF page count must match deck');
 }
 console.log('PASS: CLI exports one self-contained HTML and both PDFs with the expected page count.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
