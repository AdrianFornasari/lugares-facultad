/** Motor offline experimental. Todas las distancias son unidades del dibujo PDF, NO metros. */
export const nodeOf=(m,id)=>m.floors[id.slice(0,2)]?.nodes.find(n=>n.id===id);
export const spaceOf=(m,code)=>m.spaces_catalog.find(x=>x.code===code);
export const distance=(a,b)=>Math.hypot(a.x_pdf_pt-b.x_pdf_pt,a.y_pdf_pt-b.y_pdf_pt);
export function validate(m){const errs=[];const ids=new Set();for(const f of ['A1','A2']){if(!m?.floors?.[f])return ['Falta planta '+f];for(const n of m.floors[f].nodes){if(ids.has(n.id))errs.push('Nodo duplicado '+n.id);ids.add(n.id)}for(const e of m.floors[f].edges)if(!m.floors[f].nodes.some(n=>n.id===e.from)||!m.floors[f].nodes.some(n=>n.id===e.to))errs.push('Tramo inválido '+e.id)}for(const v of m.vertical_connections){if(!ids.has(v.a1_node)||!ids.has(v.a2_node))errs.push('Conector inválido '+v.id)}for(const s of m.spaces_catalog)if(s.door_node_id&&!ids.has(s.door_node_id))errs.push('Puerta inválida '+s.code);return errs;}
function stepFree(e){return e.segment_type!=='stair_flight'&&e.step_free!==false&&e.accessible_routing_permitted!==false;}
export function leg(m,f,start,end,mode='simple',accessible=false){const n=new Map(m.floors[f].nodes.map(v=>[v.id,v]));if(!n.has(start)||!n.has(end))return null;const adj=new Map([...n.keys()].map(x=>[x,[]]));for(const e of m.floors[f].edges){if(e.route_enabled===false||(accessible&&!stepFree(e)))continue;adj.get(e.from).push([e.to,e]);adj.get(e.to).push([e.from,e]);}const key=(a,b)=>a+'|'+(b||'-'),initial=key(start,null);const best=new Map([[initial,0]]),back=new Map(),q=[{k:initial,id:start,prev:null,c:0,len:0}];let goal=null;while(q.length){q.sort((a,b)=>a.c-b.c);const cur=q.shift();if(cur.c>(best.get(cur.k)??Infinity)+1e-7)continue;if(cur.id===end){goal=cur;break;}for(const [next,e] of adj.get(cur.id)){const d=distance(n.get(cur.id),n.get(next));let turn=0;if(cur.prev){const a=n.get(cur.prev),b=n.get(cur.id),c=n.get(next);const v=[b.x_pdf_pt-a.x_pdf_pt,b.y_pdf_pt-a.y_pdf_pt],w=[c.x_pdf_pt-b.x_pdf_pt,c.y_pdf_pt-b.y_pdf_pt];const cos=(v[0]*w[0]+v[1]*w[1])/Math.max(.0001,Math.hypot(...v)*Math.hypot(...w));if(cos<.8)turn=45;}const cost=cur.c+(mode==='simple'?Math.max(3,d*.5)+12+turn:Math.max(.1,d));const k=key(next,cur.id);if(cost+1e-7<(best.get(k)??Infinity)){best.set(k,cost);back.set(k,{from:cur.k,id:cur.id,edge:e.id});q.push({k,id:next,prev:cur.id,c:cost,len:cur.len+d});}}}if(!goal)return null;let k=goal.k;const nodes=[goal.id],edges=[];while(k!==initial){const b=back.get(k);if(!b)return null;nodes.push(b.id);edges.push(b.edge);k=b.from;}return {floor:f,nodes:nodes.reverse(),edges:edges.reverse(),cost:goal.c,length:goal.len};}
export function calculate(m,from,to,mode='simple',accessible=false){const o=spaceOf(m,from),d=spaceOf(m,to);if(!o?.door_node_id||!d?.door_node_id)return [];if(o.floor===d.floor){const l=leg(m,o.floor,o.door_node_id,d.door_node_id,mode,accessible);return l?[{id:'Misma planta',type:'level',legs:[l],cost:l.cost,experimental:true}]:[];}const up=o.floor==='A1',routes=[];for(const c of m.vertical_connections){if(c.route_enabled_experimental===false||(accessible&&c.type!=='elevator'))continue;const first=leg(m,o.floor,o.door_node_id,up?c.a1_node:c.a2_node,mode,accessible),second=leg(m,d.floor,up?c.a2_node:c.a1_node,d.door_node_id,mode,accessible);if(first&&second)routes.push({id:c.id,type:c.type,legs:[first,second],cost:first.cost+second.cost+70,experimental:true});}return routes.sort((a,b)=>a.cost-b.cost);}
export const labelPlanta=f=>f==='A1'?'planta baja':f==='A2'?'primer piso':f;
export const lugarPlanta=f=>f==='A1'?'la planta baja':f==='A2'?'el primer piso':f;
export const pasilloDe=f=>f==='A1'?'de la planta baja':f==='A2'?'del primer piso':'de '+f;
export const conectorLegible=id=>/^AS\d+$/.test(id)?'ascensor '+id.slice(2):/^S\d+$/.test(id)?'escalera '+id.slice(1):id;
export function narrative(m,route,from,to){
 const o=spaceOf(m,from),d=spaceOf(m,to);
 if(!route||!o||!d)return [];
 const publicCode=s=>s.code_type==='interno_sin_codigo_senaletico'?'':` (${s.code})`;
 const out=[`Salí de ${o.name}${publicCode(o)} al pasillo ${pasilloDe(o.floor)}.`];
 if(route.id!=='Misma planta'){
  out.push(`Seguí el trayecto resaltado en ${lugarPlanta(o.floor)} hasta ${lugarConector(route.id)}.`);
  if(route.type==='elevator'){
   out.push(`Tomá el ${conectorLegible(route.id)} hasta ${lugarPlanta(d.floor)}; abre directamente al pasillo, sin escalones.`);
  }else if(route.id==='S3'&&o.floor==='A1'){
   out.push(`Subí por la escalera 3 hasta el descanso, continuá por una de las dos ramas con escalones y llegá al pasillo del primer piso.`);
  }else if(route.id==='S3'&&o.floor==='A2'){
   out.push('Desde el primer piso, bajá por una de las dos ramas con escalones hasta el descanso de la escalera 3; continuá bajando hasta el pasillo de la planta baja.');
  }else{
   out.push(`${o.floor==='A1'?'Subí':'Bajá'} por la ${conectorLegible(route.id)} hasta el pasillo ${pasilloDe(d.floor)}.`);
  }
 }
 out.push(`Seguí el recorrido marcado hasta la puerta de ${d.name}${publicCode(d)}.`);
 out.push('Ruta experimental: los giros y desembarcos precisos aún requieren validación.');
 return out;
}
const lugarConector=id=>/^AS\d+$/.test(id)?'el '+conectorLegible(id):/^S\d+$/.test(id)?'la '+conectorLegible(id):id;


