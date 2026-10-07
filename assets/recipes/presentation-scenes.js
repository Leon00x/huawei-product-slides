(function () {
  'use strict';
  const scenes = [...document.querySelectorAll('#deck > [data-scene]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const teamSlide = scenes.find(s => s.querySelector('.team-map'));
  if (teamSlide) {
    const tasks = {
      'expert-prd': ['后端专家', ['设计接口契约与数据模型', '实现业务逻辑与后端 API', '完成接口测试与异常处理', '同步接口结果，配合前端联调']],
      'expert-design': ['前端专家', ['拆分页面与交互组件', '实现页面布局与交互逻辑', '接入后端 API 与状态管理', '完成前后端联调与页面验证']],
      'expert-build': ['开发与验证专家', ['按任务实现代码', '生成测试并检查代码', '修复问题并整理验证结果', '向 Leader 汇报结果']]
    };
    teamSlide.querySelectorAll('.team-expert').forEach(expert => {
      const key = Object.keys(tasks).find(k => expert.classList.contains(k));
      const button = document.createElement('button'); button.type = 'button';
      button.className = expert.className; button.dataset.animOrder = expert.dataset.animOrder; button.innerHTML = expert.innerHTML;
      button.setAttribute('aria-pressed', String(key === 'expert-design'));
      button.classList.toggle('selected', key === 'expert-design'); expert.replaceWith(button);
      button.addEventListener('click', () => {
        controllers.find(c => c.slide === teamSlide).full();
        teamSlide.querySelectorAll('.team-expert').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
        teamSlide.querySelector('.team-task-panel h3').textContent = tasks[key][0];
        const portrait = teamSlide.querySelector('.expert-portrait');
        if (portrait) portrait.textContent = key === 'expert-prd' ? '👨🏻‍💻' : '👩🏻‍💻';
        teamSlide.querySelectorAll('.task-item > span').forEach((text, i) => { text.textContent = tasks[key][1][i]; });
      });
    });
    const caption = teamSlide.querySelector('.team-task-panel p'); caption.textContent = '点击平台切换专家 · 流程示例';
  }
  const controllers = scenes.map(slide => {
    if (slide.hasAttribute('data-index-demo')) return window.DeckIndexScene.create(slide, reduced);
    if (slide.hasAttribute('data-knowledge-demo')) return window.DeckKnowledgeScene.create(slide, reduced);
    if (slide.hasAttribute('data-development-case')) return window.DeckDevelopmentCase.create(slide, reduced);
    if (slide.hasAttribute('data-ops-demo')) return window.DeckOpsScene.create(slide, reduced);
    const nodes = [...slide.querySelectorAll('[data-anim-order]')];
    const max = Math.max(...nodes.map(n => Number(n.dataset.animOrder)));
    const play = slide.querySelector('.scene-play'), reset = slide.querySelector('.scene-reset');
    const label = play.textContent;
    const status = slide.querySelector('.scene-status');
    let stage = 0, timer = null, running = false;
    function clear() { clearInterval(timer); timer = null; running = false; }
    function draw() {
      slide.dataset.sceneStage = stage;
      nodes.forEach(node => {
        const order = Number(node.dataset.animOrder);
        node.classList.toggle('scene-pending', order > stage);
        node.classList.toggle('scene-current', order === stage);
      });
      status.textContent = `步骤 ${stage} / ${max} · 流程示意`;
      if (slide === teamSlide) {
        const done = [...slide.querySelectorAll('.task-item')].filter(n => Number(n.dataset.animOrder) < stage).length;
        slide.querySelector('.team-task-progress b').textContent = `${done} / 4`;
        slide.querySelector('.team-progress-track > span').style.width = `${done / 4 * 100}%`;
      }
    }
    function full() {
      clear(); stage = 0;
      slide.classList.remove('scene-running', 'scene-paused');
      slide.dataset.sceneStage = 'full';
      nodes.forEach(n => n.classList.remove('scene-pending', 'scene-current'));
      play.textContent = label; play.setAttribute('aria-pressed', 'false'); status.textContent = '完整示意';
      if (slide === teamSlide) { slide.querySelector('.team-task-progress b').textContent = '4 / 4'; slide.querySelector('.team-progress-track > span').style.width = '100%'; }
    }
    function advance() {
      stage++; draw();
      if (stage >= max) { clear(); slide.classList.remove('scene-running', 'scene-paused'); play.textContent = '↺ 重播示意'; play.setAttribute('aria-pressed', 'false'); status.textContent = '示意完成'; if (slide === teamSlide) { slide.querySelector('.team-task-progress b').textContent = '4 / 4'; slide.querySelector('.team-progress-track > span').style.width = '100%'; } }
    }
    play.addEventListener('click', () => {
      if (running) { clear(); slide.classList.add('scene-paused'); play.textContent = '▷ 继续播放'; play.setAttribute('aria-pressed', 'false'); return; }
      if (reduced.matches) { full(); status.textContent = '已显示完整流程 · 减少动态效果'; return; }
      if (stage >= max) stage = 0;
      slide.classList.add('scene-running'); slide.classList.remove('scene-paused'); running = true;
      play.textContent = 'Ⅱ 暂停'; play.setAttribute('aria-pressed', 'true');
      if (stage === 0) advance(); else draw();
      timer = setInterval(advance, 1450);
    });
    reset.addEventListener('click', full);
    full(); return { slide, full };
  });
  const print = matchMedia('print');
  window.DeckCompleteScenePreview = clone => {
    if (clone.hasAttribute('data-index-demo')) window.DeckIndexScene.create(clone, reduced).full();
    if (clone.hasAttribute('data-knowledge-demo')) window.DeckKnowledgeScene.create(clone, reduced).full();
    if (clone.hasAttribute('data-development-case')) window.DeckDevelopmentCase.create(clone, reduced).full();
    if (clone.hasAttribute('data-ops-demo')) {
      clone.classList.add('ops-summary');
      window.DeckOpsScene.create(clone, reduced).full();
    }
  };
  let activeSlide = null;
  function activate() {
    const current = document.querySelector('#deck>.active');
    if (current === activeSlide) return;
    activeSlide = current;
    controllers.forEach(c => {
      if (c.slide !== current) c.full();
      else if (c.start && !print.matches && !document.hidden) c.start();
    });
  }
  document.addEventListener('deckpagechange', activate);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { controllers.forEach(c => c.full()); activeSlide = null; } else activate(); });
  print.addEventListener('change', () => { if (print.matches) controllers.forEach(c => c.full()); });
  reduced.addEventListener('change', () => controllers.forEach(c => c.full()));
  activate();
})();

(function(){
  const slide=document.querySelector('.benchmark-slide');
  if(!slide)return;
  slide.querySelector('.aa-replay').addEventListener('click',()=>{
    slide.classList.add('aa-restarting');
    requestAnimationFrame(()=>requestAnimationFrame(()=>slide.classList.remove('aa-restarting')));
  });
})();
(function(){
  const modal=document.getElementById('project-qr-dialog');
  const trigger=document.querySelector('#deck .project-qr-open');
  if(!modal||!trigger)return;
  trigger.addEventListener('click',()=>modal.showModal());
  modal.querySelector('.project-qr-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
})();
