#!/usr/bin/env node
/* Deterministic local exports; no hosting configuration or deployment calls. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');

function options(args){
 const out={format:'all',lang:'zh',directory:path.join(root,'dist/exports'),browser:process.env.BROWSER_EXECUTABLE};
 if(args[0]&&!args[0].startsWith('-'))out.format=args.shift();
 for(let i=0;i<args.length;i++){
  if(args[i]==='--help'||args[i]==='-h')return null;
  const key={'--lang':'lang','--output-dir':'directory','--browser-executable':'browser'}[args[i]];
  if(!key||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option: '+args[i]+'. Use --help.');
  out[key]=args[++i];
 }
 if(!['html','pdf','all'].includes(out.format))throw Error('Format must be html, pdf or all.');
 if(!['zh','en','both'].includes(out.lang))throw Error('--lang must be zh, en or both.');
 out.directory=path.resolve(out.directory);return out;
}
function run(script){
 const result=spawnSync(process.env.PYTHON_EXECUTABLE||'python3',[script],{cwd:root,stdio:'inherit'});
 if(result.error)throw Error('Cannot run Python. Set PYTHON_EXECUTABLE to your Python 3 executable.');
 if(result.status!==0)throw Error('Build failed: '+script);
}
async function pdfs(html,opt){
 let chromium;
 try{({chromium}=require('playwright'));}
 catch{throw Error('PDF export needs Playwright. Run: npm install --no-save playwright && npx playwright install chromium');}
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname!=='/'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
 });
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{browser=await chromium.launch({headless:true,...(opt.browser?{executablePath:opt.browser}:{})});}
  catch{throw Error('Chromium could not start. Run npx playwright install chromium, or pass --browser-executable /path/to/chromium.');}
  for(const lang of opt.lang==='both'?['zh','en']:[opt.lang]){
   const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?lang=${lang}#slide=1`,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    await page.emulateMedia({media:'print',reducedMotion:'reduce'});
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
    const failed=await page.locator('#deck > .slide img').evaluateAll(images=>images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.alt||'image'));
    if(failed.length)throw Error('PDF contains missing images: '+failed.join(', '));
    if(errors.length)throw Error('Presentation runtime error: '+errors.join('; '));
    await context.setOffline(true);
    const file=path.join(opt.directory,`presentation-${lang}.pdf`);
    await page.pdf({path:file,preferCSSPageSize:true,printBackground:true});
    process.stdout.write('Exported: '+file+'\n');
   }finally{await context.close();}
  }
 }finally{
  try{if(browser)await browser.close();}
  finally{await new Promise(resolve=>server.close(resolve));}
 }
}
async function main(){
 const opt=options(process.argv.slice(2));
 if(!opt){process.stdout.write('Usage: node tools/export.cjs [html|pdf|all] [--lang zh|en|both] [--output-dir DIR] [--browser-executable PATH]\nHTML keeps both languages; --lang selects PDF language(s). Default: all, zh, dist/exports.\n');return;}
 run('tools/render.py');run('tools/build.py');
 fs.mkdirSync(opt.directory,{recursive:true});
 const source=path.join(root,'dist/offline/presentation.html');
 if(opt.format!=='pdf'){
  const file=path.join(opt.directory,'presentation.html');
  if(source!==file)fs.copyFileSync(source,file);
  process.stdout.write('Exported: '+file+'\n');
 }
 if(opt.format!=='html')await pdfs(fs.readFileSync(source,'utf8'),opt);
}
main().catch(error=>{process.stderr.write('Export failed: '+error.message+'\n');process.exitCode=1;});
