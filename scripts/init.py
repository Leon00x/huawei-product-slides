"""Copy a standalone starter into a new folder without touching another deck."""
from pathlib import Path
import argparse,json,re,shutil,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('destination',type=Path);p.add_argument('--id',required=True);p.add_argument('--title',default='产品介绍');p.add_argument('--title-en',default='Product presentation');args=p.parse_args()
if not re.fullmatch(r'[a-z][a-z0-9-]{2,62}',args.id):p.error('--id must be a unique lowercase slug, 3–63 characters')
target=args.destination.resolve()
if target.exists():p.error('Destination already exists; choose a new folder')
skill=Path(__file__).resolve().parent.parent
shutil.copytree(skill/'assets/template',target,ignore=shutil.ignore_patterns('dist','qa','__pycache__','node_modules','.wrangler','index.html','config.js','translations.js'))
data=json.loads((target/'content/deck.json').read_text(encoding='utf-8'));data['id']=args.id;data['title']={'zh':args.title,'en':args.title_en};data['slides'][0]['title']={'zh':args.title,'en':args.title_en}
(target/'content/deck.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
config=json.loads((target/'deploy/cloudflare/wrangler.json').read_text());config['name']=args.id
(target/'deploy/cloudflare/wrangler.json').write_text(json.dumps(config,indent=2)+'\n')
subprocess.run([sys.executable,str(target/'tools/render.py')],check=True)
print('Starter ready:',target)
