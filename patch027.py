from pathlib import Path
p=Path('/mnt/data/fcm_v027/shared/engine.js')
s=p.read_text()
mark='export function unassignedSpaces(m,floor)'
addon='''/** Búsqueda pública sin conexión por código o nombre; tolera tildes y espacios.
 * Solo devuelve espacios con una puerta vinculada a un nodo de su planta. */
export const searchKey = text => String(text??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('es').trim().replace(/\\s+/g,' ');
export function searchDestinations(m,query='',limit=15){
 const q=searchKey(query);
 const candidates=selectableSpaces(m).filter(s=>!q||searchKey(`${s.code} ${s.name}`).includes(q));
 candidates.sort((a,b)=>{
  const score=s=>searchKey(s.code)===q?0:searchKey(s.code).startsWith(q)?1:searchKey(s.name).startsWith(q)?2:3;
  return score(a)-score(b)||String(a.name||a.code).localeCompare(String(b.name||b.code),'es',{numeric:true});
 });
 return {total:candidates.length,items:candidates.slice(0,Math.max(0,limit))};
}
'''
assert mark in s
s=s.replace(mark,addon+mark)
p.write_text(s)
p=Path('/mnt/data/fcm_v027/shared/app.js');s=p.read_text()
s=s.replace('migrateCatalogV02,selectableSpaces,pendingDoorNodes','migrateCatalogV02,selectableSpaces,searchDestinations,pendingDoorNodes')
s=s.replace("const K='fcm-prototipo-026-ediciones'", "const K='fcm-prototipo-026-ediciones'") # preserve saved edits for same origin: do not silently change key
s=s.replace("let candidate='',assistantDismissed=false,undoLast=null;", "let candidate='',assistantDismissed=false,undoLast=null;\n let searchTarget='',searchQuery='',stepMode=false,stepIndex=0;")
s=s.replace(" const routeKey=()=>[from,to,chosen].join('|');", " const routeKey=()=>[from,to,chosen].join('|');\n function resetSteps(){stepIndex=0;}")
s=s.replace(" const refresh=()=>{stopVoice();store();recalc();render()};", " const refresh=()=>{stopVoice();store();recalc();resetSteps();render()};")
s=s.replace(" function mapView(){", ''' function publicSearchView(){if(!searchTarget)return '';
  return `<div class="search-overlay" id="search-overlay"><section class="search-sheet" role="dialog" aria-modal="true" aria-label="Buscar ${searchTarget==='from'?'origen':'destino'}"><div class="search-sheet-head"><strong>${searchTarget==='from'?'Elegí el origen':'Elegí el destino'}</strong><button id="close-search" type="button" aria-label="Cerrar búsqueda">✕</button></div><label class="search-input-wrap" for="public-search"><span aria-hidden="true">⌕</span><input id="public-search" type="search" autocomplete="off" spellcheck="false" placeholder="Buscar por código o dependencia" value="${e(searchQuery)}" aria-controls="search-suggestions" /></label><div id="search-suggestions" class="search-suggestions" role="group" aria-label="Resultados de búsqueda"></div><p class="search-help">Solo espacios con puerta vinculada · El cálculo sigue siendo experimental.</p></section></div>`;
 }
 function paintPublicSearch(){
  const suggestions=el('search-suggestions');if(!suggestions)return;
  const {total,items}=searchDestinations(model,searchQuery,12);
  suggestions.innerHTML=items.map(s=>`<button type="button" class="search-suggestion" data-choose-space="${e(s.code)}"><span class="search-suggestion-code">${e(s.code_type==='interno_sin_codigo_senaletico'?'':s.code)}</span><span class="search-suggestion-text">${e(s.name||s.code)}</span><span class="search-suggestion-floor">${e(s.floor)}</span></button>`).join('')||'<div class="search-none">No hay coincidencias entre los espacios con puerta vinculada.</div>';
  if(total>items.length)suggestions.insertAdjacentHTML('beforeend',`<p class="search-more">${total-items.length} resultados más. Escribí parte del nombre o código.</p>`);
 }
 function mapView(){''')
s=s.replace("function render(){if(!alive||!model)return;recalc();", "function render(){if(!alive||!model)return;recalc();")
s=s.replace(' const opt=routes[index];', ''' const opt=routes[index];
 const instructions=r?narrative(model,r,from,to):[];
 stepIndex=Math.max(0,Math.min(stepIndex,Math.max(0,instructions.length-1)));
 const compactChoice=code=>{const s=spaceOf(model,code);return s?`${s.code_type==='interno_sin_codigo_senaletico'?'':s.code+' · '}${s.name||s.code}`:'Elegir lugar'};''')
