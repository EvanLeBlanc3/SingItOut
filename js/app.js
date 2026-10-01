/* SingItOut — app glue: UI, playback, saving, sharing */
(function(){
const $ = id => document.getElementById(id);
const E = SIO.engine, V = SIO.visuals;
const pick = a => a[Math.floor(Math.random()*a.length)];

// enable :active on iOS + press feedback
document.addEventListener('touchstart', ()=>{}, {passive:true});
document.addEventListener('pointerdown', e=>{ const b=e.target.closest('button,.chip,.song'); if(b){ b.classList.add('pressed'); setTimeout(()=>b.classList.remove('pressed'),160);} });
// block pinch-zoom gestures on iOS
['gesturestart','gesturechange'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault()));

const INSPIRE = [
  "My printer is broken again and the toaster is screaming at me. Please send snacks.",
  "Happy birthday to the coolest person in the office, you smell like victory and printer ink!",
  "I have forty seven browser tabs open and I am scared to close any of them.",
  "Have you tried turning it off and on again? No? Then why are you calling me?",
  "My cat sat on the keyboard and now I am the CEO of a llama farm.",
  "Monday morning coffee is my only friend and it is lukewarm and disappointed in me.",
  "The wifi password is on the fridge, under the pizza magnet, next to my shattered dreams.",
  "Roses are red, violets are blue, I ate the last donut, and I'd do it again too.",
  "Dear diary, today I reset forty passwords and someone called the mouse a clicky thing.",
  "I put on my gym clothes, looked in the mirror, and took a nap instead. Champion.",
  "Who keeps microwaving fish in the break room? I just want to talk.",
  "My vinyl collection is two hundred forty four albums deep and my wallet is crying.",
];
const LOAD_MSGS = ["Warming up the robot's vocal cords…","Teaching the singer to read…","Bribing the backing band with pizza…","Tuning the kazoo section…","Auto-tuning your feelings…","Asking Beethoven for permission… (he said no)","Inflating the disco ball…","Feeding syllables into the song blender…","Polishing the microphone…","Rehearsing dramatic pauses…"];
const ENDINGS = [
  {id:'random', name:'Surprise', emoji:'🎲'},
  {id:'big', name:'Standing Ovation', emoji:'👏'},
  {id:'sting', name:'Mic Drop', emoji:'🎤'},
  {id:'fail', name:'Tomato Toss', emoji:'🍅'},
  {id:'none', name:'Just End', emoji:'🛑'},
];
const CHAOS = ['Chill 😌','Fun 😄','Wild 🤪','UNHINGED 🤯'];

// portrait lock: figure out which way the phone is tilted so we can counter-rotate
function orient(){
  let a = (typeof window.orientation==='number') ? window.orientation : (screen.orientation ? (screen.orientation.angle===270 ? -90 : screen.orientation.angle) : 0);
  document.documentElement.classList.toggle('rot-cw', a===-90 || a===270);
  setTimeout(()=>{ if(current&&current.stage) current.stage.resize(); },60);
}
window.addEventListener('orientationchange',orient); window.addEventListener('resize',orient); orient();

// ---------------- state ----------------
const DEFAULT = {cat:'All', text:'', song:'bday', voice:'tenor', fx:'song', lyric:'random', style:'auto', ending:'random', chaos:2, tempo:100, pitch:0, bells:true};
let st = Object.assign({}, DEFAULT);
try{ Object.assign(st, JSON.parse(localStorage.getItem('sio_state')||'{}')); }catch(e){}
const save = ()=>{ try{ localStorage.setItem('sio_state', JSON.stringify(st)); }catch(e){} };

function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.h); toast.h=setTimeout(()=>t.classList.remove('show'),2200); }

