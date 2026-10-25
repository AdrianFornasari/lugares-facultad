import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assignDoorAssisted,undoDoorAction,unlinkDoorAssisted,doorProgress,unassignedSpaces,pendingDoorNodes,spaceOf,validate,calculate} from '../shared/engine.js';
const original=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
const load=()=>structuredClone(original);
test('progreso por planta conserva las asignaciones confirmadas y excluye A223/A225',()=>{
 const a=doorProgress(original,'A1'),b=doorProgress(original,'A2');
 assert.deepEqual([a.total,a.linked,a.pending],[29,28,1]);
 assert.deepEqual([b.total,b.linked,b.pending],[36,34,2]);
 assert.ok(!unassignedSpaces(original,'A2').some(s=>['A223','A225'].includes(s.code)));
 assert.ok(unassignedSpaces(original,'A1').some(s=>s.code==='A129'));
});
test('asignación verificada, progreso y deshacer preservan las rutas',()=>{
 const m=load(),node=pendingDoorNodes(m,'A1')[0];assert.ok(node);
 const previousRoutes=calculate(m,'A117','A218').map(r=>r.id);
 const action=assignDoorAssisted(m,'A1',node,'A129',true);
 assert.equal(spaceOf(m,'A129').door_node_id,node);
 assert.equal(spaceOf(m,'A129').door_validation,'confirmada_por_usuario');
 assert.equal(doorProgress(m,'A1').linked,29);
 assert.ok(calculate(m,'A117','A129').length>=1);
 assert.deepEqual(calculate(m,'A117','A218').map(r=>r.id),previousRoutes);
 assert.ok(!pendingDoorNodes(m,'A1').includes(node));
 assert.deepEqual(validate(m),[]);
 undoDoorAction(m,action);
 assert.equal(spaceOf(m,'A129').door_node_id,null);
 assert.equal(doorProgress(m,'A1').linked,28);
});
test('asignación sin casilla no se declara verificada',()=>{
 const m=load(); const node=pendingDoorNodes(m,'A1')[0];
 assignDoorAssisted(m,'A1',node,'A129',false);
 assert.equal(spaceOf(m,'A129').door_validation,'pendiente');
});
test('rechaza doble vínculo, planta incorrecta, cruces y códigos sin asignación',()=>{
 const m=load(),node=pendingDoorNodes(m,'A1')[0];
 assert.throws(()=>assignDoorAssisted(m,'A1',node,'A223'),/no está habilitada/);
 assert.throws(()=>assignDoorAssisted(m,'A2',node,'A129'),/no pertenece/);
 assert.throws(()=>assignDoorAssisted(m,'A1','A1-N044','A129'),/nodo amarillo/);
 assert.throws(()=>assignDoorAssisted(m,'A1','A1-N045','A129'),/ya está asignado/);
 assert.throws(()=>assignDoorAssisted(m,'A1',node,'A117'),/ya tiene una puerta/);
 assignDoorAssisted(m,'A1',node,'A129');
 assert.throws(()=>assignDoorAssisted(m,'A1',node,'A103'),/ya tiene una puerta/);
});
test('desvincular y deshacer restaura exactamente los datos previos',()=>{
 const m=load(),before=structuredClone(spaceOf(m,'A201'));
 const action=unlinkDoorAssisted(m,'A201');
 assert.equal(spaceOf(m,'A201').door_node_id,null);
 assert.equal(doorProgress(m,'A2').linked,33);
 undoDoorAction(m,action);
 assert.deepEqual(spaceOf(m,'A201'),before);
});
test('ediciones del usuario se conservan y el ZIP no debe tocar la geometría',()=>{
 const m=load();
 assert.equal(m.floors.A2.nodes.find(n=>n.id==='A2-N036').x_pdf_pt,424.33);
 assert.equal(spaceOf(m,'A222').door_node_id,'A2-N036');
 assert.equal(spaceOf(m,'A218').door_node_id,'A2-N043');
});
