// Stateless MaaS forwarding. Credentials exist only in the current request.
export async function handleMaaS(request, upstream = fetch) {
  const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  if (request.method !== 'POST') return json({error:{message:'仅支持 POST'}},405);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({error:{message:'请求来源不匹配'}},403);
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/.test(auth) || auth.length > 4096) return json({error:{message:'请填写有效 API Key'}},401);
  const contentLength = Number(request.headers.get('Content-Length'));
  if (contentLength > 65536) return json({error:{message:'请求内容过长'}},413);
  let body;
  try {
    const raw = await request.text(); if (raw.length > 65536) return json({error:{message:'请求内容过长'}},413);
    body = JSON.parse(raw); const endpoint = new URL(body.endpoint);
    if (endpoint.protocol !== 'https:' || !/^(?:api|api-[a-z0-9-]+)\.modelarts-maas\.com$/.test(endpoint.hostname) || endpoint.port || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) return json({error:{message:'仅支持华为云 MaaS 官方服务地址'}},400);
    endpoint.pathname = endpoint.pathname.replace(/\/+$/, '');
    if (endpoint.pathname === '/openai/v1') endpoint.pathname += '/chat/completions';
    if (!/^\/(?:openai\/v1|v[12])\/chat\/completions$/.test(endpoint.pathname)) return json({error:{message:'请填写 OpenAI 兼容 Base URL 或完整 chat/completions 地址'}},400);
    body.endpoint = endpoint.href;
    if (!body.payload || typeof body.payload.model !== 'string' || !Array.isArray(body.payload.messages) || !body.payload.messages.length || (body.payload.stream != null && typeof body.payload.stream !== 'boolean')) return json({error:{message:'请求需要 model、messages，stream 应为布尔值'}},400);
  } catch { return json({error:{message:'服务地址或请求 JSON 无效'}},400); }
  try {
    const response = await upstream(body.endpoint, {method:'POST', headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(body.payload),redirect:'manual',signal:AbortSignal.timeout(175000)});
    if (response.status >= 300 && response.status < 400) return json({error:{message:'MaaS 服务地址返回重定向，请检查官方 API 地址',code:'UPSTREAM_REDIRECT'}},502);
    if (response.ok && response.headers.get('Content-Type')?.includes('text/event-stream')) {
      return new Response(response.body, {status:response.status, headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
    }
    const raw = await response.text();
    // Never reflect credentials, cookies, or upstream diagnostic headers.
    const safe = raw.split(auth.slice(7)).join('[Key]');
    try { return json(JSON.parse(safe),response.status); }
    catch { return json({error:{message:`MaaS 返回非 JSON 响应（HTTP ${response.status}）`}},502); }
  } catch (error) {
    const message = String(error?.message || 'Unknown failure');
    const reason = /Illegal invocation|incorrect this/i.test(message) ? 'FETCH_BINDING' : /AbortSignal|timeout.*function/i.test(message) ? 'TIMEOUT_API' : error?.name === 'TimeoutError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK';
    // Log only a bounded classification, never credentials, payload, or raw error text.
    console.error('MAAS_PROXY_FAILURE', reason, error?.name || 'Error');
    return json({error:{message:'无法连接 MaaS 服务，请检查区域地址或稍后重试',code:reason}},502);
  }
}
