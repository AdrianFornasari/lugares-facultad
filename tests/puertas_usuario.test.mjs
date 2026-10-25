import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate,validate,spaceOf,pendingDoorNodes} from '../shared/engine.js';
const m=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
test('JSON editado, topología y asignaciones importadas sin pérdida',()=>{
 assert.deepEqual(validate(m),[]);
 for(const [code,node] of Object.entries({'A201':'A2-N098','A202':'A2-N106','A203':'A2-N092','A204':'A2-N094','A206':'A2-N091','A222':'A2-N036'})){
  assert.equal(spaceOf(m,code)?.door_node_id,node,code);
  assert.equal(spaceOf(m,code)?.door_validation,'confirmada_por_usuario');
 }
 assert.equal(m.floors.A2.nodes.find(n=>n.id==='A2-N036').x_pdf_pt,424.33);
 assert.equal(m.floors.A2.nodes.find(n=>n.id==='A2-N091').x_pdf_pt,447.44);
});
test('Coordenadas normalizadas sincronizadas con nodos editados',()=>{
 for(const floor of ['A1','A2']){
  const g=m.floors[floor], [w,h]=g.page_size_pt;
  for(const node of g.nodes){assert.ok(Math.abs(node.x_norm-node.x_pdf_pt/w)<1e-6,node.id);assert.ok(Math.abs(node.y_norm-node.y_pdf_pt/h)<1e-6,node.id)}
 }
});
test('Candidatos sin puerta: solo extremos libres, no cruces ni conectores',()=>{
 for(const f of ['A1','A2']){
  const g=m.floors[f],pending=pendingDoorNodes(m,f);
  const degree=new Map(g.nodes.map(n=>[n.id,0]));g.edges.forEach(q=>{degree.set(q.from,degree.get(q.from)+1);degree.set(q.to,degree.get(q.to)+1)});
  const anchored=new Set(m.spaces_catalog.filter(s=>s.floor===f&&s.door_node_id).map(s=>s.door_node_id));
  assert.ok(pending.length>0);
  pending.forEach(id=>{assert.ok(degree.get(id)<=1,id);assert.ok(!anchored.has(id),id)});
  g.landmarks.forEach(l=>assert.ok(!pending.includes(l.node_id),l.label));
 }
});
test('Rutas a nuevos destinos del JSON y caso de prueba original',()=>{
 for(const code of ['A201','A202','A203','A204','A206','A222'])assert.ok(calculate(m,'A117',code).length,code);
 const r=calculate(m,'A117','A218');assert.equal(r.length,4);
 assert.deepEqual(new Set(calculate(m,'A117','A218','simple',true).map(r=>r.id)),new Set(['AS2']));
});
