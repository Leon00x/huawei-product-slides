"""Rebuild generic previews in isolation; never modify a product deck."""
from pathlib import Path
import tempfile,subprocess,sys,shutil
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='slides-demo-') as temp:
    project=Path(temp)/'project'
    subprocess.run([sys.executable,str(root/'scripts/init.py'),str(project),'--id','product-slides-demo','--title','产品名称','--title-en','Product name','--starter','blank'],check=True)
    subprocess.run([sys.executable,str(project/'tools/build.py')],check=True)
    demo=root/'demo';demo.mkdir(exist_ok=True)
    shutil.copy2(project/'dist/offline/presentation.html',demo/'index.html')
    public=demo/'dist/public';public.mkdir(parents=True,exist_ok=True)
    shutil.copy2(demo/'index.html',public/'index.html')
    shutil.copy2(root/'assets/starters/thank-you.json',project/'content/deck.json')
    subprocess.run([sys.executable,str(project/'tools/render.py')],check=True)
    subprocess.run([sys.executable,str(project/'tools/build.py')],check=True)
    shutil.copy2(project/'dist/offline/presentation.html',demo/'thank-you.html')
    shutil.copy2(demo/'thank-you.html',public/'thank-you.html')
print('Demo ready: demo/index.html (cover + blank slide), demo/thank-you.html (closing preview)')
