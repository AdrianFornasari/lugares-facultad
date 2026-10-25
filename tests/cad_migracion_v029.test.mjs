import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate,validate,selectableSpaces,migrateCadV029} from '../shared/engine.js';
const m=JSON.parse(readFileSync(new URL('../public/data/model.json',import.meta.url)));
const m0=JSON.parse(readFileSync(new URL('../DATOS_IMPORTADOS_v0_2_6.json',import.meta.url)));
const DX=m.cad_migration.dx, DY=m.cad_migration.dy;
test('Modelo CAD conserva 62 destinos, 28 puertas en A1 y 34 A2',()=>{
 assert.deepEqual(validate(m),[]);
 assert.equal(selectableSpaces(m).length,62);
 assert.equal(selectableSpaces(m).filter(s=>s.floor==='A1').length,28);
 assert.equal(selectableSpaces(m).filter(s=>s.floor==='A2').length,34);
});
test('AS1 eliminado por inexistencia física, AS2 preservado y rutas sin escalones por AS2',()=>{
 assert.deepEqual(new Set(m.vertical_connections.map(c=>c.id)),new Set(['S1','S3','S4','AS2']));
 for(const f of ['A1','A2'])assert.ok(m.floors[f].landmarks.every(l=>l.label!=='AS1'));
 assert.deepEqual(calculate(m,'A117','A218','simple',true).map(r=>r.id),['AS2']);
 assert.equal(calculate(m,'A117','A218').length,4);
});
test('Migración idempotente y equivalencia de coordenadas desde ZIP anterior',()=>{
 const first=m.floors.A1.nodes.find(n=>n.id==='A1-N045');
 const old=m0.floors.A1.nodes.find(n=>n.id==='A1-N045');
 assert.ok(Math.abs((first.x_pdf_pt-old.x_pdf_pt)-DX)<.001);
 assert.ok(Math.abs((first.y_pdf_pt-old.y_pdf_pt)-DY)<.001);
 const clone=structuredClone(m);migrateCadV029(clone);assert.deepEqual(clone,m);
});
test('Importación de JSON anterior conserva puertas y aplica correctamente nueva geometría',()=>{
 const old=structuredClone(m0);migrateCadV029(old);
 assert.equal(selectableSpaces(old).length,62);
 assert.equal(old.vertical_connections.length,4);
 assert.equal(calculate(old,'A117','A218','simple',true).length,1);
});
test('A2 permanece sin calibración métrica, A1 utiliza escala gráfica',()=>{
 assert.equal(m.coordinate_system.distance_calibrated_A1,true);
 assert.equal(m.coordinate_system.A2_distance_calibrated,false);
 assert.ok(Math.abs(m.coordinate_system.A1_pdf_points_per_metre-8.612445)<1e-5);
});
