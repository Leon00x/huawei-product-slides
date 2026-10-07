(function (root) {
  'use strict';
  async function consume(body, callbacks = {}) {
    if (!body) throw Error('服务未返回响应流');
    const reader = body.getReader(), decoder = new TextDecoder();
    let buffer = '', raw = '', content = '', reasoning = '', usage, completed = false;
    function frame(text) {
      const data = text.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
      if (!data) return;
      if (data.trim() === '[DONE]') { completed = true; return; }
      let event;
      try { event = JSON.parse(data); } catch { throw Error('MaaS 返回了无效的流式响应'); }
      if (event.error) throw Error(event.error.message || '模型流式调用失败');
      if (event.usage) usage = event.usage;
      const choice = event.choices?.find(item => item.index === 0) || event.choices?.[0];
      const delta = choice?.delta || {};
      if (typeof delta.reasoning_content === 'string') { reasoning += delta.reasoning_content; callbacks.onReasoning?.(reasoning); }
      if (typeof delta.content === 'string' && delta.content) { content += delta.content; callbacks.onContent?.(content); }
    }
    function accept(text) {
      raw += text; buffer += text; callbacks.onRaw?.(raw);
      let separator;
      while ((separator = /\r?\n\r?\n/.exec(buffer))) {
        frame(buffer.slice(0, separator.index));
        buffer = buffer.slice(separator.index + separator[0].length);
      }
    }
    try {
      for (;;) {
        const {value, done} = await reader.read();
        if (done) break;
        accept(decoder.decode(value, {stream:true}));
      }
      accept(decoder.decode());
      if (buffer.trim()) frame(buffer);
      if (!completed) throw Error('响应流已中断，已保留收到的内容，可重新发送');
      return {content, reasoning, usage, raw};
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
  }
  const api = {consume};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MaaSStream = api;
})(typeof window !== 'undefined' ? window : globalThis);
