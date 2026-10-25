import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceController} from '../shared/voice.js';
class Utterance {constructor(text){this.text=text}}
function mock() {
 const calls=[],api={
  speak:u=>{calls.push('speak');api.last=u},
  pause:()=>calls.push('pause'), resume:()=>calls.push('resume'),
  cancel:()=>calls.push('cancel'),
  getVoices:()=>[{lang:'es-AR',localService:true,name:'español'}]
 };
 const states=[];const voice=createVoiceController({synth:api,Utterance,onChange:s=>states.push(s)});
 return {api,calls,states,voice};
}
test('Pausar y reanudar no reinicia la lectura',()=>{
 const {api,calls,voice}=mock();
 assert.equal(voice.play('Avanzá por el pasillo.'),true);
 assert.equal(voice.state,'playing'); assert.equal(api.last.lang,'es-AR');
 assert.equal(voice.togglePause(),true); assert.equal(voice.state,'paused');
 assert.equal(voice.togglePause(),true); assert.equal(voice.state,'playing');
 assert.equal(calls.filter(x=>x==='speak').length,1);
 assert.deepEqual(calls.slice(-3),['speak','pause','resume']);
 api.last.onend();assert.equal(voice.state,'idle');
 assert.equal(voice.togglePause(),false);
});
test('Detener funciona estando en pausa y cancela la lectura',()=>{
 const {calls,voice}=mock();
 voice.play('Hola');voice.togglePause();voice.stop();
 assert.equal(voice.state,'idle'); assert.equal(calls.at(-1),'cancel');
 assert.equal(voice.togglePause(),false);
});
test('Un onend tardío de la lectura anterior no interrumpe la siguiente',()=>{
 const {api,voice}=mock();
 voice.play('Primera ruta');const anterior=api.last;
 voice.play('Segunda ruta');
 anterior.onend();
 assert.equal(voice.state,'playing');
 api.last.onend();assert.equal(voice.state,'idle');
});
test('Evento onstart retrasado no reanuda una lectura pausada',()=>{
 const {api,voice}=mock();voice.play('Ruta');voice.togglePause();
 api.last.onstart();assert.equal(voice.state,'paused');
});
test('Si el navegador no soporta voces, se deshabilita lectura',()=>{
 const voice=createVoiceController({synth:null,Utterance:null});
 assert.equal(voice.supported(),false);assert.equal(voice.play('Texto'),false);
 assert.equal(voice.state,'idle');
});
test('Error de síntesis libera el estado sin bloquear controles',()=>{
 const {api,voice}=mock();voice.play('Ruta');api.last.onerror({error:'voice-unavailable'});
 assert.equal(voice.state,'idle');
});