// ---------------- build UI ----------------
function chipRow(container, items, key, extra){
  const c=$(container); c.innerHTML='';
  items.forEach(it=>{ const b=document.createElement('button'); b.className='chip'+(st[key]===it.id?' sel':''); b.innerHTML=`<span>${it.emoji}</span>${it.name}`; b.onclick=()=>{ st[key]=it.id; save(); [...c.children].forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); extra&&extra(it); }; c.appendChild(b); });
  const sel=c.querySelector('.sel'); if(sel && c.classList.contains('scroll')) setTimeout(()=>{ c.scrollLeft = sel.offsetLeft - 20; },50);
}
const CATS=[{id:'All',name:'All',emoji:'🎼'},{id:'Party',name:'Party',emoji:'🥳'},{id:'Classical',name:'Classical',emoji:'🎻'},{id:'Kids',name:'Kids',emoji:'🧸'},{id:'Folk',name:'Folk',emoji:'🪕'},{id:'Holiday',name:'Holiday',emoji:'🎄'}];
function buildSongs(filter){
  const g=$('songGrid'); g.innerHTML=''; const f=(filter||'').toLowerCase();
  SIO.songs.filter(s=>(!f || (s.title+' '+s.composer).toLowerCase().includes(f)) && (f || st.cat==='All' || s.cat===st.cat)).forEach(s=>{
    const b=document.createElement('button'); b.className='song'+(st.song===s.id?' sel':''); b.dataset.id=s.id;
    b.innerHTML=`<div class="e">${s.emoji}</div><div class="t">${s.title}</div><div class="c">${s.composer}</div>`;
    b.onclick=()=>{ st.song=s.id; save(); [...g.children].forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); };
    g.appendChild(b);
  });
  $('songCount').textContent = `(${SIO.songs.length} templates)`;
}
function buildAll(){
  $('txt').value=st.text; updateCount();
  chipRow('catChips', CATS, 'cat', ()=>{ $('songSearch').value=''; buildSongs(''); });
  buildSongs('');
  setTimeout(()=>{ const s=$('songGrid').querySelector('.sel'); if(s) $('songGrid').scrollTop = s.offsetTop-60; },60);
  chipRow('voiceChips', E.VOICES, 'voice', voiceHint); voiceHint();
  const fxItems=[{id:'song',name:'Song pick',emoji:'🎼'},{id:'random',name:'Surprise',emoji:'🎲'}].concat(Object.keys(V.FX).map(k=>({id:k,name:V.FX[k].name,emoji:V.FX[k].emoji})));
  chipRow('fxChips', fxItems, 'fx');
  const lyItems=[{id:'random',name:'Surprise',emoji:'🎲'}].concat(Object.keys(V.LY).map(k=>({id:k,name:V.LY[k].name,emoji:V.LY[k].emoji})));
  chipRow('lyChips', lyItems, 'lyric');
  chipRow('styleChips', E.STYLES, 'style');
  chipRow('endChips', ENDINGS, 'ending');
  const sl=(id,lbl,fmt)=>{ const el=$(id); el.value=st[id]; const up=()=>{ st[id]=+el.value; $(lbl).textContent=fmt(+el.value); save(); }; el.oninput=up; up(); };
  sl('chaos','chaosLbl',v=>CHAOS[v]); sl('tempo','tempoLbl',v=>v+'%'); sl('pitch','pitchLbl',v=>(v>0?'+':'')+v+' semitones');
  $('bells').checked=st.bells; $('bells').onchange=e=>{ st.bells=e.target.checked; save(); };
}
function voiceHint(){ const v=E.VOICES.find(x=>x.id===st.voice); $('voiceHint').textContent = v&&v.tts ? "🗣️ Talky Human uses your iPhone's built-in speech voice, so timing is gloriously wobbly. Shared audio files will include the band but not the talking (iOS doesn't allow recording it)." : "Every singer is synthesized live on your phone — fully offline, perfectly pitched, with real breath, vibrato and vowel shaping. Tap 👂 to audition."; }
function updateCount(){ $('count').textContent = `${$('txt').value.length}/500`; }
$('txt').addEventListener('input',()=>{ st.text=$('txt').value; updateCount(); save(); });
$('btnInspire').onclick=()=>{ let t; do{ t=pick(INSPIRE);}while(t===st.text && INSPIRE.length>1); $('txt').value=t; st.text=t; updateCount(); save(); };
$('btnClear').onclick=()=>{ $('txt').value=''; st.text=''; updateCount(); save(); $('txt').focus(); };
$('songSearch').addEventListener('input',e=>buildSongs(e.target.value));
$('btnRandSong').onclick=()=>{ const s=pick(SIO.songs); st.song=s.id; st.cat='All'; chipRow('catChips', CATS, 'cat', ()=>{ $('songSearch').value=''; buildSongs(''); }); save(); $('songSearch').value=''; buildSongs(''); const el=$('songGrid').querySelector('.sel'); if(el) $('songGrid').scrollTop=el.offsetTop-60; toast(`${s.emoji} ${s.title}`); };

