"""Build a protected embedded ESM Worker for a compatible Sites host."""
from pathlib import Path
import json,runpy
platform=Path(__file__).resolve().parent;root=platform.parent.parent
runpy.run_path(str(root/'tools/build.py'),run_name='__main__')
html=(root/'dist/offline/presentation.html').read_text(encoding='utf-8')
gate=(root/'deploy/cloudflare/pin-gate.mjs').read_text(encoding='utf-8').replace('export async function pinGate','async function pinGate')
source=gate+'\nconst HTML='+json.dumps(html,ensure_ascii=False)+';\n'+'''export default {async fetch(request,env){
 const gate=await pinGate(request,env);if(gate)return gate;
 const url=new URL(request.url);
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 if(url.pathname!=='/'&&url.pathname!=='/index.html')return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store'}});
}};\n'''
target=platform/'dist/server/index.js';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(source,encoding='utf-8')
print('Built protected embedded Worker:',target)
