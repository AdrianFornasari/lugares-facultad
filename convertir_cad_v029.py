#!/usr/bin/env python3
"""Migración verificable de geometría A1 hacia CAD vectorial, sin alterar topología."""
import json, math, os, shutil, hashlib
from pathlib import Path
import fitz

ROOT=Path(__file__).resolve().parent
SOURCE=Path('/mnt/data/Plantas Facultad A1 - CAD.pdf') if Path('/mnt/data/Plantas Facultad A1 - CAD.pdf').exists() else ROOT/'FUENTE_CAD'/'Plantas Facultad A1 - CAD.pdf'
MODEL=ROOT/'public'/'data'/'model.json'
DEST=ROOT/'PLANO_CAD_A1_etiquetado_v0_2_9.pdf'
CLEAN=ROOT/'PLANO_CAD_A1_limpio_v0_2_9.pdf'
DX,DY=218.4752,-63.7585
SCALE=172.2489/20.0

# Validación objetiva: las 50 polilíneas rojas deben ser idénticas salvo traslación.
def points_from(d):
 p=[]
 for it in d['items']:
  if it[0]=='l':
   a,b=it[1:3]
   if not p or (p[-1][0],p[-1][1])!=(a.x,a.y): p.append((a.x,a.y))
   p.append((b.x,b.y))
 return p

def strokes(pdf):
 p=fitz.open(pdf)[0]
 return [d for d in p.get_drawings() if (d.get('color') or (0,0,0))[0]>.7 and (d.get('color') or (0,0,0))[1]<.35 and (d.get('color') or (0,0,0))[2]<.35]

def validate_translation():
 old=strokes(ROOT/'FUENTE_CAD'/'Plantas Facultad(1).pdf')
 new=strokes(SOURCE)
 assert len(old)==len(new)==50,(len(old),len(new))
 dxs=[];dys=[]
 for a,b in zip(old,new):
  pa=points_from(a);pb=points_from(b)
  assert len(pa)==len(pb)
  for (ax,ay),(bx,by) in zip(pa,pb):dxs.append(bx-ax);dys.append(by-ay)
 dx=sum(dxs)/len(dxs);dy=sum(dys)/len(dys)
 err=max(math.hypot(x-dx,y-dy) for x,y in zip(dxs,dys))
 assert err<0.01,err
 print(f'Translación real CAD: dx={dx:.6f} dy={dy:.6f}; error máximo={err:.6f} pt')
 assert abs(dx-DX)<0.01 and abs(dy-DY)<0.01
 return dx,dy,err