// tabs
function showTab(which){
  $('screenCreate').classList.toggle('active', which==='create'); $('screenHits').classList.toggle('active', which==='hits');
  $('tabCreate').classList.toggle('active', which==='create'); $('tabHits').classList.toggle('active', which==='hits');
  if(which==='hits') renderHits();
}
$('tabCreate').onclick=()=>showTab('create'); $('tabHits').onclick=()=>showTab('hits');

// ---------------- audio ----------------
let actx=null;
function unlockAudio(){
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  if(!actx){ const AC=window.AudioContext||window.webkitAudioContext; actx=new AC(); }
  if(actx.state!=='running') actx.resume();
  // tiny silent blip unlocks iOS output
  const b=actx.createBuffer(1,1,22050); const s=actx.createBufferSource(); s.buffer=b; s.connect(actx.destination); s.start(0);
  if('speechSynthesis' in window && E.VOICES.find(v=>v.id===st.voice).tts){ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); }
}
let current=null; // {arr, pcm, opts, src, stage, startAt, ttsTimers}
function stopPlayback(){
  if(!current) return;
  try{ current.src && current.src.stop(); }catch(e){}
  current.stage && current.stage.stop();
  (current.ttsTimers||[]).forEach(clearTimeout); current.ttsTimers=[];
  if('speechSynthesis' in window) speechSynthesis.cancel();
}

function resolveOpts(o){
  const song=SIO.songs.find(s=>s.id===o.song)||SIO.songs[0];
  const fxKeys=Object.keys(V.FX), lyKeys=Object.keys(V.LY);
  return {
    song, voice:o.voice, style:o.style, chaos:o.chaos, tempo:o.tempo/100, transpose:o.pitch, bells:o.bells,
    fx: o.fx==='song' ? (V.FX[song.fx]?song.fx:pick(fxKeys)) : o.fx==='random' ? pick(fxKeys) : o.fx,
    lyric: o.lyric==='random' ? pick(lyKeys) : o.lyric,
    ending: o.ending==='random' ? pick(['big','big','sting','sting','fail']) : o.ending,
  };
}

async function sing(fromHit){
  const o = fromHit || st;
  const text = (o.text||'').trim();
  if(!text){ toast('✍️ Write something first, maestro!'); $('txt').focus(); return; }
  unlockAudio();
  const R = resolveOpts(o);
  const words = SIO.lyrics.analyze(text);
  if(!words.length){ toast('Hmm, I need some actual words to sing!'); return; }
  const arr = E.arrange(R.song, words, {tempo:R.tempo});
  $('loading').classList.remove('hidden');
  let mi=0; $('loadMsg').textContent=pick(LOAD_MSGS); const msgT=setInterval(()=>{ $('loadMsg').textContent=LOAD_MSGS[(mi++)%LOAD_MSGS.length]; },900);
  const t0=performance.now();
  let pcm;
  try{ pcm = await E.render(arr, {voice:R.voice, style:R.style, ending:R.ending, transpose:R.transpose, bells:R.bells}); }
  catch(e){ clearInterval(msgT); $('loading').classList.add('hidden'); toast('😵 The robot choked: '+e.message); return; }
  const wait = Math.max(0, 700-(performance.now()-t0)); await new Promise(r=>setTimeout(r,wait));
  clearInterval(msgT); $('loading').classList.add('hidden');
  stopPlayback();
  current = {arr, pcm, R, src:o, text};
  perform();
}

