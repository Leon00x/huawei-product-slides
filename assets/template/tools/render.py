"""Generate a bilingual deck from content/deck.json. No external dependencies."""
from pathlib import Path
import html,json,re,uuid
ROOT=Path(__file__).resolve().parent.parent
D=json.loads((ROOT/'content/deck.json').read_text(encoding='utf-8'))
translations={
 '屏蔽页面':'Hide slides',
 '恢复全部':'Restore all',
 '取消':'Cancel',
 '保存':'Save',
 '不演示':'Hidden',
 '勾选不演示的页面，再保存':'Select slides to hide, then save',
 '至少保留一页用于演示':'Keep at least one slide in the presentation',
 '仅当前浏览器生效':'Applies only to this browser',
 '已屏蔽':'Hidden',
 '已保存页面屏蔽设置':'Slide visibility settings saved',
 '浏览器无法保存设置，本次会话仍会生效':'Settings could not be saved in this browser; they still apply to this session',
 '已屏蔽，请在目录中恢复后演示':'Hidden. Restore this slide in the overview to present it',

 '开场':'Opening','演示控制':'Presentation controls','上一页':'Previous slide','下一页':'Next slide',
 '上一页 · ← / Page Up':'Previous slide · ← / Page Up','下一页 · → / 空格':'Next slide · → / Space',
 '打开目录 · G':'Open overview · G','目录':'Overview','目录 · G':'Overview · G','全屏':'Fullscreen',
 '全屏 · F':'Fullscreen · F','退出全屏':'Exit fullscreen','演示章节':'Presentation chapters',
 '切换到英文':'Switch to English','演示目录':'Presentation overview','关闭目录':'Close overview',
 '点击页面直接跳转':'Click a slide to jump','Esc 关闭':'Esc to close',
 '自动演示':'Auto presentation','暂停':'Pause','继续':'Continue','重播':'Replay','完整示意':'Show all',
 '当前浏览器不支持网页全屏，可使用浏览器的全屏功能。':'Use your browser fullscreen mode.',
 '全屏未能开启，可使用浏览器的全屏功能。':'Use your browser fullscreen mode.'
}
def source(value):
 if isinstance(value,dict):
  if set(value)!= {'zh','en'} or not all(isinstance(value[k],str) for k in value): raise ValueError('Bilingual text requires {zh: string, en: string}')
  zh,en=value['zh'],value['en']
  if zh in translations and translations[zh]!=en:raise ValueError('Conflicting translation: '+zh)
  translations[zh]=en;return zh
 if not isinstance(value,str):raise ValueError('Text requires a string or zh/en object')
 return value

def text(value):return html.escape(source(value),quote=True)
def items(values,tag='span'):return ''.join(f'<{tag}>{text(v)}</{tag}>' for v in values)
def bounded(values,low,high,label):
 if not low<=len(values)<=high:raise ValueError(f'{label} must contain {low}–{high} items; split dense content into another slide')
 return values

def body(slide):
 kind=slide['type']
 if kind=='cards':
  cards=bounded(slide['cards'],2,4,'cards')
  return '<div class="kit-cards">'+''.join(f'<article class="kit-card"><span class="kit-index">{i+1:02}</span><h3>{text(c["title"])}</h3><p>{text(c["body"])}</p></article>' for i,c in enumerate(cards))+'</div>'
 if kind=='metrics':
  metrics=bounded(slide['metrics'],2,4,'metrics')
  return '<div class="kit-metrics">'+''.join(f'<article><b>{text(c["value"])}</b><h3>{text(c["label"])}</h3><p>{text(c.get("body",""))}</p></article>' for c in metrics)+'</div>'
 if kind=='architecture':
  layers=bounded(slide['layers'],3,5,'layers')
  return '<div class="kit-layers">'+''.join('<div class="kit-layer"><h3>'+text(c['label'])+'</h3><div>'+items(bounded(c['items'],1,4,'layer items'))+'</div></div>' for c in layers)+'</div>'
 if kind=='comparison':
  columns=bounded(slide['columns'],2,2,'comparison columns')
  return '<div class="kit-compare">'+''.join('<article><span class="kit-index">'+text(c.get('kicker',''))+'</span><h3>'+text(c['title'])+'</h3><p>'+text(c['summary'])+'</p><ul>'+items(bounded(c['bullets'],1,4,'comparison bullets'),'li')+'</ul></article>' for c in columns)+'</div>'
 if kind=='table':
  headers=bounded(slide['headers'],2,6,'table columns'); rows=bounded(slide['rows'],1,6,'table rows')
  for row in rows:
   if len(row)!=len(headers):raise ValueError('Every table row must match the header count')
  note=('<div class="kit-note">'+text(slide['note'])+'</div>') if slide.get('note') else ''
  return '<table class="kit-table"><thead><tr>'+items(headers,'th')+'</tr></thead><tbody>'+''.join('<tr>'+items(row,'td')+'</tr>' for row in rows)+'</tbody></table>'+note
 if kind=='workflow':
  steps=bounded(slide['steps'],3,5,'workflow steps')
  return '<div class="kit-toolbar"><span data-flow-status>自动演示</span><div><button data-flow-play>暂停</button><button data-flow-replay>重播</button><button data-flow-all>完整示意</button></div></div><div class="kit-flow">'+''.join(f'<article data-flow-step="{i}"><span class="kit-index">{i+1:02}</span><h3>{text(c["title"])}</h3><p>{text(c["body"])}</p></article>' for i,c in enumerate(steps))+'</div><div class="kit-note">'+text(slide.get('result',''))+'</div>'
 if kind=='image':
  path=slide['image']
  if not re.fullmatch(r'assets/[A-Za-z0-9_-]+\.(png|jpg|jpeg|svg|webp)',path):raise ValueError('Image must be a local assets/file.ext')
  if not (ROOT/path).is_file():raise ValueError('Missing image: '+path)
  return '<div class="kit-image"><img src="'+text(path)+'" alt="'+text(slide.get('alt',''))+'"><aside><h3>'+text(slide['caption'])+'</h3><p>'+text(slide.get('body',''))+'</p></aside></div>'
 if kind=='custom':
  # The agent owns these local HTML fragments. Keep input strings out of executable code.
  fragment=slide['fragment']
  if not re.fullmatch(r'content/[A-Za-z0-9_-]+\.html',fragment):raise ValueError('Custom fragment must be content/name.html')
  for zh,en in slide.get('translations',{}).items():source({'zh':zh,'en':en})
  return (ROOT/fragment).read_text(encoding='utf-8')
 raise ValueError('Unknown slide type: '+kind)