s=s.replace('Prototipo v0.2.6 · Bloque A · A1 y A2', 'Prototipo v0.2.7 · Bloque A · A1 y A2')
s=s.replace('''${selection('from',from)}</div><div class="item"><label for="to">Destino</label>${selection('to',to)}</div>''', '''${selection('from',from)}<button id="search-from" class="public-select" type="button" aria-label="Buscar origen"><span>${e(compactChoice(from))}</span><span aria-hidden="true">⌕</span></button></div><div class="item"><label for="to">Destino</label>${selection('to',to)}<button id="search-to" class="public-select" type="button" aria-label="Buscar destino"><span>${e(compactChoice(to))}</span><span aria-hidden="true">⌕</span></button></div>''')
old='''${r?`<ol>${narrative(model,r,from,to).map(x=>`<li>${e(x)}</li>`).join('')}</ol>`:'<p class="small">Elegí espacios con puertas vinculadas.</p>'}</section></aside>'''
new='''${r?`${stepMode?`<div class="guide-bar" aria-label="Guía manual"><button class="guide-arrow" id="step-prev" aria-label="Paso anterior" ${stepIndex===0?'disabled':''}>‹</button><span class="guide-number" aria-live="polite">Paso ${stepIndex+1} de ${instructions.length}</span><button class="guide-arrow" id="step-next" aria-label="Paso siguiente" ${stepIndex>=instructions.length-1?'disabled':''}>›</button><button class="guide-speak" id="step-say" title="Escuchar solo este paso" aria-label="Escuchar solo este paso">🔊</button></div>`:''}<ol>${instructions.map((x,i)=>`<li ${stepMode&&i===stepIndex?'class="guide-active" aria-current="step"':''}>${e(x)}</li>`).join('')}</ol><button type="button" class="guide-toggle" id="step-toggle" aria-pressed="${stepMode}">${stepMode?'✕ Salir de guía por pasos':'▶ Seguir indicaciones por pasos'}</button>`:'<p class="small">Elegí espacios con puertas vinculadas.</p>'}</section></aside>'''
assert old in s
s=s.replace(old,new)
s=s.replace('Restaurar base JSON integrada (v0.2.6)', 'Restaurar base JSON integrada (v0.2.7)')
s=s.replace('Prototipo v0.2.6 · Datos locales', 'Prototipo v0.2.7 · Datos locales')
s=s.replace('''${alert?`<div class="notify" role="status">${e(alert)} <button id="dismiss">×</button></div>`:''}`;''', '''${alert?`<div class="notify" role="status">${e(alert)} <button id="dismiss">×</button></div>`:''}${publicSearchView()}`;''')
s=s.replace('bind();syncVoiceButtons();paintDoorSearch();}', 'bind();syncVoiceButtons();paintDoorSearch();paintPublicSearch();if(searchTarget)el(\'public-search\')?.focus();}')
s=s.replace(''' click('toggle-prefs',()=>''',''' function routeChanged(){resetSteps();stopVoice();}
 click('search-from',()=>{searchTarget='from';searchQuery='';render()});
 click('search-to',()=>{searchTarget='to';searchQuery='';render()});
 click('close-search',()=>{searchTarget='';searchQuery='';render()});
 click('search-overlay',ev=>{if(ev.target===el('search-overlay')){searchTarget='';searchQuery='';render();}});
 on('public-search','input',ev=>{searchQuery=ev.target.value;paintPublicSearch()});
 on('public-search','keydown',ev=>{if(ev.key==='Escape'){searchTarget='';searchQuery='';render();}if(ev.key==='Enter'){const first=el('search-suggestions')?.querySelector('[data-choose-space]');if(first){ev.preventDefault();first.click();}}});
 el('search-suggestions')?.addEventListener('click',ev=>{const hit=ev.target.closest('[data-choose-space]');if(!hit)return;const code=hit.dataset.chooseSpace;if(!selectableSpaces(model).some(s=>s.code===code))return;
  if(searchTarget==='from'){from=code;floor=spaceOf(model,from)?.floor||'A1';}else if(searchTarget==='to'){to=code;}chosen='';routeChanged();centerNext=true;searchTarget='';searchQuery='';render();
 });
 click('step-toggle',()=>{stepMode=!stepMode;resetSteps();stopVoice();render()});
 click('step-prev',()=>{if(stepIndex>0){stepIndex--;stopVoice();render()}});
 click('step-next',()=>{if(stepIndex<narrative(model,getRoute(),from,to).length-1){stepIndex++;stopVoice();render()}});
 click('step-say',()=>{if(!runnable())return;const text=narrative(model,getRoute(),from,to)[stepIndex];if(!text)return;speakingRoute=routeKey();if(!voice.play(text))info('No se pudo leer el paso seleccionado.');});
 click('toggle-prefs',()=>''')
for frag in [
"chosen=routes[(pos-1+routes.length)%routes.length].id;centerNext=true;render()",
"chosen=routes[(pos+1)%routes.length].id;centerNext=true;render()",
"chosen='';centerNext=true;render()",
"chosen='';render()"]:
 if frag.startswith('chosen=routes'):
  s=s.replace(frag,frag.replace('centerNext=true;', 'routeChanged();centerNext=true;'))
 else:
  s=s.replace(frag, frag.replace('chosen=\'\';',"chosen='';routeChanged();"))
s=s.replace("chosen='';centerNext=true;render()});click('admin'", "chosen='';routeChanged();centerNext=true;render()});click('admin'")
# route buttons on desktop
s=s.replace("chosen=x.dataset.route;centerNext=true;render()", "chosen=x.dataset.route;routeChanged();centerNext=true;render()")
# navigation and route changed must stop reading if current route changed; it already does in render; step manual reset routeChanged explicit.
p.write_text(s)
print('Done', len(s))