function perform(){
  const c=current; if(!c) return;
  stopPlayback();
  $('perf').classList.remove('hidden'); $('perfControls').classList.add('hidden');
  const fin=$('finale'); fin.className='finale'; fin.innerHTML='';
  const v=E.VOICES.find(x=>x.id===c.R.voice);
  $('perfTitle').textContent = `${c.R.song.emoji} ${c.R.song.title} · ${v.emoji} ${v.name}`;
  const stageEl=$('stage'); stageEl.className='stage';
  const stage = new V.Stage(stageEl, c.arr, {fx:c.R.fx, lyric:c.R.lyric, chaos:c.R.chaos});
  c.stage=stage;
  if(actx.state!=='running') actx.resume();
  const buf = actx.createBuffer(1, c.pcm.length, 44100); buf.getChannelData(0).set(c.pcm);
  const src = actx.createBufferSource(); src.buffer=buf; src.connect(actx.destination);
  const startAt = actx.currentTime+0.12; src.start(startAt); c.src=src;
  const lat = (actx.outputLatency||0) + (actx.baseLatency||0);
  const getT = ()=> actx.currentTime - startAt - lat;
  stage.onProgress = p=>{ $('prog').style.width = Math.min(100,p*100)+'%'; };
  stage.start(getT, ()=>{
    V.finale(fin, c.R.ending, ()=>$('perfControls').classList.remove('hidden'));
  });
  if(v.tts) scheduleTTS(c, startAt);
}