if not re.fullmatch(r'[a-z][a-z0-9-]{2,62}',D['id']):raise ValueError('id must be a unique lowercase project slug, 3–63 characters')
if not D.get('slides'):raise ValueError('At least one slide is required')

# Persist generated identities so a page remains the same after rename, reorder or insertion.
assigned_ids=False
seen_ids=set()
for slide in D['slides']:
 if 'id' not in slide:
  slide['id']='slide-'+uuid.uuid4().hex[:12];assigned_ids=True
 slide_id=slide['id']
 if not isinstance(slide_id,str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,62}',slide_id):raise ValueError('Slide id must be a stable lowercase slug')
 if slide_id in seen_ids:raise ValueError('Duplicate slide id: '+slide_id)
 seen_ids.add(slide_id)

chapters=[]
for c in D.get('chapters',[]):chapters.append({'label':source(c['label']),'section':source(c['section'])})
if len(chapters)>5:raise ValueError('Use at most five navigation chapters')
slides=[]
for i,s in enumerate(D['slides']):
 title=text(s['title']); section=text(s.get('section','开场')); n=f'{i+1:02}'
 header=f'<header class="slide-header"><img class="brand" src="assets/huawei-logo.png" alt="HUAWEI"><span>{text(D.get("brandLabel","HUAWEI CLOUD"))}</span></header>'
 if s['type']=='cover':
  backgrounds={'原山景':'assets/mountains.jpg','云山':'assets/yunshan.png','金沙':'assets/jinsha.png'}
  background=s.get('background','原山景')
  if background not in backgrounds:raise ValueError('Unknown cover background: '+background)
  image=backgrounds[background]
  content=header+f'<div class="cover-landscape" style="background-image:linear-gradient(180deg,#f7f9fc 0%,#f7f9fcbd 18%,#f7f9fc00 43%),url(&quot;{image}&quot;)"></div><div class="cover-copy"><div class="eyebrow"><span class="red-rule"></span>{text(s.get("eyebrow","PRODUCT BRIEFING"))}</div><h1>{title}</h1><p class="cover-subtitle">{text(s.get("subtitle",""))}</p><div class="cover-line"></div><p class="cover-english">{text(s.get("tagline","HUAWEI CLOUD"))}</p></div><div class="cover-bottom"><span>PRODUCT BRIEFING</span><span>{text(D.get("brandLabel","HUAWEI CLOUD"))}</span></div>'
  cls='cover'
 else:
  content=header+f'<div class="heading"><div class="eyebrow">{text(s.get("eyebrow","PRODUCT CAPABILITIES"))}</div><h2>{title}</h2><p>{text(s.get("subtitle",""))}</p></div><div class="kit-body">'+body(s)+'</div>'+f'<footer class="slide-footer"><span>{text(s.get("footer",D.get("footer","HUAWEI CLOUD")))}</span><span>{n}</span></footer>'
  cls='kit-slide'
 slides.append(f'<section class="slide {cls}{" active" if i==0 else ""}" data-slide-id="{text(s["id"])}" data-title="{title}" data-section="{section}" aria-label="第 {i+1} 页：{title}">{content}</section>')
# All source strings were registered before exporting translations.
config={'id':D['id'],'chapters':chapters}
(ROOT/'js/config.js').write_text('window.DeckConfig = '+json.dumps(config,ensure_ascii=False)+';\n',encoding='utf-8')
(ROOT/'js/translations.js').write_text('window.DeckEnglish = '+json.dumps(translations,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
shell=(ROOT/'content/shell.html').read_text(encoding='utf-8').replace('{{TITLE}}',text(D['title'])).replace('{{SLIDES}}','\n'.join(slides))
# Document title may itself be bilingual.
(ROOT/'js/translations.js').write_text('window.DeckEnglish = '+json.dumps(translations,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
(ROOT/'index.html').write_text(shell,encoding='utf-8')
if assigned_ids:(ROOT/'content/deck.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(slides)} slides for {D["id"]}')
