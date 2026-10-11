/* Content remains readable throughout. Only the active page animates. */
(function () {
 'use strict';
 const slides=[...document.querySelectorAll('#deck > .slide')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'), print=matchMedia('print');
 const controllers=[];
 const t=label=>window.DeckI18n?.t(label)||label;
 slides.forEach(slide=>{
  const steps=[...slide.querySelectorAll('[data-flow-step]')];if(!steps.length)return;
  const play=slide.querySelector('[data-flow-play]'), status=slide.querySelector('[data-flow-status]');
  let timer=null,index=steps.length,running=false,active=false;
  function stop(){clearInterval(timer);timer=null;running=false;}
  function draw(){steps.forEach((el,i)=>{el.classList.toggle('flow-current',i===index);el.classList.toggle('flow-done',i<index);});play.textContent=t(running?'暂停':index>=steps.length?'重播':'继续');status.textContent=t(index>=steps.length?'完整示意':running?'自动演示':'暂停');}
  function all(){stop();index=steps.length;draw();}
  function start(reset=false){
   if(!active||reduce.matches||print.matches){all();return;}
   stop();if(reset||index>=steps.length)index=0;running=true;draw();
   timer=setInterval(()=>{index++;if(index>=steps.length)stop();draw();},2400);
  }
  play.addEventListener('click',()=>{if(running){stop();draw();}else start();});
  slide.querySelector('[data-flow-replay]').addEventListener('click',()=>start(true));
  slide.querySelector('[data-flow-all]').addEventListener('click',all);
  controllers.push({slide,all,draw,activate(next){if(next&&!active){active=true;start(true);}else if(!next){active=false;all();}}});
 });
 function sync(){controllers.forEach(c=>c.activate(c.slide.classList.contains('active')));}
 document.addEventListener('deckpagechange',sync);
 document.addEventListener('decklanguagechange',()=>controllers.forEach(c=>c.draw()));
 window.addEventListener('beforeprint',()=>controllers.forEach(c=>c.all()));
 print.addEventListener('change',()=>{if(print.matches)controllers.forEach(c=>c.all());});
 reduce.addEventListener('change',()=>controllers.forEach(c=>c.all()));
 // Thumbnails show the complete flow, with no controls or animation timers.
 window.DeckCompleteScenePreview=clone=>{clone.querySelectorAll('[data-flow-step]').forEach(el=>{el.classList.remove('flow-current');el.classList.add('flow-done');});};
 sync();
})();
