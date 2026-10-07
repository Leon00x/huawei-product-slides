/* Illustrative orchestration only; this presentation makes no cloud changes. */
window.DeckOpsScene = {
  create(slide, reduced) {
    const choices = [...slide.querySelectorAll('[data-ops-choice]')];
    const panels = [...slide.querySelectorAll('[data-ops-panel]')];
    const play = slide.querySelector('.scene-play'), status = slide.querySelector('.scene-status');
    let timer = null, stage = 0, running = false;
    const t = text => window.DeckI18n?.t(text) || text;
    function stop() { clearTimeout(timer); timer = null; running = false; }
    function label() {
      status.textContent = t(stage === 0 ? '完整示意' : stage === 1 ? '理解任务与组织流程' : stage === 2 ? '专项 Skills 执行操作' : '汇总执行产出');
      play.textContent = t(running ? 'Ⅱ 暂停' : stage > 0 && stage < 3 ? '▷ 继续播放' : '↺ 重播编排');
      play.setAttribute('aria-pressed', String(running));
    }
    function full() {
      stop(); stage = 0; slide.dataset.sceneStage = 'full';
      slide.classList.remove('scene-running', 'scene-paused'); label();
    }
    function advance() {
      stage++; slide.dataset.sceneStage = String(stage);
      if (stage >= 3) { stop(); slide.classList.remove('scene-running'); }
      label(); if (running) timer = setTimeout(advance, 1200);
    }
    function toggle() {
      if (running) { stop(); slide.classList.remove('scene-running'); slide.classList.add('scene-paused'); label(); return; }
      if (reduced.matches || !slide.classList.contains('active') || matchMedia('print').matches) { full(); return; }
      if (stage === 0 || stage >= 3) stage = 0;
      running = true; slide.classList.add('scene-running'); slide.classList.remove('scene-paused');
      if (stage === 0) advance(); else { label(); timer = setTimeout(advance, 1200); }
    }
    function select(index, animate = false) {
      full();
      choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      if (animate) toggle();
    }
    choices.forEach((button, index) => button.addEventListener('click', () => select(index, true)));
    play.addEventListener('click', toggle); slide.querySelector('.scene-reset').addEventListener('click', full);
    if (slide.closest('#deck')) document.addEventListener('decklanguagechange', label);
    full();
    return { slide, full, start() { select(0, true); } };
  }
};