/** Posibles puertas pendientes: extremos libres del grafo que no son escaleras,
 * ascensores, accesos exteriores ni puertas ya asociadas. Los cruces y puntos
 * intermedios NO deben interpretarse como puertas pendientes. */
export function pendingDoorNodes(m, floor){
 const g=m.floors[floor];if(!g)return [];
 const deg=new Map(g.nodes.map(n=>[n.id,0]));
 for(const edge of g.edges){deg.set(edge.from,(deg.get(edge.from)||0)+1);deg.set(edge.to,(deg.get(edge.to)||0)+1);}
 const occupied=new Set(m.spaces_catalog.filter(s=>s.floor===floor&&s.door_node_id).map(s=>s.door_node_id));
 const landmarks=new Set(g.landmarks.map(l=>l.node_id));
 for(const c of m.vertical_connections||[])landmarks.add(floor==='A1'?c.a1_node:c.a2_node);
 return g.nodes.filter(n=>!n.door_candidate_excluded&&!occupied.has(n.id)&&!landmarks.has(n.id)&&(deg.get(n.id)??0)<=1).map(n=>n.id);
}

/** Migración de catálogo v0.2: aplica correcciones confirmadas sin perder cambios geométricos locales. */
export function migrateCatalogV02(m){
 const corrections=[
  ['A126','Aula C Preventiva',null,'oficial'],
  ['A124','Histología ME','A1-N032','oficial'],
  ['WC-H-PB','Baño Hombres PB','A1-N028','interno_sin_codigo_senaletico'],
  ['WC-M-PB','Baño Mujeres PB','A1-N029','interno_sin_codigo_senaletico']
 ];
 for(const [code,name,node,kind] of corrections){
  let item=m.spaces_catalog.find(s=>s.code===code);
  if(!item){item={code,floor:'A1',door_node_id:null,door_validation:'pendiente',searchable_by_name:true,assignment_status:'asignado'};m.spaces_catalog.push(item)}
  item.name=name;item.name_status='confirmado_por_usuario';item.source='Corrección confirmada por usuario (2026-10-17)';item.code_type=kind;
  if(node && item.door_node_id!==node && m.catalog_revision!=='0.2'){
   item.door_node_id=node;item.door_validation='confirmada_por_usuario';item.door_node_source='nodo_confirmado_por_usuario';
  }
 }
 m.catalog_revision='0.2';m.prototype_version=m.prototype_version||'0.2';if(m.catalog_stats){m.catalog_stats.spaces_total=m.spaces_catalog.length;m.catalog_stats.A1=m.spaces_catalog.filter(s=>s.floor==='A1').length;m.catalog_stats.A2=m.spaces_catalog.filter(s=>s.floor==='A2').length;m.catalog_stats.door_anchored_confirmed=m.spaces_catalog.filter(s=>s.door_node_id&&s.door_validation==='confirmada_por_usuario').length;m.catalog_stats.name_confirmed_by_user=m.spaces_catalog.filter(s=>s.name_status==='confirmado_por_usuario').length;m.catalog_stats.count=m.spaces_catalog.length}return m;
}

