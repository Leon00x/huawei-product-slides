(function () {
  'use strict';
  const T = text => window.DeckI18n?.t(text) || text;
  const $ = id => document.getElementById(id);
  const keyInput = $('api-key'); if (!keyInput) return;
  const storageKey = 'huawei-maas-demo-key-v1', lifetime = 3 * 24 * 60 * 60 * 1000;
  let expiry = 0, expiryTimer, controller;
  function forget() { expiry = 0; clearTimeout(expiryTimer); keyInput.value = ''; try { localStorage.removeItem(storageKey); } catch {} $('api-key-state').textContent = T('Key 未保存'); }
  function refreshKey() {
    if (expiry && Date.now() >= expiry) { forget(); $('api-status').textContent = T('本地 Key 已过期，请重新输入并保存'); }
  }
  function restore() {
    clearTimeout(expiryTimer);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return;
      if (!saved.key || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= Date.now() || saved.expiresAt > Date.now() + lifetime) { forget(); return; }
      keyInput.value = saved.key; expiry = saved.expiresAt;
      $('api-key-state').textContent = T('Key 已保存 · ') + new Date(expiry).toLocaleDateString('zh-CN') + T(' 到期');
      expiryTimer = setTimeout(refreshKey, Math.max(1, expiry - Date.now()));
    } catch { forget(); }
  }
  $('api-save-key').addEventListener('click', () => {
    refreshKey(); const key = keyInput.value.trim();
    if (!key) { $('api-status').textContent = T('请先填写 API Key'); keyInput.focus(); return; }
    try { localStorage.setItem(storageKey, JSON.stringify({ key, expiresAt: Date.now() + lifetime })); restore(); $('api-status').textContent = T('Key 已保存到当前浏览器，3 天后自动清除'); }
    catch { $('api-status').textContent = T('浏览器不允许本地保存；仍可使用当前填写的 Key 发送'); }
  });
  $('api-clear-key').addEventListener('click', () => { forget(); $('api-status').textContent = T('本地 Key 已清除'); });
  keyInput.addEventListener('input', () => { $('api-key-state').textContent = T('Key 已编辑 · 未保存'); });
  $('api-cancel').addEventListener('click', () => controller?.abort());
  $('api-back-request').addEventListener('click', () => {
    $('api-response-panel').hidden = true;
    $('api-request').inert = false;
    $('api-request').focus();
  });
  $('api-send').addEventListener('click', async () => {
    refreshKey(); if (controller) return;
    const key = keyInput.value.trim();
    if (!key) { $('api-status').textContent = T('请先填写 API Key'); keyInput.focus(); return; }
    let payload, endpoint;
    try {
      endpoint = new URL($('api-endpoint').value.trim());
      if (endpoint.protocol !== 'https:' || !/^(?:api|api-[a-z0-9-]+)\.modelarts-maas\.com$/.test(endpoint.hostname) || endpoint.port || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw Error(T('请填写华为云 MaaS 官方 HTTPS 服务地址'));
      endpoint.pathname = endpoint.pathname.replace(/\/+$/, '');
      if (endpoint.pathname === '/openai/v1') endpoint.pathname += '/chat/completions';
      if (!/^\/(?:openai\/v1|v[12])\/chat\/completions$/.test(endpoint.pathname)) throw Error(T('请填写 OpenAI 兼容 Base URL 或完整 chat/completions 地址'));
      payload = JSON.parse($('api-request').value);
      if (!payload || typeof payload.model !== 'string' || !payload.model.trim() || !Array.isArray(payload.messages) || !payload.messages.length) throw Error(T('请求必须包含 model 和非空 messages 数组'));
      if (payload.stream != null && typeof payload.stream !== 'boolean') throw Error(T('stream 应为 true 或 false'));
    } catch (error) { $('api-status').textContent = error.message; return; }
    controller = new AbortController(); const timeout = setTimeout(() => controller?.abort(), 180000);
    $('api-send').disabled = true; $('api-cancel').hidden = false;
    $('api-response-panel').hidden = false; $('api-request').inert = true;
    $('api-response-title').textContent = T('模型响应 · 生成中');
    $('api-status').textContent = T('正在请求模型…'); $('api-response').textContent = T('等待 MaaS 返回响应…');
    $('api-response').classList.remove('is-reasoning');
    let receivedContent = '', receivedReasoning = false;
    const safeText = text => String(text).split(key).join('[Key]');
    function renderContent(text) {
      const area = $('api-response'), follow = area.scrollTop + area.clientHeight >= area.scrollHeight - 24;
      receivedContent = safeText(text); area.textContent = receivedContent;
      area.classList.remove('is-reasoning');
      $('api-response-title').textContent = T('回答 · 流式输出');
      if (follow) area.scrollTop = area.scrollHeight;
      $('api-status').textContent = T('流式输出中…');
    }
    try {
      const offline = location.protocol === 'file:';
      const response = await fetch(offline ? endpoint.href : '/api/maas', {method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + key}, body:JSON.stringify(offline ? payload : {endpoint:endpoint.href,payload}), signal:controller.signal, cache:'no-store', credentials:offline ? 'omit' : 'same-origin'});
      let tokens;
      if (response.ok && response.headers.get('Content-Type')?.includes('text/event-stream')) {
        const result = await window.MaaSStream.consume(response.body, {
          onContent: renderContent,
          onReasoning: text => {
            if (receivedContent || !text) return;
            receivedReasoning = true;
            const area = $('api-response'), follow = area.scrollTop + area.clientHeight >= area.scrollHeight - 24;
            area.classList.add('is-reasoning'); area.textContent = safeText(text);
            if (follow) area.scrollTop = area.scrollHeight;
            $('api-response-title').textContent = T('思考中 · 流式输出');
            $('api-status').textContent = T('正在思考，正文随后显示…');
          }
        });
        if (!receivedContent) $('api-response').textContent = T('模型未返回正文，请调整问题或增加 max_tokens 后重试。');
        tokens = result.usage?.total_tokens;
      } else {
        const raw = await response.text();
        let data;
        try { data = JSON.parse(raw); } catch { throw Error(`服务返回无效响应（HTTP ${response.status}）`); }
        if (!response.ok) throw Error(data.error?.message || data.message || `请求失败（HTTP ${response.status}）`);
        const message = data.choices?.[0]?.message;
        if (!message) throw Error(T('模型返回内容不符合 chat/completions 响应结构'));
        renderContent(typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? message.tool_calls ?? '', null, 2));
        tokens = data.usage?.total_tokens;
      }
      $('api-status').textContent = T('响应完成') + (tokens != null ? ` · ${tokens} Tokens` : '');
      $('api-response-title').textContent = T('模型响应');
    } catch (error) {
      const text = error.name === 'AbortError' ? T('请求已取消或超时，可重新发送') : error.message;
      const safe = T(String(text)).split(key).join('[Key]');
      $('api-status').textContent = safe;
      $('api-response-title').textContent = T('请求未完成');
      if (!receivedContent && !receivedReasoning) $('api-response').textContent = safe + T('\n\n可返回请求，检查 Key、模型名称和服务地址后重试。');
    } finally { clearTimeout(timeout); controller = null; $('api-send').disabled = false; $('api-cancel').hidden = true; }
  });
  window.addEventListener('focus', refreshKey);
  document.addEventListener('visibilitychange', refreshKey);
  restore();
})();
