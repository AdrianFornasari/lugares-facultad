from playwright.sync_api import sync_playwright
from pathlib import Path
import json
r=Path('/mnt/data/fcm_v027')
css=(r/'shared/styles.css').read_text()
model=json.loads((r/'public/data/model.json').read_text())
scripts=[]
for f in ['engine.js','voice.js','app.js']:
 code=(r/'shared'/f).read_text()
 code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
 code=code.replace('export function ','function ').replace('export const ','const ')
 scripts.append(code)
js='\n'.join(scripts)+"\nmountApp(document.getElementById('root'),'./');"
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mobile in [True,False]:
  ctx=browser.new_context(viewport={'width':390 if mobile else 1300,'height':844 if mobile else 840},has_touch=mobile,is_mobile=mobile)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(f'<meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style><div id="root"></div>')
  page.evaluate('(m)=>{window.fetch=async()=>({ok:true,json:async()=>m})}',model)
  page.evaluate('()=>{'+js+'}')
  page.wait_for_selector('#search-from',state='attached')
  if mobile:
   assert page.locator('#search-to').is_visible()
   assert page.locator('#map-inner').is_hidden()
   page.screenshot(path=str(r/'CAPTURA_SMARTPHONE_v0_2_7.png'),full_page=True)
   page.locator('#search-to').click()
   page.locator('#public-search').fill('informatica')
   assert page.locator('.search-suggestion').count()==1
   assert 'A222' in page.locator('.search-suggestion').first.inner_text()
   page.screenshot(path=str(r/'CAPTURA_BUSQUEDA_SMARTPHONE_v0_2_7.png'),full_page=False)
   page.locator('.search-suggestion').first.click()
   assert 'Sala de Informática' in page.locator('#search-to').inner_text()
   page.locator('#step-toggle').click()
   assert page.locator('.guide-active').count()==1
   page.locator('#step-next').click()
   assert 'Paso 2 de' in page.locator('.guide-number').inner_text()
   page.screenshot(path=str(r/'CAPTURA_GUIA_SMARTPHONE_v0_2_7.png'),full_page=True)
   page.locator('#prev-route').click()
   assert 'Paso 1 de' in page.locator('.guide-number').inner_text()
   page.locator('#step-toggle').click()
   page.locator('#admin').click()
   assert page.locator('.editor').is_visible()
   assert page.locator('#map-inner').is_visible()
   print('Smartphone aislado: búsqueda, selección, guía, alternativa y editor correctos')
  else:
   assert page.locator('#from').is_visible()
   assert page.locator('#from option').count()==62
   assert page.locator('#search-from').is_hidden()
   page.screenshot(path=str(r/'CAPTURA_ESCRITORIO_v0_2_7.png'),full_page=True)
   print('Desktop aislado: 62 opciones y selectores originales')
  assert not errors,errors
  print('Errores JS:',errors)
  ctx.close()
 browser.close()
