import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {searchDestinations,selectableSpaces,calculate,narrative,assignDoorAssisted,pendingDoorNodes,undoDoorAction} from '../shared/engine.js';
const baseline=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(baseline);
test('buscador incluye solo las 62 puertas asociadas',()=>{
 assert.equal(searchDestinations(baseline,'').total,62);
 assert.equal(selectableSpaces(baseline).length,62);
 assert.equal(searchDestinations(baseline,'A129').total,0);
 assert.equal(searchDestinations(baseline,'A224').total,0);
 assert.ok(searchDestinations(baseline,'A117').items.some(x=>x.code==='A117'));
});
test('buscador tolera tildes, mayúsculas y fragmentos del nombre',()=>{
 const picked=searchDestinations(baseline,'informatica');
 assert.ok(picked.items.some(x=>x.code==='A222'));
 const aula=searchDestinations(baseline,'aula');
 assert.ok(aula.total>2);
 assert.equal(searchDestinations(baseline,'zzzz-cadena-inexistente').total,0);
});
test('buscador responde a la asignación y deshacer una puerta en vivo',()=>{
 const m=clone(),n=pendingDoorNodes(m,'A1')[0];assert.ok(n);
 assert.equal(searchDestinations(m,'A129').total,0);
 const act=assignDoorAssisted(m,'A1',n,'A129',true);
 assert.equal(searchDestinations(m,'A129').total,1);
 undoDoorAction(m,act);
 assert.equal(searchDestinations(m,'A129').total,0);
});
test('guía manual conserva el itinerario completo y sus instrucciones sin inventar giros',()=>{
 const r=calculate(baseline,'A117','A218').find(x=>x.id==='S3');assert.ok(r);
 const steps=narrative(baseline,r,'A117','A218');
 assert.ok(steps.length>=4);
 assert.ok(steps[steps.length-1].includes('experimental'));
 const accessible=calculate(baseline,'A117','A218','simple',true);
 assert.deepEqual(new Set(accessible.map(x=>x.id)),new Set(['AS2']));
});
