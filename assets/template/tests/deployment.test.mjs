import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
// Explicitly opt into packaging tests; normal build/test never invoke this adapter.
execFileSync(process.env.PYTHON_EXECUTABLE||'python3',['tools/render.py']);
execFileSync(process.execPath,['deploy/cloudflare/build.mjs']);
const output=path.resolve('deploy/cloudflare/dist/public');
test('Cloudflare package includes static assets and excludes private project files',async()=>{
 const data=JSON.parse(await readFile('content/deck.json','utf8'));
 const html=await readFile(path.join(output,'index.html'),'utf8');
 assert.equal([...html.matchAll(/<section class="slide /g)].length,data.slides.length);
 for(const m of html.matchAll(/(?:src|href)="((?:assets|js|css)\/[^"]+)"/g))await access(path.join(output,m[1]));
 const entries=await readdir(output);
 for(const name of ['worker.mjs','pin-gate.mjs','content','tests','.env','.dev.vars','tools'])assert.ok(!entries.includes(name));
 const config=JSON.parse(await readFile('deploy/cloudflare/wrangler.json','utf8'));
 assert.equal(config.assets.run_worker_first,true);assert.ok(!config.account_id);
});