/** Asignación asistida (sin cambiar la geometría). Un mismo nodo no puede
 * asignarse por accidente a dos espacios. Las dependencias sin asignación
 * administrativa (A223/A225) no se ofrecen como destinos. */
export function eligibleSpace(s,floor){return s.floor===floor && !!String(s.name||'').trim() && s.assignment_status!=='sin_asignacion';}
/** Destinos que pueden utilizarse en ambos selectores públicos.
 * Tener un código en el catálogo no basta: la puerta debe apuntar a un nodo
 * existente de la MISMA planta. Se permite puerta pendiente de verificación:
 * la vinculación está registrada, pero la ruta sigue siendo experimental. */
export function selectableSpaces(m){
 if(!m?.spaces_catalog || !m.floors)return [];
 const indexes=new Map(Object.entries(m.floors).map(([floor,graph])=>[floor,new Set(graph.nodes.map(n=>n.id))]));
 return m.spaces_catalog.filter(s=>s.door_node_id && eligibleSpace(s,s.floor) && indexes.get(s.floor)?.has(s.door_node_id));
}
/** Búsqueda pública sin conexión por código o nombre; tolera tildes y espacios.
 * Solo devuelve espacios con una puerta vinculada a un nodo de su planta. */
export const searchKey = text => String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim().replace(/\s+/g,' ');
export function searchDestinations(m,query='',limit=15){
 const q=searchKey(query);
 const candidates=selectableSpaces(m).filter(s=>!q||searchKey(`${s.code} ${s.name}`).includes(q));
 candidates.sort((a,b)=>{
  const score=s=>searchKey(s.code)===q?0:searchKey(s.code).startsWith(q)?1:searchKey(s.name).startsWith(q)?2:3;
  return score(a)-score(b)||String(a.name||a.code).localeCompare(String(b.name||b.code),'es',{numeric:true});
 });
 return {total:candidates.length,items:candidates.slice(0,Math.max(0,limit))};
}
export function unassignedSpaces(m,floor){return m.spaces_catalog.filter(s=>eligibleSpace(s,floor)&&!s.door_node_id).sort((a,b)=>a.code.localeCompare(b.code,'es',{numeric:true}));}
export function doorProgress(m,floor){
 const all=m.spaces_catalog.filter(s=>eligibleSpace(s,floor));
 const linked=all.filter(s=>s.door_node_id).length;
 return {floor,total:all.length,linked,pending:all.length-linked,percent:all.length?Math.round(linked/all.length*100):0};
}
export function assignDoorAssisted(m,floor,nodeId,code,verified=false){
 if(!m.floors[floor]?.nodes.some(n=>n.id===nodeId))throw Error('El nodo no pertenece a '+floor+'.');
 const room=spaceOf(m,code);
 if(!room||!eligibleSpace(room,floor))throw Error('La dependencia no está habilitada en esta planta.');
 if(room.door_node_id)throw Error('Esa dependencia ya tiene una puerta vinculada: '+room.door_node_id+'. Primero desvinculala si corresponde.');
 if(m.spaces_catalog.some(s=>s.door_node_id===nodeId))throw Error('El nodo ya está asignado a otra dependencia.');
 if(!pendingDoorNodes(m,floor).includes(nodeId))throw Error('Elegí un nodo amarillo, extremo de un ramal sin puerta.');
 const previous={door_node_id:room.door_node_id,door_validation:room.door_validation,door_node_source:room.door_node_source};
 room.door_node_id=nodeId;room.door_validation=verified?'confirmada_por_usuario':'pendiente';room.door_node_source='asistente_local_v0.2.4';
 return {code,previous};
}
export function unlinkDoorAssisted(m,code){
 const room=spaceOf(m,code);if(!room||!room.door_node_id)throw Error('La dependencia no tiene puerta vinculada.');
 const previous={door_node_id:room.door_node_id,door_validation:room.door_validation,door_node_source:room.door_node_source};
 room.door_node_id=null;room.door_validation='pendiente';room.door_node_source=null;
 return {code,previous};
}
export function undoDoorAction(m,action){
 const room=spaceOf(m,action?.code);if(!room||!action?.previous)throw Error('No hay una asignación para deshacer.');
 const {door_node_id,door_validation,door_node_source}=action.previous;
 room.door_node_id=door_node_id;room.door_validation=door_validation;room.door_node_source=door_node_source;
}

