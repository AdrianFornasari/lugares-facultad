import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate,narrative,conectorLegible,lugarPlanta} from '../shared/engine.js';
const m=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url),'utf8'));
const text=(a,b,id)=>narrative(m,calculate(m,a,b).find(x=>x.id===id),a,b).join(' ');
test('A1 y A2 se muestran como planta baja y primer piso sin abreviaturas de planta',()=>{
 const a=text('A117','A218','S1');
 assert.match(a,/la planta baja/); assert.match(a,/el primer piso/);
 assert.doesNotMatch(a,/\b(?:A1|A2)\b/);
});
test('La escalera S3 se expresa como escalera 3 con descanso y ramas',()=>{
 const a=text('A117','A218','S3');
 assert.match(a,/escalera 3/);assert.match(a,/descanso/);assert.match(a,/ramas con escalones/);
 assert.doesNotMatch(a,/\bS3\b/);
});
test('En la ruta inversa S3 se incluyen los escalones al descanso',()=>{
 const a=text('A218','A117','S3');
 assert.match(a,/bajá por una de las dos ramas/i); assert.match(a,/descanso de la escalera 3/);
 assert.match(a,/planta baja/);assert.doesNotMatch(a,/\bS3\b/);
});
test('AS2 se denomina ascensor 2, en ambos sentidos',()=>{
 for(const id of ['AS2']){
  for(const [a,b] of [['A117','A218'],['A218','A117']]){
   const route=text(a,b,id);
   assert.match(route,new RegExp('ascensor '+id.slice(2)));
   assert.doesNotMatch(route,/\b(?:AS1|AS2)\b/);
  }
 }
});
test('Las otras escaleras se denominan escalera 1 y 4',()=>{
 for(const id of ['S1','S4']){
  const route=text('A117','A218',id);
  assert.match(route,new RegExp('escalera '+id.slice(1)));
  assert.doesNotMatch(route,/\b(?:S1|S4)\b/);
 }
});
test('Misma planta también se presenta sin código de planta',()=>{
 const r=calculate(m,'A117','A124').find(x=>x.id==='Misma planta');
 const txt=narrative(m,r,'A117','A124').join(' ');
 assert.match(txt,/planta baja/);assert.doesNotMatch(txt,/\bA1\b/);
});
test('Los identificadores internos se mantienen sin modificar',()=>{
 assert.equal(conectorLegible('S3'),'escalera 3');
 assert.equal(conectorLegible('AS1'),'ascensor 1');
 assert.equal(lugarPlanta('A1'),'la planta baja');
 assert.equal(lugarPlanta('A2'),'el primer piso');
 assert.equal(m.floors.A1.nodes.length,101);assert.equal(m.floors.A2.nodes.length,109);
});

test('Gramática del español en los conectores existentes y ambas direcciones',()=>{
 for(const [a,b] of [['A117','A218'],['A218','A117']]){
  for(const r of calculate(m,a,b)){
   const t=narrative(m,r,a,b).join(' ');
   assert.doesNotMatch(t,/\bel escalera\b|\bde el primer piso\b|\bde la ascensor\b/);
   assert.doesNotMatch(t,/\bA1\b|\bA2\b|\bAS1\b|\bAS2\b|\bS1\b|\bS3\b|\bS4\b/);
  }
 }
});
