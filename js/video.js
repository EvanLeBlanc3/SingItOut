/* SingItOut — video export: re-performs the song onto a 720x1280 canvas with burned-in lyrics, records canvas + audio */
(function(){
const R=Math.random, PI2=Math.PI*2;
const W=720, H=1280;
const FONT='-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';
const PAL=['#ffe14d','#33e6ff','#ff4fd8','#7CFF4F','#ff8a00','#b18cff','#ffffff'];
const hash=n=>{ let x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

function supported(){
  const c=document.createElement('canvas');
  return !!(c.captureStream && window.MediaRecorder && (window.AudioContext||window.webkitAudioContext));
}
function pickMime(){
  const L=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  if(!MediaRecorder.isTypeSupported) return '';
  for(const m of L) if(MediaRecorder.isTypeSupported(m)) return m;
  return '';
}
const MODE_MAP={karaoke:'karaoke',pianoroll:'karaoke',slam:'slam',fly:'slam',rain:'slam',wave:'wave',bubble:'wave',zoom:'zoom',spiral:'zoom',typewriter:'type'};

function fitFont(c, text, maxW, size, weight){ c.font=`${weight||900} ${size}px ${FONT}`; let w=c.measureText(text).width; if(w>maxW){ size=Math.max(18,Math.floor(size*maxW/w)); c.font=`${weight||900} ${size}px ${FONT}`; } return size; }
function outlined(c, text, x, y, fill, lw){ c.lineJoin='round'; c.lineWidth=lw||10; c.strokeStyle='rgba(0,0,0,0.9)'; c.strokeText(text,x,y); c.fillStyle=fill; c.fillText(text,x,y); }
function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

// syllable pieces for a line
function linePieces(arr, li){
  const out=[]; if(li<0||li>=arr.lines.length) return out;
  arr.lines[li].forEach((oi,wi)=>{ const o=arr.occ[oi];
    o.notes.forEach((ni,k)=>{ const n=arr.notes[ni]; let txt = o.notes.length>1 ? n.syl.text : o.display;
      if(o.notes.length>1 && k===o.notes.length-1){ const p=o.display.match(/[!?.,]+$/); if(p) txt+=p[0]; }
      out.push({ni, txt, space: k===0 && wi>0}); }); });
  return out;
}

function drawKaraoke(c,arr,I,S){
  const n=I.note; if(!n) return;
  if(S.line!==n.line){ S.line=n.line; S.lineT=I.t; }
  const pop=Math.min(1,(I.t-S.lineT)/0.25), sc=0.6+0.4*(1-Math.pow(1-pop,3));
  const drawLine=(li,y,size,alpha,active)=>{
    const ps=linePieces(arr,li); if(!ps.length) return;
    const full=ps.map(p=>(p.space?' ':'')+p.txt).join('');
    size=fitFont(c,full,W*0.9,size);
    let x=W/2-c.measureText(full).width/2; c.textAlign='left'; c.textBaseline='middle'; c.globalAlpha=alpha;
    let ball=null;
    ps.forEach(p=>{ const t=(p.space?' ':'')+p.txt; const w=c.measureText(t).width; const sw=c.measureText(p.txt).width;
      let col='rgba(255,255,255,0.85)';
      if(active){ if(p.ni<I.noteIdx) col='#ffe14d'; else if(p.ni===I.noteIdx){ col='#ffffff'; ball={x:x+w-sw/2, y:y-size*0.8}; } }
      if(active && p.ni===I.noteIdx){ c.shadowColor='#ff3fa4'; c.shadowBlur=30; }
      outlined(c,t,x,y,col,size*0.16); c.shadowBlur=0; x+=w; });
    c.globalAlpha=1;
    if(ball){ const nn=arr.notes[I.noteIdx]; const p=Math.min(1,(I.t-nn.t)/Math.max(0.05,nn.dur)); const by=ball.y-Math.sin(p*Math.PI)*50;
      c.fillStyle='#ff2d55'; c.beginPath(); c.ellipse(ball.x,by,18*(1+(1-p)*0.25),18*(1-(1-p)*0.2),0,0,PI2); c.fill(); c.fillStyle='rgba(255,255,255,0.7)'; c.beginPath(); c.arc(ball.x-6,by-6,5,0,PI2); c.fill(); }
  };
  c.save(); c.translate(W/2,H*0.74); c.scale(sc,sc); c.translate(-W/2,-H*0.74);
  drawLine(n.line, H*0.74, 76, 1, true); c.restore();
  drawLine(n.line+1, H*0.82, 44, 0.55, false);
}
function curWord(arr,I){ const n=I.note; if(!n) return null; const o=arr.occ[n.occ]; const first=arr.notes[o.notes[0]]; return {o, oi:n.occ, t0:first.t}; }
function drawSlam(c,arr,I){
  const w=curWord(arr,I); if(!w||I.t<w.t0-0.01) return;
  const age=I.t-w.t0, k=Math.min(1,age/0.18), sc=1+3*(1-k)*(1-k);
  const rot=(hash(w.oi)-0.5)*0.4, col=PAL[Math.floor(hash(w.oi+9)*PAL.length)];
  const txt=w.o.display.toUpperCase(); c.textAlign='center'; c.textBaseline='middle';
  const size=fitFont(c,txt,W*0.88,Math.max(80,190-txt.length*9));
  c.save(); c.translate(W/2,H*0.5); c.rotate(rot); c.scale(sc,sc); c.globalAlpha=Math.min(1,k*1.5);
  c.fillStyle='rgba(255,0,150,0.7)'; c.fillText(txt,-5,-5); outlined(c,txt,8,8,'#000',2); outlined(c,txt,0,0,col,size*0.12);
  c.restore();
}
function drawWave(c,arr,I){
  const n=I.note; if(!n) return;
  const ps=arr.lines[n.line].map(oi=>({oi,txt:arr.occ[oi].display}));
  const full=ps.map(p=>p.txt).join(' '); const size=fitFont(c,full,W*0.9,84);
  let x=W/2-c.measureText(full).width/2; c.textAlign='left'; c.textBaseline='middle'; let li=0;
  ps.forEach((p,pi)=>{ const curW=p.oi===n.occ, done=p.oi<n.occ;
    [...(pi?' ':'')+p.txt].forEach(ch=>{ const w=c.measureText(ch).width; const y=H*0.55+Math.sin(I.t*6+li*0.55)*(curW?26:10);
      c.save(); c.translate(x+w/2,y); c.rotate(Math.sin(I.t*4+li)*(curW?0.2:0.05)); const sc=curW?1.25:1; c.scale(sc,sc);
      outlined(c,ch,-w/2,0, curW?`hsl(${(li*25+I.t*200)%360},100%,65%)`:done?'#fff':'rgba(255,255,255,0.55)', size*0.14); c.restore(); x+=w; li++; }); });
}
function drawZoom(c,arr,I){
  c.textAlign='center'; c.textBaseline='middle';
  const n=I.note; if(!n) return;
  for(let back=2;back>=0;back--){ const oi=n.occ-back; if(oi<0) continue; const o=arr.occ[oi]; const t0=arr.notes[o.notes[0]].t; const age=I.t-t0; if(age<0||age>1.8) continue;
    const p=age/1.8, sc=0.1+Math.pow(p,1.6)*6, a=p<0.12?p/0.12:Math.max(0,1-(p-0.12)/0.88);
    c.save(); c.translate(W/2,H*0.5); c.rotate((hash(oi)-0.5)*1.2*p); c.scale(sc,sc); c.globalAlpha=a; c.font=`900 70px ${FONT}`;
    outlined(c,o.display,0,0,PAL[Math.floor(hash(oi+3)*PAL.length)],8); c.restore(); }
}
function drawType(c,arr,I,S){
  const n=I.note; if(!n) return; const li=n.line; let txt='';
  for(const oi of arr.lines[li]){ const o=arr.occ[oi]; const f=arr.notes[o.notes[0]]; if(f.t>I.t) break; const l=arr.notes[o.notes[o.notes.length-1]];
    const pr=Math.min(1,(I.t-f.t)/Math.max(0.08,l.t+l.dur*0.6-f.t)); txt+=o.display.slice(0,Math.ceil(o.display.length*pr))+(pr>=1?' ':''); }
  const prev = li>0 ? arr.lines[li-1].map(oi=>arr.occ[oi].display).join(' ') : '';
  c.textAlign='left'; c.textBaseline='middle';
  const row=(t,y,size,alpha,cursor)=>{ c.font=`700 ${size}px "American Typewriter","Courier New",monospace`; const w=Math.min(W*0.9,c.measureText(t+'▌').width+30);
    c.globalAlpha=alpha; c.fillStyle='rgba(0,0,0,0.6)'; c.fillRect(W*0.05+6,y-size*0.75+6,w,size*1.5); c.fillStyle='rgba(255,250,235,0.95)'; c.fillRect(W*0.05,y-size*0.75,w,size*1.5);
    c.fillStyle='#222'; c.fillText(t,W*0.05+15,y); if(cursor && Math.floor(I.t*3)%2===0){ c.fillStyle='#ff3fa4'; c.fillText('▌',W*0.05+15+c.measureText(t).width,y); } c.globalAlpha=1; };
  if(prev) row(prev.slice(0,40),H*0.70,30,0.6,false);
  c.font=`700 52px "American Typewriter","Courier New",monospace`; let size=52; while(size>26 && c.measureText(txt).width>W*0.82){ size-=2; c.font=`700 ${size}px "American Typewriter","Courier New",monospace`; }
  row(txt,H*0.78,size,1,true);
}

function makeOverlay(arr, R, voice, chaos){
  const mode = MODE_MAP[R.lyric]||'karaoke';
  const S={line:-1, fx:null, finale:null};
  const ending=R.ending;
  const bigWord = ending==='sting'?'MIC DROP': ending==='fail'?'...wow.': ['BRAVO!','ENCORE!','LEGENDARY!','ICONIC!'][Math.floor(R_()*4)];
  function R_(){ return Math.random(); }
  const score = ending==='fail'? Math.floor(3+R_()*38) : Math.floor(87+R_()*14);
  const reviews=['The Grammys have been notified.','Beethoven approves. Probably.','Neighbors filed a complaint (5 stars).','Certified Ridiculous.','A pigeon wept openly.','The robot asked for a raise.','Rolling Stone: "Why?"','Mozart wants his melody back.'];
  const review=reviews[Math.floor(R_()*reviews.length)];
  const throwers={big:['🌹','👏','🎉','💐','⭐'],sting:['💥','🎤','🔥','😎'],fail:['🍅','🍅','🥬','🦗'],none:['✨']}[ending]||['✨'];
  const parts=Array.from({length:ending==='none'?8:26},(_,i)=>({e:throwers[i%throwers.length], sx:R_()<0.5?-80:W+80, ex:W*(0.1+R_()*0.8), ey:H*(0.15+R_()*0.65), rot:(R_()-0.5)*12, d:i*0.05}));
  return function(c,Wc,Hc,I){
    // chaos (lyrics layer only, background already drawn)
    if(chaos>0 && I.onDown && R_()<[0,0.3,0.5,0.8][chaos]) S.fx={type:['shake','zoom','flash','tilt','invert'][Math.floor(R_()*(chaos>=3?5:4))], t0:I.t};
    c.save();
    let fxType=null, fxP=1; if(S.fx){ fxP=(I.t-S.fx.t0)/0.45; if(fxP<1) fxType=S.fx.type; }
    if(fxType==='shake'){ c.translate((R_()-0.5)*30*(1-fxP),(R_()-0.5)*30*(1-fxP)); }
    if(fxType==='zoom'){ const z=1+0.08*Math.sin(fxP*Math.PI); c.translate(W/2,H/2); c.scale(z,z); c.translate(-W/2,-H/2); }
    if(fxType==='tilt'){ c.translate(W/2,H/2); c.rotate(Math.sin(fxP*Math.PI*2)*0.08); c.translate(-W/2,-H/2); }
    // intro title card
    if(I.t < arr.firstNoteT){ const a=Math.min(1,Math.max(0,(arr.firstNoteT-I.t)/0.4));
      c.globalAlpha=a; c.textAlign='center'; c.textBaseline='middle'; c.font=`120px ${FONT}`; c.fillText(arr.song.emoji,W/2,H*0.4);
      const sz=fitFont(c,arr.song.title,W*0.86,72); outlined(c,arr.song.title,W/2,H*0.52,'#ffe14d',sz*0.14);
      c.font=`800 38px ${FONT}`; outlined(c,`sung by ${voice.emoji} ${voice.name}`,W/2,H*0.6,'#fff',7); c.globalAlpha=1; }
    else if(I.t < arr.songEnd){
      if(mode==='karaoke') drawKaraoke(c,arr,I,S); else if(mode==='slam') drawSlam(c,arr,I); else if(mode==='wave') drawWave(c,arr,I); else if(mode==='zoom') drawZoom(c,arr,I); else drawType(c,arr,I,S);
    }
    c.restore();
    if(fxType==='flash'){ c.fillStyle=`rgba(${['255,63,164','51,230,255','255,225,77'][Math.floor(S.fx.t0*10)%3]},${0.35*(1-fxP)})`; c.fillRect(0,0,W,H); }
    if(fxType==='invert'){ c.globalCompositeOperation='difference'; c.fillStyle=`rgba(255,255,255,${1-fxP})`; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
    // finale
    if(I.t >= arr.songEnd){ const ft=I.t-arr.songEnd;
      c.fillStyle=`rgba(0,0,0,${Math.min(0.45,ft)})`; c.fillRect(0,0,W,H);
      c.font=`70px ${FONT}`; c.textAlign='center'; c.textBaseline='middle';
      parts.forEach(p=>{ const k=Math.min(1,Math.max(0,(ft-p.d)/1.0)); if(k<=0) return; const e=1-Math.pow(1-k,3);
        const x=p.sx+(p.ex-p.sx)*e, y=H+80+(p.ey-H-80)*e-Math.sin(e*Math.PI)*200; c.save(); c.translate(x,y); c.rotate(p.rot*e);
        if(ending==='fail' && k>=1) c.scale(1.6,0.6); c.fillText(p.e,0,0); c.restore(); });
      if(ending==='sting'){ const k=Math.min(1,ft/0.7); c.save(); c.translate(W/2,-100+k*k*(H*0.62+100)); c.rotate(k*1.7); c.font=`150px ${FONT}`; c.fillText('🎤',0,0); c.restore(); }
      const k=Math.min(1,ft/0.4), sc=ending==='fail'?1:1+2.5*(1-k)*(1-k);
      c.save(); c.translate(W/2,H*0.22); c.scale(sc,sc); c.globalAlpha=k; const sz=fitFont(c,bigWord,W*0.9,130);
      c.fillStyle='#ff3fa4'; c.fillText(bigWord,8,8); outlined(c,bigWord,0,0,ending==='fail'?'#bbb':'#ffe14d',sz*0.1); c.restore();
      if(ft>0.8){ const a=Math.min(1,(ft-0.8)/0.4); c.globalAlpha=a; rrect(c,W*0.08,H*0.42,W*0.84,250,30); c.fillStyle='rgba(0,0,0,0.75)'; c.fill(); c.lineWidth=4; c.strokeStyle='#ffe14d'; c.stroke();
        c.fillStyle='rgba(255,255,255,0.7)'; c.font=`800 26px ${FONT}`; c.fillText('RIDICULOUSNESS RATING',W/2,H*0.42+45);
        c.fillStyle='#ffe14d'; c.font=`900 96px ${FONT}`; c.fillText(score+'%',W/2,H*0.42+125);
        c.fillStyle='#fff'; fitFont(c,review,W*0.76,32,700); c.fillText(review,W/2,H*0.42+200); c.globalAlpha=1; }
    }
    // header + watermark
    c.textAlign='center'; c.textBaseline='middle'; c.font=`800 26px ${FONT}`;
    const head=`${arr.song.emoji} ${arr.song.title} · ${voice.emoji} ${voice.name}`; const hw=Math.min(W*0.9,c.measureText(head).width+44);
    rrect(c,W/2-hw/2,40,hw,52,26); c.fillStyle='rgba(0,0,0,0.45)'; c.fill(); c.fillStyle='#fff'; fitFont(c,head,W*0.84,26,800); c.fillText(head,W/2,67);
    c.font=`800 28px ${FONT}`; c.globalAlpha=0.8; outlined(c,'🎤 Made with SingItOut',W/2,H-50,'#fff',6); c.globalAlpha=1;
    // progress
    const total=arr.songEnd; c.fillStyle='rgba(255,255,255,0.2)'; c.fillRect(0,H-8,W,8); c.fillStyle='#ff3fa4'; c.fillRect(0,H-8,W*Math.min(1,Math.max(0,I.t/total)),8);
  };
}

/* record({actx, pcm, arr, R, voice, mount, onProgress}) → {promise, cancel} */
function record(o){
  const {actx, pcm, arr, R, voice, mount, onProgress} = o;
  let cancelled=false, rec=null, stage=null, src=null, timer=null;
  const promise = new Promise((resolve,reject)=>{
    const holder=document.createElement('div'); holder.className='vid-holder';
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H; holder.appendChild(cv); const ly=document.createElement('div'); ly.className='lyr'; ly.style.display='none'; holder.appendChild(ly);
    mount.innerHTML=''; mount.appendChild(holder);
    stage=new SIO.visuals.Stage(holder, arr, {fx:R.fx, lyric:R.lyric, chaos:R.chaos, size:{w:W,h:H}, noDom:true});
    stage.postDraw=makeOverlay(arr,R,voice,R.chaos);
    const dest=actx.createMediaStreamDestination();
    const buf=actx.createBuffer(1,pcm.length,44100); buf.getChannelData(0).set(pcm);
    src=actx.createBufferSource(); src.buffer=buf; src.connect(dest); src.connect(actx.destination);
    const vStream=cv.captureStream(30);
    const stream=new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const mime=pickMime(); const chunks=[];
    try{ rec=new MediaRecorder(stream, mime?{mimeType:mime, videoBitsPerSecond:6000000, audioBitsPerSecond:192000}:{}); }
    catch(e){ try{ rec=new MediaRecorder(stream); }catch(e2){ reject(e2); return; } }
    rec.ondataavailable=e=>{ if(e.data && e.data.size) chunks.push(e.data); };
    rec.onstop=()=>{ stage.stop(); vStream.getTracks().forEach(t=>t.stop()); if(cancelled) return reject(new Error('cancelled'));
      const type=(rec.mimeType||mime||'video/mp4').split(';')[0]; const blob=new Blob(chunks,{type}); if(!blob.size) return reject(new Error('Recorder produced an empty file')); resolve({blob, ext:type.includes('mp4')?'mp4':'webm', type}); };
    // draw first frame before recording so video doesn't start black
    const startAt=actx.currentTime+0.35; const total=pcm.length/44100;
    const getT=()=>actx.currentTime-startAt;
    stage.start(getT,()=>{});
    setTimeout(()=>{ if(cancelled) return; rec.start(1000); src.start(startAt);
      timer=setInterval(()=>{ const t=getT(); onProgress&&onProgress(Math.max(0,Math.min(1,t/total))); if(t>=total+0.25){ clearInterval(timer); try{ rec.state!=='inactive'&&rec.stop(); }catch(e){} } },100);
    }, 120);
  });
  const cancel=()=>{ cancelled=true; clearInterval(timer); try{ src&&src.stop(); }catch(e){} try{ rec&&rec.state!=='inactive'&&rec.stop(); }catch(e){} stage&&stage.stop(); };
  return {promise, cancel};
}

SIO.video={supported, record, pickMime};
})();
