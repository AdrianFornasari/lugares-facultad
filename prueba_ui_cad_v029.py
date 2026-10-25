from pathlib import Path
import base64,json
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parent
css=(base/'shared/styles.css').read_text()
model=json.loads((base/'public/data/model.json').read_text())
scripts=[]
for fname in ('engine.js','voice.js','app.js'):
 code=(base/'shared'/fname).read_text()
 code='\n'.join(x for x in code.splitlines() if not x.startswith('import '))
 code=code.replace('export function ','function ').replace('export const ','const ')
 scripts.append(code)
js='\n'.join(scripts)+'\nmountApp(document.getElementById("root"),"./");'
img='data:image/png;base64,'+base64.b64encode((base/'autonomo/plans/A1.png').read_bytes()).decode()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mobile in (True,False):
  ctx=browser.new_context(viewport={'width':390 if mobile else 1300,'height':844 if mobile else 880},has_touch=mobile,is_mobile=mobile)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(f'<meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style><div id="root"></div>')
  page.evaluate('(m)=>{window.fetch=async()=>({ok:true,json:async()=>m})}',model)
  page.evaluate('()=>{'+js+'}')
  page.wait_for_selector('#from option',state='attached')
  assert page.locator('#from option').count()==62
  assert page.locator('#map-inner').is_hidden() if mobile else True
  page.locator('#toggle-map').click() if mobile else None
  # The full-sheet image is embedded only in this isolated visual test.
  page.evaluate('(data)=>{document.querySelector("#map image").setAttribute("href",data)}',img)
  assert page.locator('.room-code').count()==28
  assert 'AS1' not in page.locator('#map').text_content()
  if mobile:
   page.screenshot(path=str(base/'CAPTURA_MOVIL_CAD_A1_v0_2_9.png'),full_page=True)
   page.locator('#admin').click()
   page.evaluate('(data)=>{document.querySelector("#map image").setAttribute("href",data)}',img)
   assert page.locator('.node').count()==101
   assert page.locator('.room-code').count()==28
   page.screenshot(path=str(base/'CAPTURA_MOVIL_ADMIN_CAD_A1_v0_2_9.png'),full_page=True)
  else:page.screenshot(path=str(base/'CAPTURA_DESKTOP_CAD_A1_v0_2_9.png'),full_page=True)
  assert not errors,errors
  print(('Mobile' if mobile else 'Desktop'),'OK; 62 destinos, 28 etiquetas, 0 errores JavaScript')
  ctx.close()
 browser.close()
