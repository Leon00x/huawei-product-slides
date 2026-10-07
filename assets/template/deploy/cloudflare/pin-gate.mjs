const COOKIE = 'slides_access';
const DAY = 86400;
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>访问演示 · Presentation Access</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f5f7;color:#24272c;font:16px system-ui,sans-serif}main{width:min(380px,calc(100% - 40px));padding:36px;background:white;border-radius:16px;box-shadow:0 18px 60px #2221}.brand{color:#c7000b;font-size:12px;font-weight:700;letter-spacing:2px}h1{font-size:26px;margin:18px 0 8px}p{color:#858994;font-size:14px;margin:0 0 26px}input,button{width:100%;height:48px;border-radius:8px;font:inherit}input{border:1px solid #ddd;padding:0 14px;outline-color:#c7000b;letter-spacing:5px}button{border:0;background:#c7000b;color:white;margin-top:14px;cursor:pointer}button:disabled{opacity:.5}#error{font-size:13px;color:#c7000b;min-height:20px;margin:12px 0 0}</style>
<main><span class="brand">HUAWEI CLOUD · PRESENTATION</span><h1>请输入访问 PIN</h1><p>Enter your PIN to view the presentation.</p><form id="pin-form"><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" aria-label="访问 PIN" required autofocus><button>打开演示 / Open slides</button><div id="error" role="status"></div></form></main>
<script>document.getElementById('pin-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button'),error=document.getElementById('error');b.disabled=true;error.textContent='';try{const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:document.getElementById('pin').value})});if(r.ok)location.reload();else error.textContent=r.status===401?'PIN 不正确 / Incorrect PIN':'请稍后重试 / Please try again';}catch{error.textContent='连接失败，请重试';}finally{b.disabled=false;}};</script></html>`;

async function sign(value, pin) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json', 'Cache-Control':'no-store', ...headers}});

export async function pinGate(request, env) {
  if (!env.ACCESS_PIN) return new Response('Access PIN is not configured', {status:503, headers:{'Cache-Control':'no-store'}});
  const url = new URL(request.url);
  if (url.pathname === '/auth/login') {
    if (request.method !== 'POST') return json({error:'POST required'}, 405);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({error:'Invalid origin'}, 403);
    let input; try {input = await request.json();} catch {return json({error:'Invalid request'},400);}
    if (input.pin !== env.ACCESS_PIN) return json({error:'Incorrect PIN'},401);
    const expiry = String(Math.floor(Date.now()/1000) + DAY);
    const token = expiry + '.' + await sign(expiry, env.ACCESS_PIN);
    return json({ok:true},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; Max-Age=${DAY}; HttpOnly; Secure; SameSite=Lax`});
  }
  const value = request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if (value) {
    const [expiry, signature] = value.split('.');
    const now = Math.floor(Date.now()/1000);
    if (/^\d+$/.test(expiry) && Number(expiry)>now && Number(expiry)<=now+DAY && signature===await sign(expiry,env.ACCESS_PIN)) return null;
  }
  if (url.pathname.startsWith('/api/')) return json({error:'PIN required'},401);
  return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
