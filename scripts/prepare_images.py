"""生成原本から配信用画像をリサイズ・書き出し（実行には Pillow が必要）。"""
from pathlib import Path
from PIL import Image, ImageOps
import json, shutil, zipfile
ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'assets/img'
ORIGINALS = IMG / 'generated-originals'
manifest = json.loads((ORIGINALS / 'manifest.json').read_text())
for item in manifest:
    dest = ORIGINALS / (item['key'] + '.png')
    if not dest.exists():
        shutil.copy2(item['source'], dest)
variants = {
 'hero_1920x1080': ('warehouse',1920,1080),
 'hero_sp_750x1334': ('warehouse',750,1334),
 'about_01_800x1000': ('staff',800,1000),
 'about_02_800x600': ('countryside',800,600),
 'service_keep_1200x800': ('warehouse',1200,800),
 'service_manage_1200x800': ('operations',1200,800),
 'service_connect_1200x800': ('transport',1200,800),
 'page_company_1920x800': ('countryside',1920,800),
 'page_service_1920x800': ('operations',1920,800),
 'base_hiruzen_1280x720': ('countryside',1280,720),
 'base_okayama_1280x720': ('urban',1280,720),
}
for name,(key,w,h) in variants.items():
    im=ImageOps.fit(Image.open(ORIGINALS/(key+'.png')).convert('RGB'),(w,h),method=Image.Resampling.LANCZOS)
    im.save(IMG/(name+'.webp'),quality=82,method=6)
    im.save(IMG/(name+'.jpg'),quality=86,optimize=True,progressive=True)
# OGP: 写真の1200×630配信用画像
ImageOps.fit(Image.open(ORIGINALS/'warehouse.png').convert('RGB'),(1200,630),method=Image.Resampling.LANCZOS).save(ROOT/'ogp.jpg',quality=88,optimize=True)
with zipfile.ZipFile(ROOT/'output/MSL_generated_images.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in ORIGINALS.iterdir():
        if p.is_file(): z.write(p,'originals/'+p.name)
    for name in variants:
        for ext in ['.webp','.jpg']: z.write(IMG/(name+ext),'web/'+name+ext)
print('6 originals, 22 optimized images, OGP, ZIP prepared')
