import {pinGate} from './pin-gate.mjs';
export default {async fetch(request, env) {
  // PIN is enforced before every asset. Missing ACCESS_PIN fails closed.
  const gate = await pinGate(request, env); if (gate) return gate;
  if (new URL(request.url).pathname.startsWith('/api/')) return new Response('Not found', {status:404});
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers); headers.set('Cache-Control', 'private, no-store');
  return new Response(response.body, {status:response.status, headers});
}};