function scheduleTTS(c, startAt){
  if(!('speechSynthesis' in window)){ toast('No speech voice available — enjoy the instrumental!'); return; }
  const arr=c.arr; const center=(arr.minMidi+arr.maxMidi)/2;
  const voices=speechSynthesis.getVoices(); const en=voices.find(v=>/en[-_]US/i.test(v.lang)&&/Samantha|Alex|Daniel|Fred/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang));
  c.ttsTimers=[];
  const base=(startAt-actx.currentTime)*1000;
  arr.occ.forEach(o=>{
    const first=arr.notes[o.notes[0]], last=arr.notes[o.notes[o.notes.length-1]];
    const dur=last.t+last.dur-first.t;
    const u=new SpeechSynthesisUtterance(o.display.replace(/[^\w' ]/g,''));
    if(en) u.voice=en;
    u.pitch=Math.max(0.1,Math.min(2,1+(first.midi+c.R.transpose-center)/12));
    u.rate=Math.max(0.6,Math.min(2.2,(o.notes.length*0.3)/Math.max(0.15,dur)));
    c.ttsTimers.push(setTimeout(()=>speechSynthesis.speak(u), base+first.t*1000-60));
  });
}

$('btnSing').onclick=()=>sing();
$('btnClose').onclick=()=>{ stopPlayback(); $('perf').classList.add('hidden'); };
$('btnReplay').onclick=()=>perform();
const remix=()=>{ if(!current) return; const fxKeys=Object.keys(V.FX), lyKeys=Object.keys(V.LY);
  let f,l; do{ f=pick(fxKeys);}while(f===current.R.fx); do{ l=pick(lyKeys);}while(l===current.R.lyric);
  current.R.fx=f; current.R.lyric=l; toast(`${V.FX[f].emoji} ${V.FX[f].name} + ${V.LY[l].emoji} ${V.LY[l].name}`); perform(); };
$('btnRemix').onclick=remix; $('btnRemix2').onclick=remix;
$('btnEdit').onclick=()=>{ stopPlayback(); $('perf').classList.add('hidden'); showTab('create'); };

// preview song (instrumental + bells)
$('btnPreview').onclick=async()=>{
  unlockAudio(); const song=SIO.songs.find(s=>s.id===st.song);
  toast(`👂 ${song.emoji} ${song.title}`);
  const words=SIO.lyrics.analyze('la');
  const arr=E.arrange(song, words, {tempo:st.tempo/100});
  const pcm=await E.render(arr,{voice:'talky', style:st.style, ending:'none', transpose:st.pitch});
  if(previewSrc){ try{previewSrc.stop();}catch(e){} }
  const buf=actx.createBuffer(1,pcm.length,44100); buf.getChannelData(0).set(pcm);
  previewSrc=actx.createBufferSource(); previewSrc.buffer=buf; previewSrc.connect(actx.destination); previewSrc.start();
};
let previewSrc=null;
const HEAR_LINES=['Hello there, I am your singer and I am ready to sing it out','Pick me, pick me, I can sing anything you want','La la la, listen to my beautiful voice'];
$('btnHear').onclick=async()=>{
  unlockAudio(); const v=E.VOICES.find(x=>x.id===st.voice);
  if(v.tts){ const u=new SpeechSynthesisUtterance('Hi! I am the talky human. I talk to the beat, sort of.'); speechSynthesis.cancel(); speechSynthesis.speak(u); return; }
  toast(`👂 ${v.emoji} ${v.name} warming up…`);
  const song=SIO.songs.find(s=>s.id==='ode'); const arr=E.arrange(song, SIO.lyrics.analyze(pick(HEAR_LINES)), {tempo:1.1});
  // only the first ~7 seconds
  arr.notes=arr.notes.filter(n=>n.t<7.5); arr.bars=arr.bars.filter(b=>b.t<7.5); arr.songEnd=Math.min(arr.songEnd,8);
  const pcm=await E.render(arr,{voice:v.id, style:'pad', ending:'none', transpose:st.pitch, bells:false});
  if(previewSrc){ try{previewSrc.stop();}catch(e){} }
  const buf=actx.createBuffer(1,pcm.length,44100); buf.getChannelData(0).set(pcm);
  previewSrc=actx.createBufferSource(); previewSrc.buffer=buf; previewSrc.connect(actx.destination); previewSrc.start();
};

// ---------------- video export ----------------
let vidJob=null, vidResult=null;
function vidName(){ return `SingItOut - ${current.R.song.title} - ${current.text.split(/\s+/).slice(0,4).join(' ').replace(/[^\w ]/g,'')}`; }
$('btnVideo').onclick=async()=>{
  if(!current) return;
  if(!SIO.video.supported()){ toast('😢 This browser can\'t record video. Update iOS to 15+ and use Safari.'); return; }
  const v=E.VOICES.find(x=>x.id===current.R.voice);
  if(v.tts) toast('ℹ️ Talky Human\'s speech can\'t be recorded — the video will have the band + bells only.');
  stopPlayback(); unlockAudio();
  $('vid').classList.remove('hidden'); $('vidPreview').classList.add('hidden'); $('vidMount').classList.remove('hidden');
  $('vidRecBtns').classList.remove('hidden'); $('vidDoneBtns').classList.add('hidden');
  $('vidTitle').textContent='🎬 Recording your music video…'; $('vidStatus').textContent='Keep the app open — it records in real time.'; $('vidProg').style.width='0%';
  vidJob=SIO.video.record({actx, pcm:current.pcm, arr:current.arr, R:current.R, voice:v, mount:$('vidMount'), onProgress:p=>{ $('vidProg').style.width=(p*100).toFixed(1)+'%'; $('vidStatus').textContent=`Recording… ${Math.round(p*100)}% — keep the app open`; }});
  try{
    vidResult=await vidJob.promise; vidJob=null;
    const url=URL.createObjectURL(vidResult.blob); const pv=$('vidPreview'); pv.src=url; pv.classList.remove('hidden'); $('vidMount').classList.add('hidden'); $('vidMount').innerHTML='';
    $('vidRecBtns').classList.add('hidden'); $('vidDoneBtns').classList.remove('hidden');
    $('vidTitle').textContent='🎉 Your music video is ready!'; $('vidStatus').textContent=`${(vidResult.blob.size/1048576).toFixed(1)} MB · ${vidResult.ext.toUpperCase()}`; $('vidProg').style.width='100%';
  }catch(e){ vidJob=null; $('vid').classList.add('hidden'); if(e.message!=='cancelled') toast('😵 Video failed: '+e.message); }
};
$('btnVidCancel').onclick=()=>{ if(vidJob) vidJob.cancel(); };
$('btnVidClose').onclick=()=>{ const pv=$('vidPreview'); pv.pause(); $('vid').classList.add('hidden'); };
$('btnVidSave').onclick=async()=>{
  if(!vidResult) return; const pv=$('vidPreview'); pv.pause();
  const file=new File([vidResult.blob], vidName()+'.'+vidResult.ext, {type:vidResult.type});
  try{ if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:'SingItOut'}); return; } }catch(e){ if(e.name==='AbortError') return; }
  $('btnVidDownload').click();
};
$('btnVidDownload').onclick=()=>{ if(!vidResult) return; const a=document.createElement('a'); a.href=URL.createObjectURL(vidResult.blob); a.download=vidName()+'.'+vidResult.ext; document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),1000); toast('⬇️ Downloading video…'); };

