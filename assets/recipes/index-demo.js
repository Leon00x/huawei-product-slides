/* Same illustrative task, two retrieval paths. Timings are animation, not benchmarks. */
window.DeckIndexScene = {
  create(slide, reduced) {
    const command = '找到登录鉴权逻辑及相关调用';
    const files = [...slide.querySelectorAll('.slow .demo-file-list > span')].map(n => n.textContent.trim().replace(/^TS\s*/, ''));
    const play = slide.querySelector('.scene-play'), status = slide.querySelector('.scene-status');
    let elapsed = 0, previous = 0, frame = null, running = false, finished = true;
    const $ = selector => slide.querySelector(selector);
    const code = ['import { session } from "./session";', '', 'export function authenticate(req) {', '  const token = req.headers.authorization;', '  if (!token) return null;', '  return session.verify(token);', '}'];
    function stop() { cancelAnimationFrame(frame); frame = null; running = false; play.setAttribute('aria-pressed', 'false'); }
    function draw(t, full = false) {
      const displayedCommand = window.DeckI18n?.t(command) || command;
      const sent = t >= 1500, seconds = Math.max(0, (t - 1500) / 1000), complete = seconds >= 1;
      const count = Math.min(16, Math.floor(seconds * 2));
      slide.dataset.sceneStage = full ? 'full' : t < 1200 ? '1' : !sent ? '2' : !complete ? '3' : t < 5500 ? '4' : t < 9500 ? '5' : '6';
      slide.dataset.indexPhase = !sent ? 'input' : complete ? 'complete' : 'retrieving';
      slide.classList.toggle('index-flow-active', sent && !complete && !full);
      slide.querySelectorAll('.demo-composer input').forEach(input => { input.value = sent ? '' : displayedCommand.slice(0, Math.floor(t / 1200 * displayedCommand.length)); });
      slide.querySelectorAll('.demo-message').forEach(n => n.classList.toggle('sent', sent));
      slide.querySelectorAll('.demo-send').forEach(n => n.classList.toggle('sending', t >= 1200 && !sent));
      $('[data-clock="slow"]').innerHTML = Math.min(8, seconds).toFixed(1) + '<span>s</span>';
      $('[data-clock="fast"]').innerHTML = Math.min(1, seconds).toFixed(1) + '<span>s</span>';
      $('[data-summary="slow"]').textContent = sent ? '仍在逐文件查找…' : '等待任务输入';
      $('[data-count]').textContent = `已翻阅 ${count} / 24 个文件`;
      $('[data-summary="fast"]').textContent = complete ? '已定位相关代码' : sent ? '正在检索索引…' : '等待任务输入';
      $('.fast [data-agent-state]').textContent = complete ? '检索完成' : sent ? '检索中' : '待发送';
      $('.slow [data-agent-state]').textContent = sent ? '阅读文件中' : '待发送';
      $('.fast [data-response-title]').textContent = complete ? '找到鉴权入口与调用关系' : sent ? '检索结构与语义索引' : '准备项目上下文';
      $('.fast [data-response-detail]').textContent = complete ? 'auth.ts → session.ts → routes.ts' : 'Graph + Vector → 相关代码片段';
      $('.slow [data-response-title]').textContent = sent ? `读取 ${files[Math.min(count, 23)]}` : '准备逐文件检索';
      $('.slow [data-response-detail]').textContent = sent ? '继续搜索引用，补齐跨文件调用关系…' : '关键词搜索 → 打开文件 → 阅读代码';
      $('.fast').classList.toggle('retrieval-complete', complete);
      $('.live-principle').classList.toggle('flow-complete', complete);
      slide.querySelectorAll('.slow [data-file]').forEach((n, i) => { n.classList.toggle('reading-file', i === count); n.classList.toggle('read-file', i < count); });
      $('.slow .demo-file-list').style.transform = `translateY(-${Math.max(0, count - 3) * 25}px)`;
      $('.slow [data-open-file]').textContent = files[count];
      const part = sent ? Math.min(code.length, 1 + Math.floor((seconds % .5) / .5 * code.length)) : 0;
      $('.slow [data-code-read]').textContent = code.slice(0, full ? 4 : part).map((line, i) => `${i + 1}  ${line}`).join('\n');
      $('.fast [data-code-read]').textContent = complete ? code.map((line, i) => `${i + 1}  ${line}`).join('\n') : '// indexed project context\n// ready for retrieval';
      $('.slow .demo-read-progress span').style.width = `${full ? 45 : (seconds % .5) * 140}%`;
      $('.fast .demo-read-progress span').style.width = complete ? '100%' : `${Math.min(100, seconds * 100)}%`;
      $('.slow [data-read-label]').textContent = sent ? '读取内容 · 搜索引用 · 再打开下一个文件' : '等待检索命令';
      $('.fast [data-read-label]').textContent = complete ? '✓ 相关代码已返回' : '通过索引定位相关代码';
      status.textContent = full ? '完整示意' : !sent ? '01 输入并发送命令' : complete ? '有索引已完成 · 未索引继续读取' : '02 并行检索 · 示意计时';
    }
    function full() { stop(); finished = true; elapsed = 9500; slide.classList.remove('scene-running', 'scene-paused'); draw(elapsed, true); play.textContent = '▷ 播放检索对比'; }
    function tick(now) { elapsed += now - previous; previous = now; draw(Math.min(elapsed, 9500)); if (elapsed >= 9500) { stop(); finished = true; slide.classList.remove('scene-running'); play.textContent = '↺ 重播检索对比'; return; } frame = requestAnimationFrame(tick); }
    function toggle() {
      if (running) { stop(); slide.classList.add('scene-paused'); play.textContent = '▷ 继续播放'; return; }
      if (reduced.matches) { full(); status.textContent = '完整示意 · 减少动态效果'; return; }
      if (finished) { elapsed = 0; finished = false; }
      running = true; previous = performance.now(); slide.classList.add('scene-running'); slide.classList.remove('scene-paused'); play.textContent = 'Ⅱ 暂停'; play.setAttribute('aria-pressed', 'true'); draw(elapsed); frame = requestAnimationFrame(tick);
    }
    play.addEventListener('click', toggle);
    slide.querySelectorAll('.demo-send').forEach(button => button.addEventListener('click', () => { if (!running) toggle(); }));
    $('.scene-reset').addEventListener('click', full);
    function start() { full(); if (!reduced.matches) toggle(); }
    if(slide.closest('#deck')) document.addEventListener('decklanguagechange',()=>draw(elapsed,finished));
    full(); return { slide, full, start };
  }
};