def migrate(m,dx,dy):
 if m.get('cad_migration',{}).get('id')=='CAD_A1_2026_10_24':return m
 for n in m['floors']['A1']['nodes']:
  n['x_pdf_pt']=round(n['x_pdf_pt']+dx,4);n['y_pdf_pt']=round(n['y_pdf_pt']+dy,4)
  n['x_norm']=round(n['x_pdf_pt']/1190.551,6)
  n['y_norm']=round(n['y_pdf_pt']/1683.78,6)
 for l in m['floors']['A1']['landmarks']:
  for k in ('coordinate_pdf','target_pdf'):
   if k in l and len(l[k])==2:l[k]=[round(l[k][0]+dx,4),round(l[k][1]+dy,4)]
 for fl in ('A1','A2'):
  g=m['floors'][fl]
  g['landmarks']=[l for l in g['landmarks'] if l.get('label')!='AS1']
  for n in g['nodes']:n['labels']=[s for s in n.get('labels',[]) if s!='AS1']
 for floor,node in (('A1','A1-N093'),('A2','A2-N099')):
  n=next(n for n in m['floors'][floor]['nodes'] if n['id']==node)
  n['door_candidate_excluded']=True
  n['topology_note']='Antigua ubicación de AS1 inexistente; no candidato a puerta'
  for key in ('vertical_connector_id','functional_role','functional_topology_status','coordinate_status'):n.pop(key,None)
 m['vertical_connections']=[c for c in m['vertical_connections'] if c['id']!='AS1']
 uc=m['user_confirmations'];uc['AS1_inexistente']='confirmado_por_usuario_2026_10_24'
 for key in list(uc):
  if ('AS1' in key or key=='elevators_AS1_AS2_both_reach_A2') and key!='AS1_inexistente':uc.pop(key,None)
 uc['AS2_llega_A1_A2_y_abre_al_pasillo_sin_escalones']=True
 m['coordinate_system']['distance_calibrated_A1']=True
 m['coordinate_system']['A1_pdf_points_per_metre']=round(SCALE,6)
 m['coordinate_system']['A1_calibration_method']='barra_grafica_0_20_m_preserva_proporcion_confirmada_por_usuario; escala_nominal_1_500_no_valida'
 m['coordinate_system']['A2_distance_calibrated']=False
 m['source']['A1_pdf']='Plantas Facultad A1 - CAD.pdf'
 m['source']['A1_geometry']='CAD vectorial con trayectos rojos superpuestos sin transformación no rígida'
 m['source']['A1_red_alignment_translation_pdf_points']=[round(dx,6),round(dy,6)]
 m['source']['A1_sha256']=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
 m['excluded_features']=m.get('excluded_features',[])
 if not any(isinstance(f,str) and 'AS1' in f for f in m['excluded_features']):m['excluded_features'].append('AS1: no existe; excluido del enrutamiento y del plano')
 v=m.get('validation_summary',{})
 for key in ('verified_functional_vertical_connectors','unverified_geom_anchor_connectors'):
  if isinstance(v.get(key),list):v[key]=[x for x in v[key] if x!='AS1']
 if v.get('routes_experimental_count'):v['routes_experimental_count']=4
 v['public_navigation_approved']=False
 v['previous_test_results']='Históricos: recalcular tras retirada AS1'
 v.pop('tests_run',None);v.pop('tests_passed',None);v.pop('all_pass',None)
 routes=m.get('experimental_routes_v06')
 if isinstance(routes,dict):
  routes.pop('AS1',None)
  for route in routes.values():
   if isinstance(route,dict) and isinstance(route.get('legs'),dict) and isinstance(route['legs'].get('A1'),dict):
    oldleg=route['legs']['A1']
    if 'coordinates_pdf' in oldleg:
     oldleg['coordinates_pdf']=[[round(x+dx,4),round(y+dy,4)] for x,y in oldleg['coordinates_pdf']]
 m['prototype_version']='0.2.9';m['cad_migration']={'id':'CAD_A1_2026_10_24','dx':round(dx,6),'dy':round(dy,6),'pdf_scale_points_per_metre':round(SCALE,6),'metric_scope':'A1_only','notes':'El modelo usa barra gráfica; A2 conserva medidas sin escala.'}
 return m

