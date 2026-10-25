from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time,signal
from urllib.parse import urlparse
import mimetypes
root=Path('/mnt/data/fcm_v027')
server=subprocess.Popen(['python','-m','http.server','8769','--bind','127.0.0.1','--directory',str(root/'autonomo')],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
 time.sleep(1)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  def serve(route):
   url=urlparse(route.request.url)
   rel=url.path.lstrip('/') or 'index.html'
   candidate=(root/'autonomo'/rel).resolve()
   if not candidate.is_file() or not candidate.is_relative_to((root/'autonomo').resolve()):
    route.fulfill(status=404,body='Not found');return
   typ=mimetypes.guess_type(str(candidate))[0] or 'application/octet-stream'
   route.fulfill(status=200,body=candidate.read_bytes(),content_type=typ)
  mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  page=mobile.new_page()
  page.route('https://fcm.invalid/**',serve)
  errs=[]
  page.on('pageerror',lambda err:errs.append(str(err)))
  page.goto('https://fcm.invalid/',wait_until='domcontentloaded',timeout=15000)
  page.wait_for_selector('#search-from',timeout=10000)
  page.screenshot(path=str(root/'CAPTURA_SMARTPHONE_v0_2_7.png'),full_page=True)
  assert page.get_by_text('Prototipo v0.2.7').count()>0
  assert page.locator('#map-inner').is_hidden(), 'Plano debe iniciar plegado'
  page.locator('#search-to').click()
  page.wait_for_selector('#public-search')
  page.locator('#public-search').fill('informatica')
  assert page.locator('.search-suggestion').count()==1, 'Busqueda acentos'
  assert 'A222' in page.locator('.search-suggestion').first.inner_text()
  page.screenshot(path=str(root/'CAPTURA_BUSQUEDA_SMARTPHONE_v0_2_7.png'),full_page=False)
  page.locator('.search-suggestion').first.click()
  assert page.locator('#public-search').count()==0
  assert 'Sala de Informática' in page.locator('#search-to').inner_text()
  assert page.locator('.instr li').count()>1
  page.locator('#step-toggle').click()
  assert page.locator('#step-next').count()==1
  assert page.locator('.guide-active').count()==1
  assert 'Paso 1 de' in page.locator('.guide-number').inner_text()
  page.locator('#step-next').click()
  assert 'Paso 2 de' in page.locator('.guide-number').inner_text()
  page.screenshot(path=str(root/'CAPTURA_GUIA_SMARTPHONE_v0_2_7.png'),full_page=True)
  page.locator('#prev-route').click()
  assert 'Paso 1 de' in page.locator('.guide-number').inner_text()
  page.locator('#step-toggle').click()
  assert page.locator('.guide-bar').count()==0
  page.locator('#admin').click()
  assert page.locator('.editor').count()==1
  assert page.locator('#map-inner').is_visible()
  assert not errs,errs
  print('Móvil (390x844): búsqueda sin tildes, selección, mapa plegado, guía por pasos, cambio de alternativa, administrador OK')
  print('Errores JS:',errs)
  desk=browser.new_context(viewport={'width':1300,'height':840})
  dp=desk.new_page();dp.route('https://fcm.invalid/**',serve);dp.goto('https://fcm.invalid/',wait_until='domcontentloaded',timeout=15000);dp.wait_for_selector('#from')
  assert dp.locator('#from').is_visible()
  assert not dp.locator('#search-from').is_visible()
  assert dp.locator('#from option').count()==62
  dp.screenshot(path=str(root/'CAPTURA_ESCRITORIO_v0_2_7.png'),full_page=True)
  print('Desktop: 62 opciones nativas y formato anterior OK')
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
