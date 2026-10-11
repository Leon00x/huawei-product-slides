import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const python=process.env.PYTHON_EXECUTABLE||'python3';
execFileSync(python,['tools/render.py']);execFileSync(process.execPath,['deploy/cloudflare/build.mjs']);execFileSync(python,['tools/build.py']);
test('content determines page count, references and isolated storage keys',async()=>{
 const data=JSON.parse(await readFile('content/deck.json','utf8'));
 const html=await readFile('deploy/cloudflare/dist/public/index.html','utf8');
 assert.equal([...html.matchAll(/<section class="slide /g)].length,data.slides.length);
 for(const m of html.matchAll(/(?:src|href)="((?:assets|js|css)\/[^"]+)"/g))await access(path.join('deploy/cloudflare/dist/public',m[1]));
 const config=await readFile('js/config.js','utf8');assert.ok(config.includes(data.id));
 const files=await readdir('deploy/cloudflare/dist/public');
 for(const name of ['worker.mjs','pin-gate.mjs','content','tests','.env','.dev.vars','tools'])assert.ok(!files.includes(name));
 const wrangler=JSON.parse(await readFile('deploy/cloudflare/wrangler.json','utf8'));assert.equal(wrangler.assets.run_worker_first,true);assert.ok(!wrangler.account_id);
});
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
