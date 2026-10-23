// Explicit export checks; excluded from normal build/test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
const python=process.env.PYTHON_EXECUTABLE||'python3';
execFileSync(python,['tools/render.py']);execFileSync(python,['tools/build.py']);
test('offline bundle contains all runtime code and local images',async()=>{
 const html=await readFile('dist/offline/presentation.html','utf8');
 assert.ok(html.includes('global.DeckNavigation'));assert.ok(html.includes('window.DeckConfig'));assert.ok(html.includes('window.DeckI18n'));
 assert.ok(html.includes('data:image/png;base64,'));const deck=JSON.parse(await readFile('content/deck.json','utf8'));
 const backgrounds={'原山景':'mountains.jpg','云山':'yunshan.png','金沙':'jinsha.png'};
 for(const cover of deck.slides.filter(s=>s.type==='cover')) {
  const image=await readFile(path.join('assets',backgrounds[cover.background||'原山景']));
  assert.ok(html.includes(image.toString('base64')), 'selected cover image must be embedded');
 }
 assert.ok(!/<script[^>]+src="js\//.test(html));assert.ok(!/<link rel="stylesheet" href="css\//.test(html));
 assert.ok(!/assets\/[A-Za-z0-9_-]+\.(png|jpg|svg)/.test(html));
});

test('HTML export CLI accepts output paths with spaces and embeds every page',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'slide html export '));
 try{
  execFileSync(process.execPath,['tools/export.cjs','html','--output-dir',directory]);
  const html=await readFile(path.join(directory,'presentation.html'),'utf8');
  const data=JSON.parse(await readFile('content/deck.json','utf8'));
  assert.equal([...html.matchAll(/<section class="slide /g)].length,data.slides.length);
  assert.ok(!/<script[^>]+src="js\//.test(html));
 }finally{await rm(directory,{recursive:true,force:true});}
});

