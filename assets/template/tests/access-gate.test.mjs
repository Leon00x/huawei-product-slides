import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../deploy/cloudflare/worker.mjs';

const origin = 'https://slides.example';
const env = {
  ACCESS_PIN: '9876',
  ASSETS: {fetch: async () => new Response('private slides')}
};
const login = (pin, extra = {}) => worker.fetch(new Request(origin + '/auth/login', {
  method:'POST', headers:{'Content-Type':'application/json', Origin: origin, ...extra}, body:JSON.stringify({pin})
}), env);

test('anonymous visitors see the PIN page and cannot access scripts or protected API paths', async () => {
  for (const route of ['/', '/js/app.js', '/css/styles.css', '/assets/huawei-logo.png']) {
    const response = await worker.fetch(new Request(origin + route), env);
    const html = await response.text();
    assert.ok(html.includes('id="pin-form"'));
    assert.ok(!html.includes('private slides'));
    assert.ok(!html.includes(env.ACCESS_PIN));
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal((await worker.fetch(new Request(origin + '/api/maas', {method:'POST'}), env)).status, 401);
});

test('PIN login rejects wrong credentials and foreign origins, then issues a signed HttpOnly cookie', async () => {
  assert.equal((await login('wrong')).status, 401);
  assert.equal((await login(env.ACCESS_PIN, {Origin:'https://foreign.example'})).status, 403);
  const response = await login(env.ACCESS_PIN);
  assert.equal(response.status, 200);
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=86400/);
  const auth = cookie.split(';')[0];
  assert.equal(await (await worker.fetch(new Request(origin + '/', {headers:{Cookie: auth}}), env)).text(), 'private slides');
  const corrupted = auth.slice(0, -2) + 'xx';
  assert.match(await (await worker.fetch(new Request(origin + '/', {headers:{Cookie: corrupted}}), env)).text(), /id="pin-form"/);
});

test('expired sessions and missing configuration require authentication', async () => {
  const response = await login(env.ACCESS_PIN);
  const cookie = response.headers.get('Set-Cookie').split(';')[0];
  const now = Date.now;
  try {
    Date.now = () => now() + 86401000;
    assert.match(await (await worker.fetch(new Request(origin + '/', {headers:{Cookie: cookie}}), env)).text(), /id="pin-form"/);
  } finally { Date.now = now; }
  assert.equal((await worker.fetch(new Request(origin + '/'), {})).status, 503);
});
