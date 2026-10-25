import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {calculate,narrative,validate,spaceOf} from '../shared/engine.js';
const m=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
test('Modelo geométrico íntegro',()=>assert.deepEqual(validate(m),[]));
test('A1/A2 y 67 espacios',()=>{assert.equal(m.spaces_catalog.length,67);assert.equal(m.floors.A1.nodes.length,101);assert.equal(m.floors.A2.nodes.length,109)});
test('A117 y A218 son las puertas verificadas',()=>{assert.equal(spaceOf(m,'A117').door_validation,'confirmada_por_usuario');assert.equal(spaceOf(m,'A218').door_validation,'confirmada_por_usuario')});
test('4 rutas por S1/S3/S4/AS2',()=>{const r=calculate(m,'A117','A218');assert.deepEqual(new Set(r.map(x=>x.id)),new Set(['S1','S3','S4','AS2']));for(const x of r){assert.equal(x.legs[0].nodes[0],spaceOf(m,'A117').door_node_id);assert.equal(x.legs.at(-1).nodes.at(-1),spaceOf(m,'A218').door_node_id)}});
test('Sin escalones: solamente ascensores',()=>{assert.deepEqual(new Set(calculate(m,'A117','A218','simple',true).map(x=>x.id)),new Set(['AS2']))});
test('S3 pasa por escalera con descanso',()=>{const x=calculate(m,'A117','A218').find(x=>x.id==='S3');assert.match(narrative(m,x,'A117','A218').join(' '),/descanso/);assert.ok(x.legs[1].edges.some(id=>m.floors.A2.edges.find(e=>e.id===id).segment_type==='stair_flight'))});
test('Ruta inversa vuelve a A117',()=>{for(const x of calculate(m,'A218','A117'))assert.equal(x.legs.at(-1).nodes.at(-1),spaceOf(m,'A117').door_node_id)});
test('A222 tiene puerta asignada en JSON del usuario',()=>assert.ok(calculate(m,'A117','A222').length>0));
test('Asignaciones vigentes',()=>{assert.equal(spaceOf(m,'A222').name,'Sala de Informática');assert.equal(spaceOf(m,'A224').name,'Oficina de Formación Docente');assert.equal(spaceOf(m,'A227').name,'Doctorado');assert.equal(spaceOf(m,'A225').assignment_status,'sin_asignacion');});
test('Correcciones de catálogo y puertas confirmadas',()=>{
 assert.equal(spaceOf(m,'A126').name,'Aula C Preventiva');
 assert.equal(spaceOf(m,'A126').door_node_id,'A1-N010');
 assert.equal(spaceOf(m,'A124').name,'Histología ME');
 for(const [code,node] of [['A124','A1-N032'],['WC-H-PB','A1-N028'],['WC-M-PB','A1-N029']]){
   const s=spaceOf(m,code);assert.equal(s.door_node_id,node);assert.equal(s.door_validation,'confirmada_por_usuario');
 }
 assert.equal(spaceOf(m,'WC-H-PB').code_type,'interno_sin_codigo_senaletico');
 assert.equal(spaceOf(m,'WC-M-PB').code_type,'interno_sin_codigo_senaletico');
});
test('Las puertas nuevas y A126 vinculado permiten rutas',()=>{
 for(const code of ['A124','WC-H-PB','WC-M-PB'])assert.ok(calculate(m,'A117',code).length>0,code);
 assert.ok(calculate(m,'A117','A126').length>0);
});
test('S2 ausente de conectores verticales',()=>assert.ok(m.vertical_connections.every(x=>x.id!=='S2')));