def mark_rooms(m):
 p=fitz.open(SOURCE)
 pg=p[0]
 # Elimina solo TEXTO, sin tocar las líneas vectoriales del CAD.
 for bbox in ((524,1332,547,1347),(831,1387,839,1428)):
  pg.add_redact_annot(fitz.Rect(*bbox),fill=False)
 pg.apply_redactions(images=0,graphics=0,text=0)
 # Sustituye el rótulo nominal 1:500, inválido tras redimensionar en Corel.
 pg.insert_text((847,1393),'ESCALA GRAFICA',fontsize=8,color=(.12,.20,.34),rotate=90,overlay=True)
 p.save(CLEAN,deflate=True,garbage=4)
 # Compone etiquetas a partir del CATALOGO actual, con anclajes de puertas vigentes.
 g=m['floors']['A1'];nd={n['id']:n for n in g['nodes']}
 adj={x:[] for x in nd}
 for q in g['edges']:
  adj[q['from']].append(q['to']);adj[q['to']].append(q['from'])
 labels=[]
 for s in m['spaces_catalog']:
  if s['floor']!='A1' or not s.get('door_node_id'):continue
  code=s['code'];node=nd[s['door_node_id']]
  linked=adj[node['id']]
  neighbor=nd[linked[0]] if linked else None
  dx=node['x_pdf_pt']-neighbor['x_pdf_pt'] if neighbor else 15
  dy=node['y_pdf_pt']-neighbor['y_pdf_pt'] if neighbor else 0
  text=code if not code.startswith('WC-') else ('Baño H' if 'H-' in code else 'Baño M')
  if code=='A112': x,y=node['x_pdf_pt']-60,node['y_pdf_pt']-3
  elif code=='A123': x,y=node['x_pdf_pt']+44,node['y_pdf_pt']-2
  elif code=='A103':x,y=node['x_pdf_pt']+40,node['y_pdf_pt']-2
  elif code=='A139':x,y=node['x_pdf_pt']+25,node['y_pdf_pt']-3
  elif abs(dx)>abs(dy)*.6:
   x=node['x_pdf_pt']+ (23 if dx>0 else -26)
   y=node['y_pdf_pt']-1
  else:
   x=node['x_pdf_pt']+12
   y=node['y_pdf_pt']+(-12 if dy<0 else 12)
  tw=fitz.get_text_length(text,fontname='helv',fontsize=9)
  box=fitz.Rect(x-tw/2-2,y-7.6,x+tw/2+2,y+4.2)
  pg.draw_rect(box,color=(.85,.9,.96),fill=(1,1,1),fill_opacity=.86,width=.35,overlay=True)
  pg.insert_text((x-tw/2,y+1),text,fontname='helv',fontsize=9,color=(.04,.18,.40),overlay=True)
  labels.append((code,s['door_node_id'],round(x,2),round(y,2)))
 # Escaleras y accesos: etiquetas vinculadas a nodos cartográficos.
 for l in g['landmarks']:
  if l['label'] not in ('S1','S3','S4','AS2','E1','E2','E3','E4','E5'):continue
  n=nd[l['node_id']];code=l['label']
  x,y=n['x_pdf_pt'],n['y_pdf_pt']
  if code=='AS2': continue # ya presente como texto en CAD original
  font=7.5
  tw=fitz.get_text_length(code,fontname='hebo',fontsize=font)
  x+= -14 if code.startswith('E') else 8
  y+= -7
  box=fitz.Rect(x-tw/2-1,y-7,x+tw/2+1,y+3)
  pg.draw_rect(box,color=None,fill=(1,1,1),fill_opacity=.85,overlay=True)
  pg.insert_text((x-tw/2,y),code,fontname='hebo',fontsize=font,color=(.12,.32,.46),overlay=True)
 p.set_metadata({**p.metadata,'title':'FCM Planta Baja - CAD con codigos de recintos - version 0.2.9','subject':'Códigos tomados del catálogo de Navegador FCM; escala por barra grafica de 20 m'})
 p.save(DEST,deflate=True,garbage=4)
 print('PDF etiquetado',DEST,'etiquetas',len(labels))
 return labels

def images():
 pdf=fitz.open(CLEAN)
 box=fitz.Rect(205+DX,75+DY,565+DX,1480+DY)
 pm=pdf[0].get_pixmap(matrix=fitz.Matrix(2.4,2.4),clip=box,alpha=False)
 from PIL import Image
 import io
 im=Image.open(io.BytesIO(pm.tobytes('png'))).convert('RGB')
 im=im.resize((864,3372),Image.Resampling.LANCZOS)
 for to in (ROOT/'public'/'plans'/'A1.png',ROOT/'autonomo'/'plans'/'A1.png'):
  im.save(to)
 # Captura para ver etiquetas en PDF completo
 pm=fitz.open(DEST)[0].get_pixmap(matrix=fitz.Matrix(1.3,1.3),alpha=False)
 pm.save(ROOT/'PREVIA_CAD_ETIQUETADO.png')

if __name__=='__main__':
 dx,dy,err=validate_translation()
 for path in (ROOT/'public'/'data'/'model.json',ROOT/'autonomo'/'data'/'model.json'):
  m=json.loads(path.read_text(encoding='utf-8'))
  m=migrate(m,dx,dy)
  path.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
 labels=mark_rooms(m)
 assert len(labels)==28,len(labels)
 images()
 (ROOT/'MIGRACION_CAD_A1_v0_2_9.json').write_text(json.dumps({'dx':dx,'dy':dy,'max_alignment_error_pt':err,'points_per_metre':SCALE,'labels':labels},ensure_ascii=False,indent=2),encoding='utf-8')
