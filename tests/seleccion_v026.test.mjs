import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectableSpaces,pendingDoorNodes,assignDoorAssisted,unlinkDoorAssisted,undoDoorAction,calculate,validate,doorProgress} from '../shared/engine.js';
const original=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(original);
test('JSON (2): 62 destinos con puertas válidas A1=28 y A2=34',()=>{
 const ss=selectableSpaces(original);
 assert.equal(ss.length,62);
 assert.equal(ss.filter(s=>s.floor==='A1').length,28);
 assert.equal(ss.filter(s=>s.floor==='A2').length,34);
 assert.deepEqual(validate(original),[]);
 const ids=new Set();for(const s of ss){assert.ok(original.floors[s.floor].nodes.some(n=>n.id===s.door_node_id));assert.ok(!ids.has(s.door_node_id));ids.add(s.door_node_id)}
 for(const c of ['A129','A224','A232','A223','A225'])assert.ok(!ss.some(s=>s.code===c),c);
 for(const c of ['A126','A139','A205','A216','A227','A243'])assert.ok(ss.some(s=>s.code===c),c);
});
test('las listas responden al alta/baja y deshacer una puerta',()=>{
 const m=copy(),node=pendingDoorNodes(m,'A1')[0];assert.ok(node);
 const a=assignDoorAssisted(m,'A1',node,'A129',true);
 assert.equal(selectableSpaces(m).length,63);
 assert.ok(calculate(m,'A117','A129').length);
 undoDoorAction(m,a);assert.equal(selectableSpaces(m).length,62);
 const b=unlinkDoorAssisted(m,'A227');assert.equal(selectableSpaces(m).length,61);
 undoDoorAction(m,b);assert.equal(selectableSpaces(m).length,62);
});
test('18 movimientos sincronizados y 209 tramos métricamente consistentes con PDF',()=>{
 let count=0;
 for(const f of ['A1','A2']){
  const g=original.floors[f], [w,h]=g.page_size_pt;
  const ns=new Map(g.nodes.map(n=>[n.id,n]));
  for(const n of g.nodes){assert.ok(Math.abs(n.x_norm-n.x_pdf_pt/w)<1e-6,n.id);assert.ok(Math.abs(n.y_norm-n.y_pdf_pt/h)<1e-6,n.id)}
  for(const e of g.edges){const a=ns.get(e.from),b=ns.get(e.to);assert.ok(Math.abs(e.length_pdf_pt-Math.hypot(a.x_pdf_pt-b.x_pdf_pt,a.y_pdf_pt-b.y_pdf_pt))<.012,e.id);count++}
 }
 assert.equal(count,209);
 assert.equal(original.floors.A2.nodes.find(n=>n.id==='A2-N054').y_pdf_pt,769.41);
});
test('cuatro rutas entre A117 y A218, accesible por AS2',()=>{
 const all=calculate(original,'A117','A218');assert.deepEqual(new Set(all.map(r=>r.id)),new Set(['S1','S3','S4','AS2']));
 assert.deepEqual(new Set(calculate(original,'A117','A218','simple',true).map(r=>r.id)),new Set(['AS2']));
 assert.deepEqual(doorProgress(original,'A1').linked,28);assert.deepEqual(doorProgress(original,'A2').linked,34);
});
