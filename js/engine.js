/* SingItOut — audio engine: arranges syllables onto melodies and renders a full song offline */
(function(){
const L = SIO.lyrics;
const mtof = m => 440*Math.pow(2,(m-69)/12);
const SR = 44100;

// ---------------- Voices ----------------
const VOICES = [
  {id:'tenor',    name:'Pop Tenor',        emoji:'🎤', gender:'m', shift:0,   tilt:1.1,  breath:0.07, vib:32,  vibRate:5.6, vibDelay:0.22, jitter:6,  scoop:45,  glide:0.03},
  {id:'diva',     name:'Pop Diva',         emoji:'👸', gender:'f', shift:12,  tilt:1.2,  breath:0.12, vib:45,  vibRate:5.9, vibDelay:0.2,  jitter:6,  scoop:60,  glide:0.035, breathOut:true},
  {id:'soul',     name:'Soul Queen',       emoji:'💜', gender:'f', shift:9,   tilt:1.25, breath:0.16, vib:75,  vibRate:6.2, vibDelay:0.18, jitter:9,  scoop:140, scoopTau:0.09, glide:0.06, rough:0.08, fall:120},
  {id:'baritone', name:'Deep Baritone',    emoji:'🧔', gender:'m', shift:-12, tilt:1.25, breath:0.05, vib:35,  vibRate:5.2, jitter:5,  ring:0.35, scoop:30},
  {id:'crooner',  name:'Velvet Crooner',   emoji:'🕺', gender:'m', shift:-12, tilt:1.4,  breath:0.22, vib:45,  vibRate:5.0, vibDelay:0.3, jitter:7, scoop:90, scoopTau:0.08, glide:0.06, wet:0.38},
  {id:'operaT',   name:'Opera Tenor',      emoji:'🎭', gender:'m', shift:0,   tilt:0.95, breath:0.02, vib:70,  vibRate:6.0, vibDelay:0.1, jitter:4, ring:1.0, scoop:25, glide:0.04, wet:0.4},
  {id:'opera',    name:'Opera Soprano',    emoji:'👻', gender:'f', shift:12,  tilt:1.0,  breath:0.03, vib:95,  vibRate:6.0, vibDelay:0.1, jitter:4, ring:0.8, glide:0.05, wet:0.55},
  {id:'country',  name:'Country Twang',    emoji:'🤠', gender:'m', shift:0,   tilt:1.1,  breath:0.08, vib:20,  vibRate:5.5, jitter:8, twang:1.0, scoop:160, scoopTau:0.07, glide:0.07, fall:80},
  {id:'rock',     name:'Rock Screamer',    emoji:'🤘', gender:'m', shift:2,   tilt:0.85, breath:0.1,  vib:25,  vibRate:6.5, jitter:12, ring:0.6, rough:0.45, drive:3, scoop:110, fall:200},
  {id:'whisper',  name:'ASMR Whisper',     emoji:'🤫', gender:'f', shift:12,  whisper:true, breath:0.4, jitter:0, wet:0.15},
  {id:'kid',      name:'Kid Singer',       emoji:'🧒', gender:'c', shift:12,  tilt:1.05, breath:0.1,  vib:12,  vibRate:6,   jitter:14, scoop:40, glide:0.03},
  {id:'grandpa',  name:'Wobbly Grandpa',   emoji:'👴', gender:'m', shift:-5,  tilt:1.35, breath:0.25, vib:110, vibRate:4.4, vibDelay:0.05, jitter:30, shimmer:0.35, tremRate:4.4, rough:0.15, glide:0.06},
  {id:'gospel',   name:'Gospel Choir',     emoji:'🙌', gender:'f', shift:0,   tilt:1.15, breath:0.1,  vib:45,  vibRate:5.6, jitter:10, scoop:70, glide:0.04, wet:0.4,
     layers:[{g:1, semi:12},{g:0.6, harm:2, semi:12, det:-6},{g:0.55, harm:-3, semi:12, det:7},{g:0.7, gender:'m', semi:-12+12, det:4}]},
  {id:'choir',    name:'Barbershop Quartet',emoji:'💈', gender:'m', shift:0,  tilt:1.15, breath:0.06, vib:28,  vibRate:5.3, jitter:7, glide:0.035,
     layers:[{g:1},{g:0.6, harm:2, det:-5},{g:0.6, harm:-3, det:6},{g:0.65, semi:-12, det:3}]},
  {id:'duet',     name:'Power Duet',       emoji:'💑', gender:'m', shift:0,   tilt:1.1,  breath:0.08, vib:40,  vibRate:5.7, jitter:8, scoop:50, glide:0.04,
     layers:[{g:0.9},{g:0.8, semi:12, gender:'f', det:5}]},
  {id:'autotune', name:'Auto-Tune Star',   emoji:'🕶️', gender:'m', shift:5,   tilt:1.0,  breath:0.08, vib:0,   jitter:0, glide:0.002, ring:0.4,
     layers:[{g:0.8, det:-9},{g:0.8, det:9}]},
  {id:'chipmunk', name:'Chipmunk',         emoji:'🐿️', gender:'c', shift:17,  fscale:1.25, tilt:1.0, breath:0.05, vib:40, vibRate:8, jitter:8, glide:0.015},
  {id:'troll',    name:'Giant Troll',      emoji:'👹', gender:'m', shift:-19, fscale:0.75, tilt:1.3, breath:0.1, vib:15, vibRate:4, jitter:10, rough:0.3, glide:0.05},
  {id:'alien',    name:'Space Alien',      emoji:'👽', gender:'c', shift:7,   fscale:1.55, tilt:0.9, breath:0.05, vib:220, vibRate:9, jitter:0, ring:1, glide:0.08, wet:0.5},
  {id:'goat',     name:'Screaming Goat',   emoji:'🐐', gender:'f', shift:10,  fscale:1.2, tilt:0.9, breath:0.15, vib:160, vibRate:11, vibDelay:0.02, jitter:25, rough:0.35, drive:2,
     layers:[{g:1},{g:0.5, det:30}]},
  {id:'bit',      name:'8-Bit Robot',      emoji:'👾', gender:'m', shift:0,   wave:'square', tilt:1, breath:0, vib:0, jitter:0, glide:0.001},
  {id:'talky',    name:'Talky Human (beta)', emoji:'🗣️', tts:true},
];

// ---------------- Backing styles ----------------
const STYLES = [
  {id:'auto', name:'Song default', emoji:'🎼'},
  {id:'disco', name:'Disco', emoji:'🪩'},
  {id:'arp', name:'Chiptune', emoji:'🕹️'},
  {id:'oompah', name:'Polka', emoji:'🍺'},
  {id:'drama', name:'Orchestra', emoji:'🎻'},
  {id:'pad', name:'Dreamy', emoji:'☁️'},
  {id:'ragtime', name:'Saloon Piano', emoji:'🤠'},
  {id:'none', name:'A cappella', emoji:'🎤'},
];

const SCALES = {maj:[0,2,4,5,7,9,11], min:[0,2,3,5,7,8,10]};
const CHORDS = {
  maj:[{n:'I',r:0,q:[0,4,7],w:1.0},{n:'IV',r:5,q:[0,4,7],w:0.92},{n:'V',r:7,q:[0,4,7],w:0.95},{n:'vi',r:9,q:[0,3,7],w:0.75},{n:'ii',r:2,q:[0,3,7],w:0.7}],
  min:[{n:'i',r:0,q:[0,3,7],w:1.0},{n:'iv',r:5,q:[0,3,7],w:0.9},{n:'V',r:7,q:[0,4,7],w:0.95},{n:'VI',r:8,q:[0,4,7],w:0.75},{n:'III',r:3,q:[0,4,7],w:0.72},{n:'VII',r:10,q:[0,4,7],w:0.7}]
};

function harmonyThird(midi, key, mode){
  const sc = SCALES[mode]; const pc = ((midi-key)%12+12)%12;
  const idx = sc.indexOf(pc);
  if(idx<0) return midi+4;
  const up = sc[(idx+2)%7] + (idx+2>=7?12:0);
  return midi + (up - pc);
}

// ---------------- Arrangement ----------------
function arrange(song, words, opts){
  opts = opts||{};
  const tempo = opts.tempo||1;
  const flat = [];
  words.forEach((w,wi)=>w.syls.forEach((s,si)=>flat.push({w:wi, si, n:w.syls.length, text:s.text||'~', ph:s.ph})));
  if(!flat.length) flat.push({w:0,si:0,n:1,text:'la',ph:L.phonemize('la',{last:true,nSyl:1})});
  const MAXSYL = 360;
  const sylList = flat.slice(0, MAXSYL);
  const mel = song.parsed;
  const melBeats = mel.reduce((a,n)=>a+n.dur,0);
  const pickup = song.pickup||0, bpb = song.bpb;
  const loopLen = Math.ceil((melBeats - pickup)/bpb - 1e-6)*bpb;
  let loops = Math.max(1, Math.ceil(sylList.length / song.noteCount));
  if(song.accel) loops = Math.max(loops, 3);
  loops = Math.min(loops, 12);

  // tempo segments (beats → seconds)
  const baseSpb = 60/(song.bpm*tempo);
  const introBars = (bpb - pickup < 2 || bpb<=2) ? 2 : 1;
  const introStart = pickup - introBars*bpb; // in song beats (negative or zero)
  const segs = []; // {b0, spb}
  segs.push({b0:introStart, spb:baseSpb});
  for(let l=1;l<loops;l++){ const f = song.accel ? Math.pow(1.17,l) : 1; segs.push({b0:l*loopLen+pickup, spb:baseSpb/f}); }
  const endBeat = (loops-1)*loopLen + pickup + loopLen; // end of last bar
  const tailBars = 1;
  const finalEnd = endBeat + tailBars*bpb;
  const spbAt = b => { let s=segs[0].spb; for(const g of segs){ if(b>=g.b0-1e-9) s=g.spb; } return s; };
  const b2t = b => { let t=0; for(let i=0;i<segs.length;i++){ const g=segs[i], next=segs[i+1]; const e = next?Math.min(b,next.b0):b; if(e>g.b0) t+= (e-g.b0)*g.spb; if(!next||b<=next.b0) break; } return t; };

  // place notes
  const notes = []; let k=0;
  for(let l=0;l<loops;l++){
    let pos = l*loopLen;
    mel.forEach(n=>{
      if(!n.rest){
        const syl = sylList[k % sylList.length];
        notes.push({b:pos, bd:n.dur, midi:n.midi, syl, idx:k});
        k++;
      }
      pos += n.dur;
    });
  }
  // truncate overlaps and stretch the very last note to the end of song
  notes.sort((a,b)=>a.b-b.b);
  for(let i=0;i<notes.length-1;i++){ const nx=notes[i+1]; if(notes[i].b+notes[i].bd > nx.b) notes[i].bd = nx.b-notes[i].b; }
  const last = notes[notes.length-1]; last.bd = Math.max(last.bd, Math.min(endBeat + bpb*0.75, finalEnd) - last.b);
  notes.forEach(n=>{ n.t = b2t(n.b); n.dur = b2t(n.b+n.bd)-n.t; });

  // bars + chords
  const bars=[]; const mode=song.mode; let prevChord=null;
  for(let b=introStart; b<finalEnd-1e-6; b+=bpb){
    const isIntro = b < pickup - 1e-6 && b < 0 + 1e-6 && b+bpb <= pickup+1e-6;
    const isFinal = b >= endBeat-1e-6;
    let ch;
    if(isIntro||isFinal) ch = CHORDS[mode][0];
    else {
      let best=null, bs=-1;
      CHORDS[mode].forEach(c=>{
        let sc=0;
        notes.forEach(n=>{ const s=Math.max(n.b,b), e=Math.min(n.b+n.bd,b+bpb); if(e<=s) return;
          const pc=((n.midi-song.key-c.r)%12+12)%12; const w=(e-s)*(Math.abs(n.b-b)<1e-6?1.6:1);
          if(c.q.includes(pc)) sc+=w*(pc===0?1.15:1); else sc-=w*0.35; });
        sc*=c.w; if(prevChord===c) sc+=0.15;
        if(sc>bs){bs=sc;best=c;}
      });
      ch=best;
    }
    prevChord=ch;
    const rootPc = (song.key + ch.r)%12;
    bars.push({b, t:b2t(b), spb:spbAt(b+0.001), beats:bpb, rootPc, pcs:ch.q.map(x=>(rootPc+x)%12), chord:ch.n, isIntro, isFinal});
  }
  const beats=[]; bars.forEach(br=>{ for(let i=0;i<br.beats;i++) beats.push({t:b2t(br.b+i), down:i===0, intro:br.isIntro}); });

  // offset so intro starts at t=0
  const t0 = b2t(introStart);
  const shift = x=>x-t0;
  notes.forEach(n=>n.t=shift(n.t)); bars.forEach(b=>b.t=shift(b.t)); beats.forEach(b=>b.t=shift(b.t));
  const songEnd = shift(b2t(finalEnd));
  const firstNoteT = notes[0].t;

  // sung word occurrences + lines for karaoke
  const occ=[]; let cur=null;
  notes.forEach((n,i)=>{
    if(n.syl.si===0 || !cur || cur.w!==n.syl.w){ cur={w:n.syl.w, display:words[n.syl.w]?words[n.syl.w].display:n.syl.text, notes:[]}; occ.push(cur); }
    cur.notes.push(i); n.occ = occ.length-1;
  });
  const lines=[]; let line=[], len=0;
  occ.forEach((o,i)=>{
    const L2 = o.display.length+1;
    if(line.length && (len+L2>18 || line.length>=4)){ lines.push(line); line=[]; len=0; }
    line.push(i); len+=L2; o.line=lines.length;
    if(/[.!?]$/.test(o.display) && line.length>=2){ lines.push(line); line=[]; len=0; }
  });
  if(line.length) lines.push(line);
  // fix line idx after pushes
  lines.forEach((ln,li)=>ln.forEach(oi=>occ[oi].line=li));
  notes.forEach(n=>n.line=occ[n.occ].line);

  const midis = notes.map(n=>n.midi);
  return {song, notes, bars, beats, occ, lines, songEnd, firstNoteT, loops,
    minMidi:Math.min(...midis), maxMidi:Math.max(...midis), key:song.key, mode:song.mode, words};
}

// ---------------- Render (worker → PCM Float32Array) ----------------
let worker=null;
function getWorker(){
  if(worker===false) return null;
  if(!worker){ try{ worker=new Worker('js/dsp.js'); }catch(e){ worker=false; return null; } }
  return worker;
}
function buildPayload(arr, opts){
  const preset = VOICES.find(v=>v.id===opts.voice) || VOICES[0];
  const style = (opts.style && opts.style!=='auto') ? opts.style : arr.song.style;
  return {
    preset, style, ending: opts.ending||'big', transpose: opts.transpose||0, bells: opts.bells!==false,
    voiceRms: 0.2, key: arr.key, mode: arr.mode, songEnd: arr.songEnd, C: L.C,
    bars: arr.bars.map(b=>({t:b.t, spb:b.spb, beats:b.beats, rootPc:b.rootPc, pcs:b.pcs, isIntro:b.isIntro, isFinal:b.isFinal})),
    notes: arr.notes.map(n=>({t:n.t, dur:n.dur, midi:n.midi, ph:n.syl.ph, wordStart:n.syl.si===0}))
  };
}
function render(arr, opts){
  opts=opts||{};
  const payload = buildPayload(arr, opts);
  return new Promise((resolve,reject)=>{
    const w = getWorker();
    const fallback = ()=>{ setTimeout(()=>{ try{ resolve(SIO_DSP.renderSong(payload)); }catch(e){ reject(e); } }, 30); };
    if(!w) return fallback();
    const onMsg = e=>{ w.removeEventListener('message',onMsg); w.removeEventListener('error',onErr); if(e.data.ok) resolve(e.data.pcm); else { console.warn(e.data.error); fallback(); } };
    const onErr = e=>{ w.removeEventListener('message',onMsg); w.removeEventListener('error',onErr); worker=false; e.preventDefault&&e.preventDefault(); fallback(); };
    w.addEventListener('message',onMsg); w.addEventListener('error',onErr);
    w.postMessage(payload);
  });
}

// ---------------- WAV encoder ----------------
function encodeWav(pcm, sr){
  sr=sr||44100; const d=pcm, n=d.length;
  const ab=new ArrayBuffer(44+n*2), v=new DataView(ab);
  const w=(o,s)=>{for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i));};
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  let o=44; for(let i=0;i<n;i++,o+=2){ const s=Math.max(-1,Math.min(1,d[i])); v.setInt16(o, s<0?s*0x8000:s*0x7fff, true); }
  return new Blob([ab],{type:'audio/wav'});
}

SIO.engine = {VOICES, STYLES, arrange, render, encodeWav, mtof, harmonyThird};
})();
