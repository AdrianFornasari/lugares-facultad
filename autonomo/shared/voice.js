/** Control de síntesis de voz, desacoplado del navegador para permitir pruebas. */
export function createVoiceController({synth, Utterance, onChange=()=>{}}) {
  let state = 'idle';
  let active = null;
  const emit = next => { if (state !== next) {state = next; onChange(state);} };
  const supported = () => !!(synth && typeof synth.speak === 'function' && typeof Utterance === 'function');
  function stop() {
    // Desvincular antes de cancelar: algunos motores disparan onend sincrónicamente.
    active = null;
    try { synth?.cancel?.(); } catch {}
    emit('idle');
  }
  function play(message) {
    if (!supported() || !String(message||'').trim()) return false;
    stop();
    try {
      const u = new Utterance(String(message));
      u.lang='es-AR'; u.rate=0.9;
      const spanish = (synth.getVoices?.()||[]).find(v=>v.lang?.startsWith('es') && v.localService);
      if (spanish) u.voice=spanish;
      u.onstart=()=>{if(active===u && state!=='paused')emit('playing')};
      u.onpause=()=>{if(active===u)emit('paused')};
      u.onresume=()=>{if(active===u)emit('playing')};
      u.onend=()=>{if(active===u){active=null;emit('idle')}};
      u.onerror=()=>{if(active===u){active=null;emit('idle')}};
      active=u;
      emit('playing');
      synth.speak(u);
      return true;
    } catch {active=null;emit('idle');return false;}
  }
  function togglePause() {
    if (!active || !supported()) return false;
    try {
      if (state==='playing') {synth.pause();emit('paused');return true;}
      if (state==='paused') {synth.resume();emit('playing');return true;}
    } catch {return false;}
    return false;
  }
  return {play,stop,togglePause,supported,get state(){return state;}};
}
