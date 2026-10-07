/* Single DOM, reversible offline localization. User inputs and model output are not translated. */
(function(){
  'use strict';
  const dictionary=window.DeckEnglish, originals=new WeakMap(), attributes=new WeakMap();
  const preference=window.DeckConfig.id+'-language-v1';
  let language='zh', observer;
  const excluded='script,style,textarea,input,[data-no-translate]';
  const translatable=['title','aria-label','alt','placeholder'];
  function english(text){
    if(dictionary[text]!==undefined)return dictionary[text];
    const trimmed=text.trim();if(trimmed&&trimmed!==text)return text.replace(trimmed,english(trimmed));
    let m;
    if((m=text.match(/^第 (\d+) 页：(.+)$/)))return `Slide ${m[1]}: ${english(m[2])}`;
    if((m=text.match(/^第 (\d+) 页，共 (\d+) 页：(.+)$/)))return `Slide ${m[1]} of ${m[2]}: ${english(m[3])}`;
    return text;
  }
  function t(text){return language==='en'?english(text):text;}
  function localizeText(node){
    if(!node.parentElement||node.parentElement.closest(excluded))return;
    const value=node.nodeValue;
    let record=originals.get(node);
    if(!record||value!==record.last){
      let source=value;
      record={source,last:value};originals.set(node,record);
    }
    const trim=record.source.trim();
    const translated=language==='en'?record.source.replace(trim,english(trim)):record.source;
    if(value!==translated)node.nodeValue=translated;
    record.last=translated;
  }
  function localizeElement(el){
    if(!el.getAttribute||el.matches('script,style'))return;
    let records=attributes.get(el);if(!records){records={};attributes.set(el,records);}
    for(const name of translatable){
      const value=el.getAttribute(name);if(value===null)continue;
      let r=records[name];if(!r||value!==r.last)r=records[name]={source:value,last:value};
      const translated=t(r.source);if(value!==translated)el.setAttribute(name,translated);r.last=translated;
    }
  }
  function walk(root){
    if(root.nodeType===3){localizeText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1&&root.closest(excluded))return;
    if(root.nodeType===1)localizeElement(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)localizeText(node);else localizeElement(node);}
  }
  function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:translatable});}
  function copySource(from,to){
    const a=[from,...from.querySelectorAll('*')],b=[to,...to.querySelectorAll('*')];
    a.forEach((el,i)=>{
      if(attributes.has(el))attributes.set(b[i],structuredClone(attributes.get(el)));
      [...el.childNodes].forEach((n,j)=>{if(n.nodeType===3&&originals.has(n))originals.set(b[i].childNodes[j],{...originals.get(n)});});
    });
  }
  function setLanguage(next,persist=true){
    language=next==='en'?'en':'zh';
    observer?.disconnect();
    document.documentElement.lang=language==='en'?'en':'zh-CN';
    document.body.classList.toggle('english-deck',language==='en');
    walk(document.documentElement);
    const button=document.getElementById('language-toggle');
    button.textContent=language==='en'?'中文':'EN';button.setAttribute('aria-label',language==='en'?'Switch to Chinese':'切换到英文');button.title=language==='en'?'Switch to Chinese':'切换到英文';
    if(persist){try{localStorage.setItem(preference,language);const u=new URL(location.href);u.searchParams.set('lang',language);history.replaceState(null,'',u);}catch{}}
    document.dispatchEvent(new CustomEvent('decklanguagechange',{detail:{language}}));
    walk(document.documentElement);observe();
  }
  window.DeckI18n={t,english,setLanguage,copySource,get language(){return language;}};
  observer=new MutationObserver(records=>{
    observer.disconnect();
    for(const record of records){if(record.type==='childList')record.addedNodes.forEach(walk);else if(record.type==='characterData')localizeText(record.target);else localizeElement(record.target);}
    observe();
  });
  document.getElementById('language-toggle').addEventListener('click',()=>setLanguage(language==='en'?'zh':'en'));
  let initial;try{initial=new URLSearchParams(location.search).get('lang')||localStorage.getItem(preference);}catch{}
  setLanguage(initial==='en'?'en':'zh',false);
})();
