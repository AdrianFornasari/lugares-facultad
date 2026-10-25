import {calculate,narrative,nodeOf,spaceOf,distance,validate,migrateCatalogV02,selectableSpaces,searchDestinations,pendingDoorNodes,unassignedSpaces,doorProgress,assignDoorAssisted,unlinkDoorAssisted,undoDoorAction,migrateCadV029} from './engine.js?v=0.2.9';
import {createVoiceController} from './voice.js';
// Nueva clave: el JSON recibido es la base vigente; evita que datos antiguos en localStorage la reemplacen.
const K='fcm-cad-029-ediciones';let R={x:205,y:75,w:360,h:1405};
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const numeric=n=>+n.toFixed(2);
const download=(name,text)=>{const u=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)};
export function mountApp(host,base='./'){
 let model=null,original=null,showPendingOnly=false,floor='A1',from='A117',to='A218',mode='simple',accessible=false,chosen='S3',admin=false,showGraph=false,zoom=1,mapExpanded=false,mapBeforeAdmin=false,prefsExpanded=false,tool='pick',selectedNode=null,selectedEdge=null,connectStart=null,alert='',routes=[];
 let alive=true,centerNext=true;
 let candidate='',assistantDismissed=false,undoLast=null;
 let searchTarget='',searchQuery='',stepMode=false,stepIndex=0;
 let speakingRoute='';
 const voice=createVoiceController({
  synth:window.speechSynthesis,
  Utterance:window.SpeechSynthesisUtterance,
  onChange:()=>syncVoiceButtons()
 });
 const routeKey=()=>[from,to,chosen].join('|');
 function resetSteps(){stepIndex=0;}
 function stopVoice(){speakingRoute='';voice.stop();}
 function syncVoiceButtons(){
  const pause=el('pause'),stop=el('stop');
  if(pause){
   const paused=voice.state==='paused',running=voice.state!=='idle';
   pause.disabled=!running;
   pause.setAttribute('aria-label',paused?'Reanudar lectura':'Pausar lectura');
   pause.title=paused?'Reanudar lectura':'Pausar lectura';
   pause.setAttribute('aria-pressed',String(paused));
   pause.innerHTML=paused?'<span class="mobile-only" aria-hidden="true">▶</span><span class="desktop-only">▶ Reanudar</span>':'<span class="mobile-only" aria-hidden="true">⏸</span><span class="desktop-only">⏸ Pausar</span>';
  }
  if(stop)stop.disabled=voice.state==='idle';
 }
 const store=()=>{try{localStorage.setItem(K,JSON.stringify(model))}catch{alert='No se pudo guardar. Exportá un respaldo JSON.'}};
 const getRoute=()=>routes.find(r=>r.id===chosen)||null;
 function repairSelections(){
  const available=selectableSpaces(model);
  const codes=new Set(available.map(s=>s.code));
  if(!codes.has(from))from=available[0]?.code||'';
  if(!codes.has(to))to=available.find(s=>s.code!==from)?.code||from;
 }
 const recalc=()=>{repairSelections();routes=calculate(model,from,to,mode,accessible);if(!routes.some(x=>x.id===chosen))chosen=routes[0]?.id||''};
 const refresh=()=>{stopVoice();store();recalc();resetSteps();render()};
 const el=id=>host.querySelector('#'+id);
 const info=t=>{alert=t;render()};
 const byValue=(id,fn)=>{el(id)?.addEventListener('change',ev=>fn(ev.target.value,ev.target))};
 const doClick=(id,fn)=>el(id)?.addEventListener('click',fn);
 async function load(){try{const res=await fetch(base+'data/model.json');if(!res.ok)throw Error('No se encontró el modelo: '+res.status);const read=await res.json();migrateCatalogV02(read);migrateCadV029(read);const fail=validate(read);if(fail.length)throw Error(fail.join('; '));original=structuredClone(read);model=structuredClone(read);try{const saved=localStorage.getItem(K);if(saved){const val=JSON.parse(saved);migrateCatalogV02(val);migrateCadV029(val);if(!validate(val).length)model=val;}}catch{}if(!alive)return;recalc();render();}catch(err){if(alive)host.innerHTML=`<div class="error"><h2>Error al cargar el modelo</h2><p>${e(err.message)}</p><p>Para la versión autónoma iniciá un servidor local, no abras el HTML con doble clic.</p></div>`;}}
 function selection(id,val){
  const items=selectableSpaces(model).slice().sort((a,b)=>String(a.name||a.code).localeCompare(String(b.name||b.code),'es'));
  if(!items.length)return `<select id="${id}" disabled aria-label="${id==='from'?'Origen':'Destino'} sin puertas asignadas"><option value="">No hay destinos con puerta</option></select>`;
  return `<select id="${id}">${items.map(s=>`<option value="${e(s.code)}" ${s.code===val?'selected':''}>${e(s.name||s.code)} · ${s.code_type==='interno_sin_codigo_senaletico'?'sin código':e(s.code)}</option>`).join('')}</select>`;
 }
 function publicSearchView(){if(!searchTarget)return '';
  return `<div class="search-overlay" id="search-overlay"><section class="search-sheet" role="dialog" aria-modal="true" aria-label="Buscar ${searchTarget==='from'?'origen':'destino'}"><div class="search-sheet-head"><strong>${searchTarget==='from'?'Elegí el origen':'Elegí el destino'}</strong><button id="close-search" type="button" aria-label="Cerrar búsqueda">✕</button></div><label class="search-input-wrap" for="public-search"><span aria-hidden="true">⌕</span><input id="public-search" type="search" autocomplete="off" spellcheck="false" placeholder="Buscar por código o dependencia" value="${e(searchQuery)}" aria-controls="search-suggestions" /></label><div id="search-suggestions" class="search-suggestions" role="group" aria-label="Resultados de búsqueda"></div><p class="search-help">Solo espacios con puerta vinculada · El cálculo sigue siendo experimental.</p></section></div>`;
 }
 function paintPublicSearch(){
  const suggestions=el('search-suggestions');if(!suggestions)return;
  const {total,items}=searchDestinations(model,searchQuery,12);
  suggestions.innerHTML=items.map(s=>`<button type="button" class="search-suggestion" data-choose-space="${e(s.code)}"><span class="search-suggestion-code">${e(s.code_type==='interno_sin_codigo_senaletico'?'':s.code)}</span><span class="search-suggestion-text">${e(s.name||s.code)}</span><span class="search-suggestion-floor">${e(s.floor)}</span></button>`).join('')||'<div class="search-none">No hay coincidencias entre los espacios con puerta vinculada.</div>';
  if(total>items.length)suggestions.insertAdjacentHTML('beforeend',`<p class="search-more">${total-items.length} resultados más. Escribí parte del nombre o código.</p>`);
 }
 function mapView(){R=floor==='A1'?{x:423.475211,y:11.241461,w:360,h:1405}:{x:205,y:75,w:360,h:1405};const graph=model.floors[floor];const leg=getRoute()?.legs.find(l=>l.floor===floor);const nodeIndex=new Map(graph.nodes.map(n=>[n.id,n]));const graphOn=admin||showGraph;
 const lines=graphOn?graph.edges.map(q=>{const a=nodeIndex.get(q.from),b=nodeIndex.get(q.to);if(!a||!b)return '';return `<line data-edge="${q.id}" class="edge" x1="${a.x_pdf_pt}" y1="${a.y_pdf_pt}" x2="${b.x_pdf_pt}" y2="${b.y_pdf_pt}" stroke="${q.id===selectedEdge?'#e27720':q.route_enabled===false?'#b84349':q.segment_type==='stair_flight'?'#8d50ac':'#3f78bc'}" stroke-width="${q.id===selectedEdge?4:2}" stroke-dasharray="${q.route_enabled===false?'3 3':''}"/>`}).join(''):'';
 const path=leg?`<polyline class="trace" points="${leg.nodes.map(id=>nodeIndex.get(id)).filter(Boolean).map(n=>`${n.x_pdf_pt},${n.y_pdf_pt}`).join(' ')}"/>`:'';
 const pending=new Set(pendingDoorNodes(model,floor));
 const assigned=new Set(model.spaces_catalog.filter(s=>s.floor===floor&&s.door_node_id).map(s=>s.door_node_id));
 const nodes=graphOn?graph.nodes.filter(n=>!showPendingOnly||pending.has(n.id)||assigned.has(n.id)||n.id===selectedNode).map(n=>{
  const isPending=admin&&pending.has(n.id),isDoor=assigned.has(n.id),active=n.id===selectedNode;
  const color=active?'#f59e38':isPending?'#f3ce20':isDoor?'#14835a':'#1d5a9b';
  const cls='node '+(active?'node-active ':'')+(isPending?'node-pending-door':'');
  return `${active?`<circle class="node-halo" cx="${n.x_pdf_pt}" cy="${n.y_pdf_pt}" r="12"/>`:''}<circle class="${cls}" data-node="${n.id}" data-pending-door="${isPending}" cx="${n.x_pdf_pt}" cy="${n.y_pdf_pt}" r="${active?6.5:isPending?5.5:4}" fill="${color}" stroke="${isPending?'#6d4f00':'white'}" stroke-width="${isPending?1.6:1}"/><circle class="node-hit" data-node="${n.id}" cx="${n.x_pdf_pt}" cy="${n.y_pdf_pt}" r="9" fill="transparent" />`;
 }).join(''):'';
 const marks=graph.landmarks.filter(x=>['A117','A218','S1','S3','S4','AS2','E1','E2','E3','E4','E5'].includes(x.label)).map(x=>{const n=nodeIndex.get(x.node_id);if(!n)return '';return `<g pointer-events="none"><circle cx="${n.x_pdf_pt}" cy="${n.y_pdf_pt}" r="5.5" fill="${x.label.startsWith('AS')?'#0d8fb4':'#e2a532'}" stroke="white" stroke-width="1.5"/><text class="maplabel" x="${n.x_pdf_pt+8}" y="${n.y_pdf_pt-6}">${e(x.label)}</text></g>`}).join('');
 // Códigos superpuestos al CAD desde el catálogo actual: siguen la edición del administrador.
 const roomCodes=floor==='A1'?model.spaces_catalog.filter(sp=>sp.floor==='A1'&&sp.door_node_id).map(sp=>{
  const n=nodeIndex.get(sp.door_node_id);if(!n)return '';
  const edge=graph.edges.find(q=>q.from===n.id||q.to===n.id);
  const other=edge?nodeIndex.get(edge.from===n.id?edge.to:edge.from):null;
  const dx=other?n.x_pdf_pt-other.x_pdf_pt:10,dy=other?n.y_pdf_pt-other.y_pdf_pt:0;
  let x,y;
  if(sp.code==='A112'){x=n.x_pdf_pt-60;y=n.y_pdf_pt-3;}
  else if(sp.code==='A123'){x=n.x_pdf_pt+44;y=n.y_pdf_pt-2;}
  else if(sp.code==='A103'){x=n.x_pdf_pt+40;y=n.y_pdf_pt-2;}
  else if(sp.code==='A139'){x=n.x_pdf_pt+25;y=n.y_pdf_pt-3;}
  else if(Math.abs(dx)>Math.abs(dy)*.6){x=n.x_pdf_pt+(dx>0?23:-26);y=n.y_pdf_pt-1;}
  else{x=n.x_pdf_pt+12;y=n.y_pdf_pt+(dy<0?-12:12);}
  const name=sp.code.startsWith('WC-')?(sp.code==='WC-H-PB'?'Baño H':'Baño M'):sp.code;
  return `<text class="room-code" x="${x}" y="${y+1}" text-anchor="middle">${e(name)}</text>`;
 }).join(''):'';
 const endpoints=[from,to].map((code,i)=>{const s=spaceOf(model,code),n=s?.floor===floor&&s.door_node_id?nodeIndex.get(s.door_node_id):null;return n?`<g pointer-events="none"><circle cx="${n.x_pdf_pt}" cy="${n.y_pdf_pt}" r="8" fill="${i===0?'#0fa86f':'#be3756'}" stroke="white" stroke-width="2"/><text class="maplabel" x="${n.x_pdf_pt+11}" y="${n.y_pdf_pt}">${floor==='A1'?'':code}</text></g>`:''}).join('');
 return `<div id="stage" class="stage ${admin?'admin-stage':''}" aria-label="Plano interactivo de ${floor}"><svg id="map" width="${Math.round(405*zoom)}" viewBox="${R.x} ${R.y} ${R.w} ${R.h}" xmlns="http://www.w3.org/2000/svg"><image href="${base}plans/${floor}.png" x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}"/>${lines}${path}${nodes}${marks}${roomCodes}${endpoints}</svg></div>`;
 }
 function doorAssistantView(){
  if(!admin||!selectedNode||assistantDismissed)return '';
  const n=nodeOf(model,selectedNode);
  if(!n||!selectedNode.startsWith(floor+'-'))return '';
  const existing=model.spaces_catalog.filter(s=>s.door_node_id===selectedNode);
  const candidates=pendingDoorNodes(model,floor),canAssign=candidates.includes(selectedNode)&&!existing.length;
  const graph=model.floors[floor],nodeDegree=graph.edges.filter(z=>z.from===selectedNode||z.to===selectedNode).length;
  return `<section class="door-assistant" aria-label="Asignación asistida de puertas">
   <div class="assist-head"><div><strong>Asignación asistida</strong><span> ${e(selectedNode)} · ${floor}</span></div><button type="button" class="assist-close" id="close-assistant" aria-label="Cerrar asistente de este nodo">×</button></div>
   ${existing.length?`<div class="assist-linked">Vinculada: ${existing.map(s=>`<div class="linked-door"><span><strong>${e(s.code)}</strong> · ${e(s.name||'Sin denominación')}</span><button type="button" class="btn d" data-unlink="${e(s.code)}">Desvincular</button></div>`).join('')}</div>`:''}
   ${canAssign?`<label for="door-search">Buscar dependencia sin puerta</label>
     <input id="door-search" class="assist-search" type="search" autocomplete="off" placeholder="Código o nombre (ej. A126)" aria-controls="door-result" />
     <div id="door-result" class="door-results" role="group" aria-label="Dependencias sin puerta"></div>
     <div id="door-preview" class="door-preview" aria-live="polite">Elegí una dependencia de la lista.</div>
     ${nodeDegree===0?'<p class="assist-caution">Este nodo no tiene conexiones. La ruta no funcionará hasta conectarlo al grafo.</p>':''}
     <label class="assist-check"><input type="checkbox" id="door-verified" /> Comprobé físicamente esta puerta</label>
     <button type="button" class="btn p assist-confirm" id="confirm-door" disabled>Confirmar vinculación</button>`:
     !existing.length?'<p class="assist-muted">Este nodo no es un extremo amarillo. Seleccioná un candidato a puerta para hacer la asignación.</p>':''}
   <div class="assist-footer"><button type="button" class="btn" id="undo-door" ${undoLast?'':'disabled'}>↶ Deshacer última asignación</button><span>Guardado local · Exportá JSON</span></div>
  </section>`;
 }
 function paintDoorSearch(){
  const out=el('door-result');if(!out)return;
  const input=el('door-search'),term=String(input?.value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const matches=unassignedSpaces(model,floor).filter(s=>(s.code+' '+s.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));
  const visible=matches.slice(0,7);
  out.innerHTML=visible.map(s=>`<button type="button" class="door-result ${candidate===s.code?'on':''}" data-candidate="${e(s.code)}" aria-pressed="${candidate===s.code}"><strong>${e(s.code)}</strong><span>${e(s.name)}</span></button>`).join('')||'<p class="assist-muted">Sin resultados entre las dependencias pendientes de esta planta.</p>';
  if(matches.length>7)out.insertAdjacentHTML('beforeend',`<p class="assist-muted">${matches.length-7} resultados más: escribí parte del código o nombre.</p>`);
  const chosen=unassignedSpaces(model,floor).find(s=>s.code===candidate),preview=el('door-preview'),button=el('confirm-door');
  if(preview)preview.innerHTML=chosen?`Asignar <strong>${e(chosen.code)} · ${e(chosen.name)}</strong> a <strong>${e(selectedNode)}</strong>`:'Elegí una dependencia de la lista.';
  if(button)button.disabled=!chosen;
 }
 function adminView(){if(!admin)return '';const n=selectedNode?nodeOf(model,selectedNode):null;const q=selectedEdge?model.floors[floor].edges.find(x=>x.id===selectedEdge):null;return `<section class="editor"><h3>Edición del grafo (local)</h3><p class="small">Los extremos sin puerta asignada se ven en amarillo; los nodos verdes ya tienen puerta. Tocá uno para seleccionarlo: va a titilar. Con un dedo sobre el nodo podés moverlo; con dos dedos sobre el plano podés acercar/alejar. Arrastrá el fondo para desplazarte. También usá los controles + y −.</p><div class="selected-status" aria-live="polite">${selectedNode?`<span class="status-dot"></span> Nodo en edición: <b>${selectedNode}</b>`:"Tocá un nodo para editarlo"}</div><div class="door-progress-wrap">${['A1','A2'].map(fl=>{const s=doorProgress(model,fl);return `<div class="floor-progress ${fl===floor?'floor-current':''}"><div><strong>${fl}</strong><span>${s.linked} de ${s.total} destinos vinculados · ${s.pending} pendientes</span></div><progress value="${s.linked}" max="${s.total}" aria-label="Puertas vinculadas en ${fl}"></progress></div>`}).join('')}</div><div class="door-review-legend"><span class="legend-dot pending-dot"></span><b>${pendingDoorNodes(model,floor).length} extremos sin asignar</b> · <span class="legend-dot linked-dot"></span> Puerta vinculada · <span class="legend-dot junction-dot"></span> Circulación</div>
 <div class="edittools"><button class="btn" id="next-pending">Siguiente nodo amarillo ›</button>${selectedNode&&assistantDismissed?'<button class="btn p" id="open-assistant">Abrir asistente</button>':''}</div><label class="checks pending-filter"><input type="checkbox" id="pending-only" ${showPendingOnly?'checked':''}/> Mostrar solo posibles puertas (amarillo) y vinculadas (verde)</label>
 <div class="edittools"><button data-tool="pick" class="btn ${tool==='pick'?'sel':''}">Seleccionar/mover</button><button data-tool="add" class="btn ${tool==='add'?'sel':''}">Agregar nodo</button><button data-tool="connect" class="btn ${tool==='connect'?'sel':''}">Conectar nodos</button></div>${connectStart?`<p class="small">Nodo inicial: ${connectStart}. Elegí el segundo.</p>`:''}
 ${n?`<div class="editinfo"><b>${n.id} · (${n.x_pdf_pt.toFixed(1)}, ${n.y_pdf_pt.toFixed(1)})</b><span>Puertas vinculadas: ${model.spaces_catalog.filter(x=>x.door_node_id===n.id).map(x=>x.code).join(', ')||'ninguna'}</span><button class="btn" id="focus-selected">Centrar y ampliar nodo</button><span class="small">Las asignaciones se realizan mediante el asistente de búsqueda.</span></div>`:''}
 ${q?`<div class="editinfo"><b>Tramo ${q.id}</b><span>${q.from} ↔ ${q.to}</span><label class="checks"><input type="checkbox" id="enabled" ${q.route_enabled!==false?'checked':''}/> Conexión transitable</label><select id="kind"><option value="corridor_or_indoor_walkway" ${q.segment_type!=='stair_flight'?'selected':''}>Pasillo</option><option value="stair_flight" ${q.segment_type==='stair_flight'?'selected':''}>Escalones</option></select><button class="btn p" id="save-edge">Guardar cambios</button><button class="btn d" id="drop-edge">Eliminar tramo</button></div>`:''}
 ${doorAssistantView()}<div class="edittools"><button class="btn" id="export">Exportar JSON</button><label class="btn" style="display:inline-block">Importar JSON<input type="file" accept=".json" id="import" hidden/></label><button class="btn d" id="reset">Restaurar base JSON integrada (v0.2.9)</button></div><p class="small">⚠ La edición no dispone de autenticación; este es un prototipo técnico, no una interfaz pública de administración.</p></section>`}
 function render(){if(!alive||!model)return;recalc();if(voice.state!=='idle'&&speakingRoute!==routeKey())stopVoice();const old=el('stage'),y=old?.scrollTop||0,x=old?.scrollLeft||0;const r=getRoute();const a=spaceOf(model,from),b=spaceOf(model,to);
 const routeName=t=>t.id==='Misma planta'?'Misma planta':(t.type==='elevator'?'Ascensor ':'Escalera ')+t.id.replace(/^AS|^S/,'');
 const index=Math.max(0,routes.findIndex(t=>t.id===chosen));
 const opt=routes[index];
 const instructions=r?narrative(model,r,from,to):[];
 stepIndex=Math.max(0,Math.min(stepIndex,Math.max(0,instructions.length-1)));
 const compactChoice=code=>{const s=spaceOf(model,code);return s?`${s.code_type==='interno_sin_codigo_senaletico'?'':s.code+' · '}${s.name||s.code}`:'Elegir lugar'};
 const preferenceName=mode==='simple'?'Ruta sencilla':'Distancia en el plano';
 const prefSummary=preferenceName+(accessible?' · Sin escaleras':'');
 const prefFields=`<div class="item"><label for="mode">Criterio de recorrido</label><select id="mode"><option value="simple" ${mode==='simple'?'selected':''}>Menos cambios de dirección (estimado)</option><option value="schematic" ${mode==='schematic'?'selected':''}>Menor longitud en dibujo (no metros)</option></select></div><label class="checks"><input id="accessible" type="checkbox" ${accessible?'checked':''}/> Evitar escaleras (experimental)</label><p class="small">Sin escala real: no se calculan metros ni tiempos.</p>`;
 host.innerHTML=`<header><div class="brand"><span class="logo">FCM</span><div><h1>Navegador de la Facultad</h1><small>Prototipo v0.2.9 · Bloque A · A1 y A2</small></div></div><div class="head-right"><span class="warn"><span class="desktop-only">EXPERIMENTAL · No apto aún para uso público</span><span class="mobile-only">Rutas experimentales</span></span><button class="btn" id="admin">${admin?'Cerrar administrador':'Modo administrador'}</button></div></header>
 <div class="layout"><aside class="side">
 <section class="card search-card"><h2>¿Adónde querés ir?</h2>
   <div class="origin-destination"><div class="od-fields"><div class="item"><label for="from">Origen</label>${selection('from',from)}<button id="search-from" class="public-select" type="button" aria-label="Buscar origen"><span>${e(compactChoice(from))}</span><span aria-hidden="true">⌕</span></button></div><div class="item"><label for="to">Destino</label>${selection('to',to)}<button id="search-to" class="public-select" type="button" aria-label="Buscar destino"><span>${e(compactChoice(to))}</span><span aria-hidden="true">⌕</span></button></div></div>
   <button class="btn swap-btn" id="swap" title="Intercambiar origen y destino" aria-label="Intercambiar origen y destino"><span class="desktop-only">⇅ Intercambiar</span><svg class="mobile-only swap-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v17m0 0-4-4m4 4 4-4M16 21V4m0 0-4 4m4-4 4 4"/></svg></button></div>
   <button class="pref-toggle" id="toggle-prefs" aria-expanded="${prefsExpanded}" aria-controls="prefs-area" type="button"><span>⚙ Preferencias</span><span class="pref-summary">${e(prefSummary)}</span><span class="pref-chevron" aria-hidden="true">${prefsExpanded?'⌃':'⌄'}</span></button>
   <div class="prefs-area ${prefsExpanded?'prefs-open':''}" id="prefs-area">${prefFields}</div>
 </section>
 <section class="card alternatives-card"><h2>Alternativas <span class="alt-count">${routes.length}</span></h2>
 <div class="route-carousel" role="group" aria-label="Alternativas de recorrido"><button class="alt-arrow" id="prev-route" aria-label="Alternativa anterior" ${routes.length<2?'disabled':''}>‹</button>
 <div class="alt-selected" aria-live="polite">${opt?`<strong>${e(routeName(opt))}</strong><span class="route-position">${index+1} / ${routes.length}</span>`:'<span>No hay alternativas</span>'}</div>
 <button class="alt-arrow" id="next-route" aria-label="Alternativa siguiente" ${routes.length<2?'disabled':''}>›</button></div>
 <div class="routes">${routes.length?routes.map((t,i)=>`<button class="route ${chosen===t.id?'on':''}" data-route="${e(t.id)}"><span class="n">${i+1}</span><span><strong>${e(routeName(t))}</strong><br/><small>${t.legs.reduce((v,z)=>v+z.edges.length,0)} tramos · ruta provisoria</small></span><span>›</span></button>`).join(''):'<p class="small">No hay recorrido disponible. El espacio puede no tener puerta validada o estar excluido por el filtro.</p>'}</div>
 ${!routes.length?'<p class="small mobile-no-route">Revisá las puertas asociadas y las preferencias.</p>':''}</section>
 <section class="card instr"><h2><span>Indicaciones</span><span class="instruction-actions"><button class="btn speak-btn" id="say" ${!r?'disabled':''} aria-label="Leer indicaciones desde el principio" title="Leer desde el principio"><span class="mobile-only" aria-hidden="true">🔊</span><span class="desktop-only">🔊 Leer</span></button><button class="btn pause-btn" id="pause" type="button" aria-label="Pausar lectura" aria-pressed="false" title="Pausar lectura" disabled><span class="mobile-only" aria-hidden="true">⏸</span><span class="desktop-only">⏸ Pausar</span></button><button class="btn stop-btn" id="stop" type="button" title="Detener lectura" aria-label="Detener lectura" disabled>■</button></span></h2>
 ${r?`${stepMode?`<div class="guide-bar" aria-label="Guía manual"><button class="guide-arrow" id="step-prev" aria-label="Paso anterior" ${stepIndex===0?'disabled':''}>‹</button><span class="guide-number" aria-live="polite">Paso ${stepIndex+1} de ${instructions.length}</span><button class="guide-arrow" id="step-next" aria-label="Paso siguiente" ${stepIndex>=instructions.length-1?'disabled':''}>›</button><button class="guide-speak" id="step-say" title="Escuchar solo este paso" aria-label="Escuchar solo este paso">🔊</button></div>`:''}<ol>${instructions.map((x,i)=>`<li ${stepMode&&i===stepIndex?'class="guide-active" aria-current="step"':''}>${e(x)}</li>`).join('')}</ol><button type="button" class="guide-toggle" id="step-toggle" aria-pressed="${stepMode}">${stepMode?'✕ Salir de guía por pasos':'▶ Seguir indicaciones por pasos'}</button>`:'<p class="small">Elegí espacios con puertas vinculadas.</p>'}</section></aside>
 <main class="work ${mapExpanded||admin?'map-expanded':''}"><button class="map-toggle" id="toggle-map" aria-expanded="${mapExpanded||admin}" aria-controls="map-inner"><span>🗺 Ver plano del recorrido</span><span aria-hidden="true">${mapExpanded||admin?'⌃':'⌄'}</span></button>
 <div id="map-inner" class="map-inner"><div class="bar"><div class="tabs"><button class="btn ${floor==='A1'?'p':''}" data-floor="A1">Planta A1</button><button class="btn ${floor==='A2'?'p':''}" data-floor="A2">Planta A2</button></div><div class="tools"><button class="btn zoom-btn" id="less" aria-label="Alejar plano">−</button><span class="label" id="zoom-number">${Math.round(zoom*100)}%</span><button class="btn zoom-btn" id="more" aria-label="Ampliar plano">+</button><button class="btn zoom-reset" id="reset-zoom">100%</button><label class="checks"><input type="checkbox" id="graph" ${showGraph||admin?'checked':''}/> Grafo</label></div></div>
 <div class="meta">🟢 Itinerario · 🟠 Escaleras y ascensores · 🔴 Origen/destino <span class="mobile-tip">· Pellizcá con dos dedos para ampliar en modo administrador</span></div>${mapView()}
 <p class="map-foot">Planta baja: plano CAD vectorial y código de cada recinto desde el catálogo vigente. Primer piso: plano anterior. Las posiciones de puertas se pueden seguir corrigiendo en Administrador. En móvil usá + / − y, en modo administrador, pellizcá con dos dedos para acercar el plano mientras editás.</p>
 <div class="note">${!a?.door_node_id?'⚠ Origen '+from+' sin puerta vinculada. ':''}${!b?.door_node_id?'⚠ Destino '+to+' sin puerta vinculada. ':''}${r?'⚠ Los desembarcos verticales tienen coordenadas provisionales. Las rutas no están certificadas.':'Verificá los puntos de acceso antes de calcular.'}</div>${adminView()}</div></main></div>
 <div class="end">FCM · Prototipo v0.2.9 · Planta baja: CAD calibrado; primer piso: plano anterior · Datos locales</div>${alert?`<div class="notify" role="status">${e(alert)} <button id="dismiss">×</button></div>`:''}${publicSearchView()}`;
 const stage=el('stage');if(stage){
 if(centerNext||!old){const leg=getRoute()?.legs.find(l=>l.floor===floor);const points=(leg?.nodes||[]).map(id=>nodeOf(model,id)).filter(Boolean);const target=points.length?points[Math.floor(points.length/2)]:null;if(target){const scale=Math.round(405*zoom)/R.w;stage.scrollTop=(target.y_pdf_pt-R.y)*scale-stage.clientHeight/2;stage.scrollLeft=(target.x_pdf_pt-R.x)*scale-stage.clientWidth/2;}centerNext=false;}
 else{stage.scrollTop=y;stage.scrollLeft=x;}}
 bind();syncVoiceButtons();paintDoorSearch();paintPublicSearch();if(searchTarget)el('public-search')?.focus();}
 function adjustZoom(next,point){
  const svg=el('map'),stage=el('stage');if(!svg||!stage)return;
  const z=Math.max(.75,Math.min(7,Math.round(next*100)/100));if(Math.abs(z-zoom)<.001)return;
  const sr=stage.getBoundingClientRect(),cx=point?.x??(sr.left+sr.width/2),cy=point?.y??(sr.top+sr.height/2);
  const before=svg.getBoundingClientRect();const u=(cx-before.left)/Math.max(1,before.width),v=(cy-before.top)/Math.max(1,before.height);
  zoom=z;svg.setAttribute('width',String(Math.round(405*zoom)));
  const after=svg.getBoundingClientRect();
  stage.scrollLeft+=after.left+u*after.width-cx;
  stage.scrollTop+=after.top+v*after.height-cy;
  const label=el('zoom-number');if(label)label.textContent=Math.round(zoom*100)+'%';
 }
 function focusNode(){const node=selectedNode?nodeOf(model,selectedNode):null;if(!node)return;adjustZoom(Math.max(zoom,3));const stage=el('stage'),svg=el('map');if(!stage||!svg)return;
  const ratio=svg.getBoundingClientRect().width/R.w;
  stage.scrollLeft=(node.x_pdf_pt-R.x)*ratio-stage.clientWidth/2;
  stage.scrollTop=(node.y_pdf_pt-R.y)*ratio-stage.clientHeight/2;
 }
 function bind(){const on=(id,event,fn)=>el(id)?.addEventListener(event,fn),click=(id,fn)=>on(id,'click',fn);
 function routeChanged(){resetSteps();stopVoice();}
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
 click('toggle-prefs',()=>{prefsExpanded=!prefsExpanded;render()});click('toggle-map',()=>{if(admin)return;mapExpanded=!mapExpanded;if(mapExpanded)centerNext=true;render()});click('prev-route',()=>{if(routes.length<2)return;const pos=routes.findIndex(t=>t.id===chosen);chosen=routes[(pos-1+routes.length)%routes.length].id;routeChanged();centerNext=true;render()});click('next-route',()=>{if(routes.length<2)return;const pos=routes.findIndex(t=>t.id===chosen);chosen=routes[(pos+1)%routes.length].id;routeChanged();centerNext=true;render()});
 on('from','change',ev=>{from=ev.target.value;floor=spaceOf(model,from)?.floor||'A1';chosen='';routeChanged();centerNext=true;render()});on('to','change',ev=>{to=ev.target.value;chosen='';routeChanged();centerNext=true;render()});on('mode','change',ev=>{mode=ev.target.value;chosen='';routeChanged();render()});on('accessible','change',ev=>{accessible=ev.target.checked;chosen='';routeChanged();render()});on('graph','change',ev=>{showGraph=ev.target.checked;render()});
 click('swap',()=>{if(!from||!to)return;[from,to]=[to,from];floor=spaceOf(model,from)?.floor||'A1';chosen='';routeChanged();centerNext=true;render()});click('admin',()=>{if(!admin){mapBeforeAdmin=mapExpanded;mapExpanded=true;admin=true;}else{admin=false;mapExpanded=mapBeforeAdmin;}showGraph=admin||showGraph;selectedNode=null;selectedEdge=null;centerNext=true;render()});click('less',()=>adjustZoom(zoom-.5));click('more',()=>adjustZoom(zoom+.5));click('reset-zoom',()=>adjustZoom(1));click('dismiss',()=>{alert='';render()});
 host.querySelectorAll('[data-floor]').forEach(x=>x.addEventListener('click',()=>{floor=x.dataset.floor;selectedNode=null;selectedEdge=null;candidate='';assistantDismissed=false;centerNext=true;render()}));host.querySelectorAll('[data-route]').forEach(x=>x.addEventListener('click',()=>{chosen=x.dataset.route;routeChanged();centerNext=true;render()}));host.querySelectorAll('[data-tool]').forEach(x=>x.addEventListener('click',()=>{tool=x.dataset.tool;connectStart=null;render()}));
 click('say',()=>{if(!runnable())return;speakingRoute=routeKey();if(!voice.play(narrative(model,getRoute(),from,to).join(' ')))info('No se pudo iniciar la lectura en este navegador.');});
 click('pause',()=>{if(!voice.togglePause()&&voice.state!=='idle')info('El navegador no pudo pausar o reanudar la lectura.');});
 click('stop',()=>stopVoice());
 function runnable(){if(!voice.supported()){info('El navegador no admite lectura hablada.');return false;}return !!getRoute()}
 const svg=el('map');if(svg){
  let drag=null,pan=null,pinch=null,suppressClick=false;
  const pointers=new Map();
  const xy=event=>{const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const mat=svg.getScreenCTM();if(!mat)return null;const z=p.matrixTransform(mat.inverse());return {x:Math.min(R.x+R.w,Math.max(R.x,z.x)),y:Math.min(R.y+R.h,Math.max(R.y,z.y))}};
  const d2=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0};
  svg.addEventListener('pointerdown',event=>{
   if(!admin)return;
   if(event.pointerType==='touch')pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(pointers.size>=2){drag=null;pan=null;pinch={distance:Math.max(1,d2()),zoom};event.preventDefault();return;}
   const target=event.target.closest('[data-node]');
   if(tool==='pick'&&target){drag={id:target.dataset.node,start:xy(event),pointer:event.pointerId,moved:false};try{svg.setPointerCapture(event.pointerId)}catch{}event.preventDefault();return;}
   if(event.pointerType==='touch'){pan={pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.preventDefault()}
  });
  svg.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'&&pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(pinch&&pointers.size>=2){const [a,b]=[...pointers.values()];adjustZoom(pinch.zoom*d2()/pinch.distance,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});event.preventDefault();return;}
   if(pan&&pan.pointer===event.pointerId){const stage=el('stage'),dx=event.clientX-pan.x,dy=event.clientY-pan.y;
    if(Math.hypot(dx,dy)>3)pan.moved=true;
    stage.scrollLeft-=dx;stage.scrollTop-=dy;pan.x=event.clientX;pan.y=event.clientY;event.preventDefault();return;
   }
   if(!drag||drag.pointer!==event.pointerId)return;
   const p=xy(event);if(!p)return;
   if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>1)drag.moved=true;
   const circle=svg.querySelector(`.node[data-node="${drag.id}"]`),hit=svg.querySelector(`.node-hit[data-node="${drag.id}"]`),halo=svg.querySelector('.node-halo');
   for(const item of [circle,hit,halo])if(item){item.setAttribute('cx',p.x);item.setAttribute('cy',p.y)}
   for(const line of svg.querySelectorAll(`[data-edge]`)){
    const edge=model.floors[floor].edges.find(e=>e.id===line.dataset.edge);
    if(edge?.from===drag.id){line.setAttribute('x1',p.x);line.setAttribute('y1',p.y)}
    if(edge?.to===drag.id){line.setAttribute('x2',p.x);line.setAttribute('y2',p.y)}
   }
   event.preventDefault();
  });
  const finish=(event,cancel=false)=>{
   if(event.pointerType==='touch')pointers.delete(event.pointerId);
   if(pinch){if(pointers.size<2){pinch=null;suppressClick=true;render()}return;}
   if(pan&&pan.pointer===event.pointerId){if(pan.moved)suppressClick=true;pan=null;return;}
   if(!drag||drag.pointer!==event.pointerId)return;
   const d=drag;drag=null;
   if(!cancel&&d.moved){const p=xy(event),node=nodeOf(model,d.id);if(node&&p){node.x_pdf_pt=numeric(p.x);node.y_pdf_pt=numeric(p.y);node.x_norm=+(p.x/1190.551).toFixed(6);node.y_norm=+(p.y/1683.78).toFixed(6);
    for(const edge of model.floors[floor].edges)if(edge.from===d.id||edge.to===d.id)edge.length_pdf_pt=numeric(distance(nodeOf(model,edge.from),nodeOf(model,edge.to)));
    selectedNode=d.id;alert='Nodo movido. Exportá el modelo para conservar tus cambios.';suppressClick=true;refresh();return;
   }}
   if(selectedNode!==d.id){candidate='';assistantDismissed=false;}selectedNode=d.id;selectedEdge=null;suppressClick=true;render();
  };
  svg.addEventListener('pointerup',event=>finish(event));
  svg.addEventListener('pointercancel',event=>finish(event,true));
  svg.addEventListener('click',event=>{
   if(!admin)return;
   if(suppressClick){suppressClick=false;return;}
   const node=event.target.closest('[data-node]'),edge=event.target.closest('[data-edge]');
   if(node){const id=node.dataset.node;
    if(tool==='connect'){
     if(!connectStart){connectStart=id;info('Elegí el segundo nodo para crear el tramo.');return}
     if(id===connectStart){info('Elegí un nodo distinto.');return}
     const exists=model.floors[floor].edges.some(x=>(x.from===connectStart&&x.to===id)||(x.from===id&&x.to===connectStart));
     if(exists){connectStart=null;info('Los nodos ya están conectados.');return}
     const ids=new Set(model.floors[floor].edges.map(x=>x.id));let k=1;while(ids.has(floor+'-T'+String(k).padStart(3,'0')))k++;
     model.floors[floor].edges.push({id:floor+'-T'+String(k).padStart(3,'0'),from:connectStart,to:id,length_pdf_pt:numeric(distance(nodeOf(model,connectStart),nodeOf(model,id))),route_enabled:true,segment_type:'corridor_or_indoor_walkway',step_free:'not_individually_audited',accessible_routing_permitted:false,validation_status:'pendiente_verificacion'});
     connectStart=null;alert='Conexión creada. Falta validar su accesibilidad.';refresh();return;
    }
    selectedNode=id;selectedEdge=null;candidate='';assistantDismissed=false;render();return;
   }
   if(edge){selectedEdge=edge.dataset.edge;selectedNode=null;render();return}
   if(tool==='add'){
    const p=xy(event);if(!p)return;const ids=new Set(model.floors[floor].nodes.map(x=>x.id));let k=1;while(ids.has(floor+'-N'+String(k).padStart(3,'0')))k++;
    selectedNode=floor+'-N'+String(k).padStart(3,'0');model.floors[floor].nodes.push({id:selectedNode,x_pdf_pt:numeric(p.x),y_pdf_pt:numeric(p.y),x_norm:+(p.x/1190.551).toFixed(6),y_norm:+(p.y/1683.78).toFixed(6),degree:0,labels:[]});alert='Nodo agregado sin conexiones.';refresh();
   }
  });
 }
 click('next-pending',()=>{const pending=pendingDoorNodes(model,floor);if(!pending.length){info('No quedan extremos de ramales sin asignar en '+floor+'.');return;}const ix=pending.indexOf(selectedNode);selectedNode=pending[(ix+1)%pending.length];selectedEdge=null;tool='pick';candidate='';assistantDismissed=false;centerNext=false;render();focusNode();if(window.matchMedia('(max-width:700px)').matches)el('stage')?.scrollIntoView({block:'start',behavior:'instant'});});
 click('close-assistant',()=>{assistantDismissed=true;render()});
 click('open-assistant',()=>{assistantDismissed=false;render()});
 on('door-search','input',()=>{candidate='';paintDoorSearch()});
 el('door-result')?.addEventListener('click',event=>{const hit=event.target.closest('[data-candidate]');if(!hit)return;candidate=hit.dataset.candidate;paintDoorSearch();});
 click('confirm-door',()=>{try{
  undoLast=assignDoorAssisted(model,floor,selectedNode,candidate,el('door-verified')?.checked===true);
  const code=candidate;candidate='';alert='Puerta '+code+' asociada a '+selectedNode+'. Guardá el JSON para compartir tus ediciones.';refresh();
 }catch(err){info(err.message)}});
 host.querySelectorAll('[data-unlink]').forEach(btn=>btn.addEventListener('click',()=>{try{
   const code=btn.dataset.unlink;if(!confirm('¿Desvincular '+code+' de su nodo?'))return;
   undoLast=unlinkDoorAssisted(model,code);candidate='';alert='Se desvinculó '+code+'.';refresh();
 }catch(err){info(err.message)}}));
 click('undo-door',()=>{if(!undoLast)return;try{undoDoorAction(model,undoLast);alert='Último cambio de puerta deshecho ('+undoLast.code+').';undoLast=null;candidate='';refresh()}catch(err){info(err.message)}});

 click('focus-selected',()=>focusNode());
 click('save-edge',()=>{const q=model.floors[floor].edges.find(x=>x.id===selectedEdge);if(!q)return;q.route_enabled=el('enabled').checked;q.segment_type=el('kind').value;q.step_free=q.segment_type==='stair_flight'?false:'not_individually_audited';q.accessible_routing_permitted=q.segment_type==='stair_flight'?false:q.accessible_routing_permitted!==false;q.validation_status='modificado_en_editor';alert='Tramo actualizado.';refresh()});click('drop-edge',()=>{if(!confirm('¿Eliminar este tramo del modelo local?'))return;model.floors[floor].edges=model.floors[floor].edges.filter(x=>x.id!==selectedEdge);selectedEdge=null;alert='Tramo eliminado.';refresh()});
 click('export',()=>{download('FCM_grafo_editado.json',JSON.stringify(model,null,2));info('Modelo exportado: guardá el JSON para conservar las modificaciones.')});on('import','change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{const obj=migrateCadV029(migrateCatalogV02(JSON.parse(await f.text()))),issues=validate(obj);if(issues.length)throw Error(issues.join('; '));model=obj;undoLast=null;candidate='';alert='Modelo importado y adaptado al CAD A1; AS1 queda excluido.';refresh()}catch(err){info('Error en JSON: '+err.message)}});on('pending-only','change',ev=>{showPendingOnly=ev.target.checked;render()});click('reset',()=>{if(!confirm('¿Descartar todas las ediciones de este navegador?'))return;model=structuredClone(original);selectedNode=null;selectedEdge=null;undoLast=null;candidate='';alert='Modelo base restaurado.';refresh()});
 }
 host.innerHTML='<p style="padding:35px">Cargando planos y modelo geométrico…</p>';void load();return ()=>{alive=false;stopVoice();host.innerHTML=''};
}
