import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,access,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
const python=process.env.PYTHON_EXECUTABLE||'python3';
execFileSync(python,['tools/render.py']);
test('local build includes page content and isolated storage without deployment output',async()=>{
 const data=JSON.parse(await readFile('content/deck.json','utf8'));
 const html=await readFile('index.html','utf8');
 assert.equal([...html.matchAll(/<section class="slide /g)].length,data.slides.length);
 for(const m of html.matchAll(/(?:src|href)="((?:assets|js|css)\/[^"]+)"/g))await access(m[1]);
 const config=await readFile('js/config.js','utf8');assert.ok(config.includes(data.id));
});
test('export CLI offers help and rejects unsupported languages',()=>{
 const help=execFileSync(process.execPath,['tools/export.cjs','--help'],{encoding:'utf8'});
 assert.match(help,/html\|pdf\|all/);
 assert.throws(()=>execFileSync(process.execPath,['tools/export.cjs','pdf','--lang','invalid'],{stdio:'pipe'}),error=>/--lang must be/.test(String(error.stderr)));
});

async function identityFixture() {
 const root=await mkdtemp(path.join(tmpdir(),'slide-identities-'));
 for(const dir of ['tools','content','js'])await mkdir(path.join(root,dir));
 await writeFile(path.join(root,'tools/render.py'),await readFile('tools/render.py'));
 await writeFile(path.join(root,'content/shell.html'),await readFile('content/shell.html'));
 const data={id:'identity-check',title:{zh:'标识检查',en:'Identity check'},slides:[{type:'cover',title:{zh:'页面一',en:'Page one'}},{type:'cover',title:{zh:'页面二',en:'Page two'}}]};
 await writeFile(path.join(root,'content/deck.json'),JSON.stringify(data));
 return {root,run:()=>execFileSync(python,['tools/render.py'],{cwd:root,stdio:'pipe'})};
}
test('generated page identities survive title changes, reordering and insertion',async()=>{
 const fixture=await identityFixture();
 try{
  fixture.run();const content=path.join(fixture.root,'content/deck.json');const data=JSON.parse(await readFile(content));
  const original=data.slides.map(s=>s.id);assert.equal(new Set(original).size,2);
  data.slides[0].title={zh:'新标题',en:'New title'};
  data.slides.reverse();data.slides.splice(1,0,{type:'cover',title:{zh:'新增页面',en:'Inserted page'}});
  await writeFile(content,JSON.stringify(data));fixture.run();
  const changed=JSON.parse(await readFile(content));
  assert.equal(changed.slides[0].id,original[1]);assert.equal(changed.slides[2].id,original[0]);
  assert.ok(changed.slides[1].id&&!original.includes(changed.slides[1].id));
  const html=await readFile(path.join(fixture.root,'index.html'),'utf8');
  for(const slide of changed.slides)assert.ok(html.includes('data-slide-id="'+slide.id+'"'));
 }finally{await rm(fixture.root,{recursive:true,force:true});}
});
test('duplicate page identities are rejected before rendering an ambiguous selection',async()=>{
 const fixture=await identityFixture();
 try{
  const content=path.join(fixture.root,'content/deck.json');const data=JSON.parse(await readFile(content));
  data.slides.forEach(s=>{s.id='same-page'});await writeFile(content,JSON.stringify(data));
  assert.throws(fixture.run,error=>/Duplicate slide id/.test(String(error.stderr)));
 }finally{await rm(fixture.root,{recursive:true,force:true});}
});