// share / download
$('btnShare').onclick=async()=>{ /* audio-only export */
  if(!current) return;
  const name = `SingItOut - ${current.R.song.title} - ${current.text.split(/\s+/).slice(0,4).join(' ').replace(/[^\w ]/g,'')}.wav`;
  const blob = E.encodeWav(current.pcm, 44100);
  const file = new File([blob], name, {type:'audio/wav'});
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:'SingItOut', text:'I made a song. I am so sorry. 🎤'}); return; }
  }catch(e){ if(e.name==='AbortError') return; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
  toast('💾 Audio file downloaded');
};

// ---------------- hits ----------------
const loadHits=()=>{ try{ return JSON.parse(localStorage.getItem('sio_hits')||'[]'); }catch(e){ return []; } };
const saveHits=h=>{ try{ localStorage.setItem('sio_hits', JSON.stringify(h)); }catch(e){ toast('Storage full?!'); } };
$('btnSave').onclick=()=>{
  if(!current) return; const h=loadHits(); const o=current.src;
  const hit={id:Date.now(), title:current.text.split(/\s+/).slice(0,5).join(' '), text:current.text, song:current.R.song.id, voice:current.R.voice, style:o.style, fx:current.R.fx, lyric:current.R.lyric, ending:current.R.ending, chaos:o.chaos, tempo:o.tempo, pitch:o.pitch, bells:o.bells, date:new Date().toISOString()};
  h.unshift(hit); saveHits(h); toast('⭐ Saved to My Hits!');
};
function renderHits(){
  const h=loadHits(), L=$('hitsList'); L.innerHTML='';
  if(!h.length){ L.innerHTML='<div class="empty">No hits yet! 🎤<br>Make a song and tap ⭐ Save after the show.</div>'; return; }
  h.forEach(hit=>{
    const s=SIO.songs.find(x=>x.id===hit.song)||SIO.songs[0]; const v=E.VOICES.find(x=>x.id===hit.voice)||E.VOICES[0];
    const d=document.createElement('div'); d.className='hit';
    d.innerHTML=`<div class="he">${s.emoji}</div><div class="hb"><div class="ht"></div><div class="hs">${s.title} · ${v.emoji} ${v.name}</div></div><button data-a="play">▶️</button><button data-a="edit">✏️</button><button data-a="del">🗑️</button>`;
    d.querySelector('.ht').textContent=hit.title;
    d.querySelector('[data-a=play]').onclick=()=>sing(hit);
    d.querySelector('[data-a=edit]').onclick=()=>{ Object.assign(st,{text:hit.text,song:hit.song,voice:hit.voice,style:hit.style||'auto',fx:hit.fx,lyric:hit.lyric,ending:hit.ending,chaos:hit.chaos,tempo:hit.tempo,pitch:hit.pitch,bells:hit.bells}); save(); buildAll(); showTab('create'); toast('✏️ Loaded into the editor'); };
    d.querySelector('[data-a=del]').onclick=()=>{ if(confirm('Delete this hit forever? 😢')){ saveHits(loadHits().filter(x=>x.id!==hit.id)); renderHits(); } };
    L.appendChild(d);
  });
}
$('btnExport').onclick=async()=>{
  const blob=new Blob([JSON.stringify({app:'SingItOut',v:1,hits:loadHits()},null,1)],{type:'application/json'});
  const file=new File([blob],'SingItOut-hits.json',{type:'application/json'});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file]}); return; } }catch(e){ if(e.name==='AbortError') return; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='SingItOut-hits.json'; a.click();
};
$('importFile').onchange=e=>{
  const f=e.target.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{ try{ const d=JSON.parse(r.result); const inc=(d.hits||d||[]).filter(x=>x&&x.text); const cur=loadHits(); const ids=new Set(cur.map(x=>x.id)); const merged=cur.concat(inc.filter(x=>!ids.has(x.id))); saveHits(merged); renderHits(); toast(`📥 Imported ${merged.length-cur.length} hits`); }catch(err){ toast('That file is not a SingItOut backup 🤔'); } e.target.value=''; };
  r.readAsText(f);
};

window.addEventListener('resize',()=>{ if(current&&current.stage&&!$('perf').classList.contains('hidden')) current.stage.resize(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden && vidJob){ vidJob.cancel(); toast('Video recording stopped — the app needs to stay open.'); } if(document.hidden && current){ stopPlayback(); $('perfControls').classList.remove('hidden'); } });

buildAll();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
