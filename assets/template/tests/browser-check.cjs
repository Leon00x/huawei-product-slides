/* npm i --no-save playwright; BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.DECK_URL||'http://127.0.0.1:8798/index.html';
 fs.mkdirSync('qa',{recursive:true});
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 const count=await page.locator('#deck > .slide').count();assert.ok(count>0);
 for(const viewport of [{width:1600,height:1000},{width:1366,height:768},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const lang of ['zh','en']){
   await page.evaluate(lang=>DeckI18n.setLanguage(lang),lang);
   for(let i=1;i<=count;i++){
    await page.evaluate(i=>{location.hash='#slide='+i},i);await page.waitForTimeout(60);
    const failures=await page.locator('#deck > .slide.active').evaluate(slide=>{
     const bad=[],scale=document.querySelector('#deck').getBoundingClientRect().width/1600,footer=slide.querySelector('.slide-footer'),edge=slide.getBoundingClientRect().right;
     const body=slide.querySelector('.kit-body');
     if(footer&&body&&body.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-8*scale)bad.push('body overlaps footer');
     for(const el of slide.querySelectorAll('h1,h2,h3,p,.kit-layer span,.kit-table td,.kit-table th,.kit-metrics b,.kit-note')){
      if(!el.getClientRects().length)continue;
      if(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)bad.push('text overflow: '+el.textContent);
      const range=document.createRange();range.selectNodeContents(el);if(range.getBoundingClientRect().right>edge+2)bad.push('outside slide: '+el.textContent);
      if(footer&&!el.closest('.slide-header')&&range.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-8*scale)bad.push('text crosses footer: '+el.textContent);
     }
     if(document.documentElement.lang==='en'){
      const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
       const node=walker.currentNode,parent=node.parentElement;
       if(parent?.getClientRects().length&&!parent.closest('[data-no-translate]')&&/[\u3400-\u9fff]/.test(node.nodeValue))bad.push('untranslated text: '+node.nodeValue);
      }
     }
     return bad;
    });
    assert.deepEqual(failures,[],`${viewport.width}/${lang}/slide ${i}`);
   }
  }
 }
 await page.setViewportSize({width:1600,height:1000});
 // English -> Chinese roundtrip must restore the title, then directory links must still work.
 await page.evaluate(()=>{location.hash='#slide=1';DeckI18n.setLanguage('zh')});await page.waitForTimeout(60);
 const original=await page.locator('#deck > .slide.active h1').textContent();
 await page.evaluate(()=>DeckI18n.setLanguage('en'));await page.evaluate(()=>DeckI18n.setLanguage('zh'));
 assert.equal(await page.locator('#deck > .slide.active h1').textContent(),original);
 await page.keyboard.press('g');assert.equal(await page.locator('#overview-dialog').evaluate(x=>x.open),true);
 assert.equal(await page.locator('.thumbnail').count(),count);await page.locator('.thumbnail').last().click();
 assert.equal(await page.locator('#overview-dialog').evaluate(x=>x.open),false);
 const workflow=page.locator('#deck > .slide').filter({has:page.locator('[data-flow-step]')}).first();
 if(await workflow.count()){
  const index=await workflow.evaluate(x=>[...x.parentElement.children].indexOf(x)+1);
  await page.evaluate(index=>{location.hash='#slide='+index},index);await page.waitForTimeout(60);
  await page.locator('#deck > .slide.active [data-flow-replay]').click();
  assert.equal(await page.locator('#deck > .slide.active .flow-current').count(),1);
  await page.waitForTimeout(2500);assert.equal(await page.locator('#deck > .slide.active .flow-current').getAttribute('data-flow-step'),'1');
  await page.locator('#deck > .slide.active [data-flow-play]').click();
  const paused=await page.locator('#deck > .slide.active .flow-current').getAttribute('data-flow-step');
  await page.waitForTimeout(2500);assert.equal(await page.locator('#deck > .slide.active .flow-current').getAttribute('data-flow-step'),paused);
  await page.locator('#deck > .slide.active [data-flow-all]').click();assert.equal(await page.locator('#deck > .slide.active .flow-current').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#deck > .slide.active [data-flow-replay]').click();assert.equal(await page.locator('#deck > .slide.active .flow-current').count(),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#deck > .slide.active [data-flow-replay]').click();
  await page.keyboard.press('Home');await page.waitForTimeout(2500);assert.equal(await workflow.locator('.flow-current').count(),0);
 }
 for(const lang of ['zh','en']){
  await page.evaluate(lang=>DeckI18n.setLanguage(lang),lang);
  await page.evaluate(()=>{location.hash='#slide=2'});await page.waitForTimeout(60);
  await page.screenshot({path:`qa/template-${lang}.png`});
 }
 await page.emulateMedia({media:'print'});await page.waitForTimeout(100);
 assert.equal(await page.locator('#deck .flow-current').count(),0);
 // Verify print state without creating a PDF; use test:export only when export is requested.
 assert.deepEqual(errors,[]);await browser.close();console.log(`PASS: ${count} slides, 2 languages, 3 viewports, navigation, motion, reduced motion and print`);
})().catch(e=>{console.error(e);process.exit(1)});
