/* Cloud-managed enterprise knowledge: illustrative ingestion and retrieval. */
window.DeckKnowledgeScene = {
  create(slide, reduced) {
    const $ = s => slide.querySelector(s);
    const question = '根据《支付接口设计规范》，创建订单接口如何处理重复请求？';
    const answer = '按规范携带 Idempotency-Key；相同键与相同参数返回首次处理结果。相同键但参数不一致时，返回冲突并提示检查请求。';
    const play = $('.scene-play'), status = $('.scene-status');
    let elapsed = 0, previous = 0, frame = null, running = false, finished = true;
    function stop() { cancelAnimationFrame(frame); running = false; frame = null; play.setAttribute('aria-pressed', 'false'); }
    function draw(t, full = false) {
      const localizedQuestion = window.DeckI18n?.t(question) || question;
      const localizedAnswer = window.DeckI18n?.t(answer) || answer;
      const stage = t < 1600 ? 1 : t < 3000 ? 2 : t < 4000 ? 3 : t < 4800 ? 4 : t < 6500 ? 5 : t < 9000 ? 6 : 7;
      slide.dataset.sceneStage = full ? 'full' : String(stage);
      slide.dataset.knowledgeStage = stage;
      $('.kb-input').value = stage === 2 ? localizedQuestion.slice(0, Math.floor((t - 1600) / 1400 * localizedQuestion.length)) : '';
      $('.kb-question').textContent = localizedQuestion;
      $('.kb-question').classList.toggle('visible', stage >= 3);
      $('.kb-returned-context').classList.toggle('visible', stage >= 5);
      $('.kb-answer').classList.toggle('visible', stage >= 6);
      $('.kb-answer-text').textContent = full ? localizedAnswer : localizedAnswer.slice(0, Math.max(0, Math.floor((t - 6500) / 2400 * localizedAnswer.length)));
      $('.kb-doc-state').textContent = stage === 1 ? '文档摄入中…' : '已摄入 · 可检索';
      $('.kb-agent-state').textContent = stage < 3 ? '等待文档提问' : stage < 5 ? '检索云上企业知识库' : stage < 6 ? '接收相关知识片段' : stage < 7 ? '根据文档生成回答' : '回答完成';
      const labels = ['01 云上管理与文档摄入','02 输入文档相关问题','03 请求云上知识库','04 检索相关文档片段','05 知识上下文返回 Agent','06 基于文档回答','示意完成'];
      status.textContent = full ? '完整示意' : labels[stage - 1];
    }
    function full() { stop(); elapsed = 9000; finished = true; slide.classList.remove('scene-running','scene-paused'); draw(9000, true); play.textContent = '↺ 重播知识流'; }
    function tick(now) { elapsed += now - previous; previous = now; draw(Math.min(elapsed,9000)); if (elapsed >= 9000) { stop(); finished = true; slide.classList.remove('scene-running'); play.textContent = '↺ 重播知识流'; return; } frame = requestAnimationFrame(tick); }
    function toggle() {
      if (running) { stop(); slide.classList.add('scene-paused'); play.textContent = '▷ 继续播放'; return; }
      if (reduced.matches) { full(); return; }
      if (finished) { elapsed = 0; finished = false; }
      previous = performance.now(); running = true; slide.classList.add('scene-running'); slide.classList.remove('scene-paused'); play.textContent = 'Ⅱ 暂停'; play.setAttribute('aria-pressed','true'); draw(elapsed); frame = requestAnimationFrame(tick);
    }
    function start() { full(); if (!reduced.matches) toggle(); }
    play.addEventListener('click',toggle); $('.scene-reset').addEventListener('click',full);
    $('.kb-send').addEventListener('click',() => { if (!running) toggle(); });
    if(slide.closest('#deck')) document.addEventListener('decklanguagechange',()=>draw(elapsed,finished));
    full(); return { slide, full, start };
  }
};
