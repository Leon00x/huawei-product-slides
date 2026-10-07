"""Bundle local CSS, JS and images into one portable presentation.html."""
from pathlib import Path
import base64,mimetypes,re
ROOT=Path(__file__).resolve().parent.parent
html=(ROOT/'index.html').read_text(encoding='utf-8')
def inline_css(match):
 css=(ROOT/match[1]).read_text(encoding='utf-8').replace('../assets/','assets/')
 return '<style>\n'+css+'\n</style>'
html=re.sub(r'<link rel="stylesheet" href="(css/[a-z0-9-]+\.css)">',inline_css,html)
scripts=[]
def script(match):
 code=(ROOT/match[1]).read_text(encoding='utf-8').replace('</script','<\\/script')
 scripts.append('<script>\n'+code+'\n</script>');return ''
html=re.sub(r'<script defer src="(js/[a-z0-9-]+\.js)"></script>',script,html)
html=html.replace('</body>','\n'.join(scripts)+'\n</body>')
def embed(match):
 path=ROOT/match[0];mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
 return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
html=re.sub(r'assets/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|svg|webp)',embed,html)
target=ROOT/'dist/offline/presentation.html';target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(html,encoding='utf-8');print(f'Built {target.name}: {target.stat().st_size:,} bytes')
