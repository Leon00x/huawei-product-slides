/* One illustrative ChatBI task, two development approaches. */
window.DeckDevelopmentCase = {
  create(slide, reduced) {
    const $ = selector => slide.querySelector(selector);
    const play = $('.scene-play'), status = $('.scene-status');
    const steps = [...slide.querySelectorAll('[data-case-step]')];
    const duration = 18000;
    const labels = ['01 输入想法 / 明确规格', '02 生成预览 / 设计方案', '03 提出反馈 / 分解任务', '04 修改原型 / 实现与验证', '05 对照交付产物'];
    const vibe = ['输入想法', '生成首版图表', '预览并提出反馈', '调整图表与筛选', '原型完成'];
    const sdd = ['明确验收要求', '设计实现方案', '分解编码任务', '按规格实现与测试', '验收完成'];
    let elapsed = duration, previous = 0, frame = null, running = false, finished = true;
    let drawnState = null;
    const t = text => window.DeckI18n?.t(text) || text;
    function stop() {
      cancelAnimationFrame(frame); frame = null; running = false;
      play.setAttribute('aria-pressed', 'false');
    }
    function draw(full = false) {
      const stage = Math.min(5, Math.floor(elapsed / 3600) + 1);
      const state = `${stage}:${full}:${finished}:${document.documentElement.lang}`;
      if (drawnState === state) return;
      drawnState = state;
      slide.dataset.caseStage = String(stage);
      slide.dataset.sceneStage = full ? 'full' : String(stage);
      steps.forEach(node => {
        const order = Number(node.dataset.caseStep);
        node.classList.toggle('case-pending', !full && order > stage);
        node.classList.toggle('case-current', !full && !finished && order === stage);
      });
      slide.querySelectorAll('[data-check]').forEach(node => node.classList.toggle('case-check-pending', Number(node.dataset.check) > stage));
      $('[data-vibe-state]').textContent = t(vibe[stage - 1]);
      $('[data-sdd-state]').textContent = t(sdd[stage - 1]);
      $('[data-preview-caption]').textContent = t(stage < 4 ? '首版：柱状图预览' : '折线图 + 时间筛选');
      status.textContent = t(full ? '完整示意' : finished ? '示意完成' : labels[stage - 1]);
    }
    function full() {
      stop(); elapsed = duration; finished = true;
      slide.classList.remove('scene-running', 'scene-paused');
      draw(true); play.textContent = t('↺ 重播案例');
    }
    function tick(now) {
      if (!running) return;
      elapsed = Math.min(duration, elapsed + Math.max(0, now - previous)); previous = now;
      if (elapsed >= duration) {
        stop(); finished = true; slide.classList.remove('scene-running', 'scene-paused');
        play.textContent = t('↺ 重播案例'); draw(); return;
      }
      draw(); frame = requestAnimationFrame(tick);
    }
    function toggle() {
      if (running) {
        stop(); slide.classList.remove('scene-running'); slide.classList.add('scene-paused');
        play.textContent = t('▷ 继续播放'); return;
      }
      if (reduced.matches || !slide.classList.contains('active')) { full(); return; }
      if (finished) { elapsed = 0; finished = false; }
      previous = performance.now(); running = true;
      slide.classList.add('scene-running'); slide.classList.remove('scene-paused');
      play.textContent = t('Ⅱ 暂停'); play.setAttribute('aria-pressed', 'true');
      draw(); frame = requestAnimationFrame(tick);
    }
    function start() { full(); if (!reduced.matches) toggle(); }
    play.addEventListener('click', toggle); $('.scene-reset').addEventListener('click', full);
    if (slide.closest('#deck')) document.addEventListener('decklanguagechange', () => {
      draw(slide.dataset.sceneStage === 'full');
      play.textContent = t(running ? 'Ⅱ 暂停' : finished ? '↺ 重播案例' : '▷ 继续播放');
    });
    full(); return { slide, full, start };
  }
};
