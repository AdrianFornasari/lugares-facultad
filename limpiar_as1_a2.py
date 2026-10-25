"""Retirar texto As1 de la planta anterior A2 sin alterar tramos vectoriales."""
import fitz, io
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parent
p=fitz.open(R/'FUENTE_CAD'/'Plantas Facultad(1).pdf')
p[1].add_redact_annot(fitz.Rect(412.8,1347.9,437.2,1361.8),fill=False)
p[1].apply_redactions(images=0,graphics=0,text=0)
text=p[1].get_text()
print('A2 labels after redact',repr(text))
if 'S4' not in text:
 p[1].insert_text((415.1,1348.5),'S4',fontname='helv',fontsize=10.5,color=(0,0,0))
# source p2 one-page copy for audit
out=fitz.open();out.insert_pdf(p,from_page=1,to_page=1);out.save(R/'PLANO_A2_sin_AS1_v0_2_9.pdf',deflate=True,garbage=4)
clip=fitz.Rect(205,75,565,1480)
pm=p[1].get_pixmap(matrix=fitz.Matrix(2.4,2.4),clip=clip,alpha=False)
im=Image.open(io.BytesIO(pm.tobytes('png'))).convert('RGB').resize((864,3372),Image.Resampling.LANCZOS)
for x in (R/'public/plans/A2.png',R/'autonomo/plans/A2.png'):
 im.save(x)
assert 'As1' not in p[1].get_text()
print('A2 limpio sin As1',im.size)
