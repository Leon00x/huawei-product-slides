"""Audit distributable source for stale presentation facts and secret files."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
errors=[]
skip={'.git','node_modules','.wrangler','dist','qa','__pycache__'}
for path in root.rglob('*'):
    rel=path.relative_to(root)
    if not path.is_file() or set(rel.parts)&skip or rel.parts[0] in {'scripts','tests'}: continue
    if path.name.startswith(('.env','.dev.vars')): errors.append(str(rel)+': credential file')
    if path.suffix not in {'.js','.mjs','.html','.json','.css','.md','.svg'}: continue
    text=path.read_text()
    if re.search(r'ChatBI|DeepSeek|GLM-\d|chatbi-demo|MAAS_DATA|checkedAt|original-translations',text,re.I): errors.append(str(rel)+': previous product content')
    if re.search(r'\b(?:peak|offPeak|longInput)\s*:',text): errors.append(str(rel)+': previous pricing payload')
assert not errors, '\n'.join(errors)
print('Source audit passed: no previous product data or credential files')