/** Migración CAD A1. Idempotente: conserva las ediciones del administrador
 * y retira AS1, cuya inexistencia física fue confirmada por el usuario.
 * El traslado del plano es una TRANSLACIÓN, no una deformación. */
export function migrateCadV029(m){
 if(m?.cad_migration?.id==='CAD_A1_2026_10_24')return m;
 const dx=218.475211,dy=-63.758539;
 for(const n of m.floors.A1.nodes){
  n.x_pdf_pt=+(n.x_pdf_pt+dx).toFixed(4);n.y_pdf_pt=+(n.y_pdf_pt+dy).toFixed(4);
  n.x_norm=+(n.x_pdf_pt/1190.551).toFixed(6);n.y_norm=+(n.y_pdf_pt/1683.78).toFixed(6);
 }
 for(const l of m.floors.A1.landmarks){for(const k of ['coordinate_pdf','target_pdf'])if(Array.isArray(l[k]))l[k]=[+(l[k][0]+dx).toFixed(4),+(l[k][1]+dy).toFixed(4)];}
 for(const f of ['A1','A2']){
  m.floors[f].landmarks=m.floors[f].landmarks.filter(l=>l.label!=='AS1');
  for(const n of m.floors[f].nodes)n.labels=(n.labels||[]).filter(x=>x!=='AS1');
 }
 m.vertical_connections=m.vertical_connections.filter(c=>c.id!=='AS1');
 for(const [f,id] of [['A1','A1-N093'],['A2','A2-N099']]){const n=m.floors[f].nodes.find(x=>x.id===id);if(n){n.door_candidate_excluded=true;n.topology_note='Antigua ubicación AS1 inexistente, no es candidato a puerta';delete n.vertical_connector_id;delete n.functional_role;delete n.functional_topology_status;delete n.coordinate_status;}}
 m.user_confirmations.AS1_inexistente='confirmado_por_usuario_2026_10_24';
 for(const key of Object.keys(m.user_confirmations)){if(key.includes('AS1')&&key!=='AS1_inexistente')delete m.user_confirmations[key]}
 m.user_confirmations.AS2_llega_A1_A2_y_abre_al_pasillo_sin_escalones=true;
 m.coordinate_system.distance_calibrated_A1=true;
 m.coordinate_system.A1_pdf_points_per_metre=8.612445;
 m.coordinate_system.A1_calibration_method='barra_grafica_0_20_m; escala_nominal_1_500_no_valida';
 m.coordinate_system.A2_distance_calibrated=false;
 m.source.A1_pdf='Plantas Facultad A1 - CAD.pdf';
 m.source.A1_red_alignment_translation_pdf_points=[dx,dy];
 if(m.experimental_routes_v06){delete m.experimental_routes_v06.AS1;
  for(const r of Object.values(m.experimental_routes_v06)){const l=r?.legs?.A1;if(l?.coordinates_pdf)l.coordinates_pdf=l.coordinates_pdf.map(([x,y])=>[+(x+dx).toFixed(4),+(y+dy).toFixed(4)]);}}
 m.prototype_version='0.2.9';
 m.cad_migration={id:'CAD_A1_2026_10_24',dx,dy,pdf_scale_points_per_metre:8.612445,metric_scope:'A1_only'};
 return m;
}
