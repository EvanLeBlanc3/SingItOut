/* SingItOut — pure-JS DSP renderer (runs in a Web Worker, falls back to main thread) */
(function(G){
const SR = 44100;
const TWO_PI = Math.PI*2;
const mtof = m => 440*Math.pow(2,(m-69)/12);
const rnd = Math.random;

function polyblep(t, dt){
  if(t<dt){ t/=dt; return t+t-t*t-1; }
  if(t>1-dt){ t=(t-1)/dt; return t*t+t+t+1; }
  return 0;
}
function oscSample(wave, ph, dt){
  switch(wave){
    case 'sine': return Math.sin(TWO_PI*ph);
    case 'triangle': return ph<0.5 ? 4*ph-1 : 3-4*ph;
    case 'square': { let v = ph<0.5?1:-1; v += polyblep(ph,dt); v -= polyblep((ph+0.5)%1,dt); return v; }
    default: return 2*ph-1-polyblep(ph,dt); // saw
  }
}
// RBJ biquad
function Biquad(){ this.b0=1;this.b1=0;this.b2=0;this.a1=0;this.a2=0;this.x1=0;this.x2=0;this.y1=0;this.y2=0; }
Biquad.prototype.set=function(type,f,Q){
  f=Math.max(20,Math.min(f,SR*0.45)); const w0=TWO_PI*f/SR, c=Math.cos(w0), s=Math.sin(w0), al=s/(2*Q);
  let b0,b1,b2; const a0=1+al;
  if(type==='bp'){ b0=al; b1=0; b2=-al; }
  else if(type==='lp'){ b0=(1-c)/2; b1=1-c; b2=(1-c)/2; }
  else { b0=(1+c)/2; b1=-(1+c); b2=(1+c)/2; } // hp
  this.b0=b0/a0; this.b1=b1/a0; this.b2=b2/a0; this.a1=-2*c/a0; this.a2=(1-al)/a0;
};
Biquad.prototype.p=function(x){ const y=this.b0*x+this.b1*this.x1+this.b2*this.x2-this.a1*this.y1-this.a2*this.y2; this.x2=this.x1; this.x1=x; this.y2=this.y1; this.y1=y; return y; };

// ---------- Instruments (additive into mix/send) ----------
function makeKit(mix, send){
  const N = mix.length;
  const idx = t => Math.max(0, Math.round(t*SR));
  // generic enveloped tone with optional filter sweep
  function tone(o){
    const {t, d, f, wave='sine', a=0.005, dec=0.2, sus=0.5, rel=0.06, vol=0.2, wet=0, lp=0, lpTo=0, lpTau=0.1, det=0, vib=0, vibRate=0, glideTo=0, Q=0.7} = o;
    const s0=idx(t), endHold = t+d, maxEnd = Math.min(N, idx(endHold + rel*7 + 0.01));
    const freq0 = f*Math.pow(2,det/1200);
    let ph=rnd(), env=0; const flt = lp? new Biquad():null; let lpc=lp;
    if(flt) flt.set('lp',lp,Q);
    const aS=a*SR, decK=1-Math.exp(-1/(dec*SR)), relK=1-Math.exp(-1/(rel*SR)), lpK = 1-Math.exp(-32/(lpTau*SR));
    const relStart = idx(endHold);
    for(let i=s0;i<maxEnd;i++){
      const n=i-s0;
      if(i<relStart){ if(n<aS) env=n/aS; else env+= (sus-env)*decK; }
      else { env -= env*relK; if(env<0.0004) break; }
      let fr=freq0; if(glideTo) fr = freq0 + (glideTo-freq0)*Math.min(1,n/(d*SR));
      if(vib) fr *= Math.pow(2, vib*Math.sin(TWO_PI*vibRate*n/SR)/1200);
      const dt=fr/SR; ph+=dt; if(ph>=1) ph-=1;
      let v=oscSample(wave,ph,dt);
      if(flt){ if(lpTo && (n&31)===0){ lpc += (lpTo-lpc)*lpK; flt.set('lp',lpc,Q);} v=flt.p(v); }
      v*=env*vol; mix[i]+=v; if(wet) send[i]+=v*wet;
    }
  }
  function noiseHit(o){
    const {t, len, vol, type='hp', f=5000, Q=0.7, wet=0, decay='exp'} = o;
    const s0=idx(t), e=Math.min(N, idx(t+len)); const fl=new Biquad(); fl.set(type,f,Q);
    const k = Math.log(0.001)/(len*SR);
    for(let i=s0;i<e;i++){ const n=i-s0; const env=Math.exp(k*n); const v=fl.p(rnd()*2-1)*env*vol; mix[i]+=v; if(wet) send[i]+=v*wet; }
  }
  const K = {
    bass(m,t,d,vol=0.5){ tone({t,d:d*0.92,f:mtof(m),wave:'triangle',a:0.006,dec:0.18,sus:0.55,rel:0.05,vol:vol*0.9}); tone({t,d:d*0.92,f:mtof(m),wave:'sine',a:0.006,dec:0.18,sus:0.55,rel:0.05,vol:vol*0.7}); },
    keys(ms,t,d,vol=0.16,wave='triangle'){ ms.forEach(m=>tone({t,d:d*0.9,f:mtof(m),wave,a:0.004,dec:0.12,sus:0.35,rel:0.04,vol,wet:0.18,lp:wave==='square'?1800:3200})); },
    pad(ms,t,d,vol=0.07){ ms.forEach(m=>[-8,8].forEach(det=>tone({t,d:d*0.95,f:mtof(m),det,wave:'saw',a:Math.min(0.35,d*0.3),dec:0.5,sus:0.85,rel:0.25,vol,wet:0.35,lp:1100}))); },
    pluck(m,t,d,vol=0.09){ tone({t,d:d*0.85,f:mtof(m),wave:'square',a:0.002,dec:0.06,sus:0.25,rel:0.03,vol,wet:0.12,lp:4200,lpTo:900,lpTau:0.05}); },
    bell(m,t,d,vol=0.1){ const f=mtof(m+12); const dd=Math.max(0.12,d*0.9); tone({t,d:dd,f,wave:'sine',a:0.003,dec:0.25,sus:0.2,rel:0.15,vol,wet:0.3}); tone({t,d:dd*0.5,f:f*3.01,wave:'sine',a:0.002,dec:0.08,sus:0.1,rel:0.08,vol:vol*0.25,wet:0.3}); },
    brass(ms,t,d,vol=0.09){ ms.forEach(m=>tone({t,d:d*0.9,f:mtof(m),wave:'saw',a:0.05,dec:0.3,sus:0.7,rel:0.1,vol,wet:0.3,lp:500,lpTo:2200,lpTau:0.12,Q:1.5})); },
    kick(t,vol=0.75){ const s0=idx(t), e=Math.min(N,idx(t+0.33)); let ph=0; for(let i=s0;i<e;i++){ const n=(i-s0)/SR; const f=42+108*Math.exp(-n/0.045); ph+=f/SR; mix[i]+=Math.sin(TWO_PI*ph)*Math.exp(-n/0.07)*vol; } },
    snare(t,vol=0.32){ noiseHit({t,len:0.17,vol,type:'hp',f:1400,wet:0.15}); tone({t,d:0.05,f:200,wave:'triangle',a:0.001,dec:0.04,sus:0,rel:0.03,vol:vol*0.5,glideTo:140}); },
    hat(t,open,vol=0.12){ noiseHit({t,len:open?0.22:0.05,vol,type:'hp',f:7500}); },
    crash(t,vol=0.22){ noiseHit({t,len:2.0,vol,type:'hp',f:4500,wet:0.3}); },
    timp(m,t,vol=0.5){ tone({t,d:0.05,f:mtof(m)*1.04,glideTo:mtof(m),wave:'sine',a:0.002,dec:0.3,sus:0.3,rel:0.25,vol,wet:0.3}); },
    clap(t,vol){ noiseHit({t,len:0.05+rnd()*0.03,vol,type:'bp',f:900+rnd()*1600,Q:1.2,wet:0.4}); },
    chirp(t,vol){ for(let i=0;i<3;i++) tone({t:t+i*0.05,d:0.02,f:4300+rnd()*300,wave:'sine',a:0.005,dec:0.02,sus:1,rel:0.008,vol,wet:0.5}); },
    trombone(m,t,d,vol=0.16){ tone({t,d,f:mtof(m),wave:'saw',a:0.04,dec:0.4,sus:0.8,rel:0.08,vol,wet:0.3,lp:300,lpTo:1500,lpTau:0.08,Q:3,vib:d>0.8?45:0,vibRate:6,glideTo:d>0.8?mtof(m-0.7):0}); },
  };
  return K;
}

const voiceChord = (pcs, center)=> pcs.map(pc=>center-6 + (((pc-(center-6))%12)+12)%12).sort((a,b)=>a-b);
const rootMidi = (pc, base)=> base + (((pc-base)%12)+12)%12;

function playBar(I, style, bar, isLastBeforeFinal){
  const {t, spb, beats, rootPc, pcs} = bar;
  const R = rootMidi(rootPc, 36), F5 = R+7, Fd = F5-12 < R ? F5 : F5-12;
  const chord = voiceChord(pcs, 64), low = voiceChord(pcs, 57);
  const bt = i => t + i*spb;
  if(bar.isFinal){
    I.bass(R, t, spb*beats*1.2, 0.55); I.pad(chord,t,spb*beats*1.3,0.08); I.keys(chord.concat([chord[0]+12]),t,spb*beats,0.12);
    if(style!=='none'){ I.kick(t); I.crash(t); }
    return;
  }
  switch(style){
    case 'none': if(bar.isIntro) for(let i=0;i<beats;i++) I.hat(bt(i),false,0.18); break;
    case 'waltz':
      for(let i=0;i<beats;i++){ if(i===0){ I.bass(R,bt(i),spb*0.95); I.kick(bt(i),0.45);} else { I.keys(chord,bt(i),spb*0.7,0.12); I.hat(bt(i),false,0.07);} } break;
    case 'oompah':
      for(let i=0;i<beats;i++){ if(i%2===0){ I.bass(i%4===0?R:Fd,bt(i),spb*0.8,0.55); I.kick(bt(i),0.5);} else { I.keys(chord,bt(i),spb*0.5,0.14); I.snare(bt(i),0.12);} } break;
    case 'march':
      for(let i=0;i<beats;i++){ I.bass(i%2?Fd:R,bt(i),spb*0.7,0.5); I.keys(low,bt(i)+spb*0.5,spb*0.35,0.09); if(i%2===0) I.kick(bt(i),0.5); else I.snare(bt(i),0.22); }
      if(isLastBeforeFinal||bar.isIntro){ for(let s=0;s<4;s++) I.snare(bt(beats-1)+s*spb/4,0.12+s*0.04); } break;
    case 'gallop':
      for(let i=0;i<beats;i++){ I.bass(i%2?Fd:R,bt(i),spb*0.45,0.55); I.keys(chord,bt(i)+spb*0.5,spb*0.35,0.13); I.hat(bt(i)+spb*0.5,false,0.1); I.kick(bt(i),0.45); if(i%2) I.snare(bt(i),0.18);} break;
    case 'arp': {
      const tones = chord.concat([chord[0]+12, chord[1]+12]);
      for(let s=0;s<beats*4;s++) I.pluck(tones[s%tones.length],t+s*spb/4,spb/4,0.11);
      for(let i=0;i<beats;i++){ I.pluck(R+12,bt(i),spb*0.5,0.14); I.hat(bt(i)+spb*0.5,false,0.08); if(i===0) I.kick(bt(i),0.5); if(i===2||(beats===2&&i===1)) I.snare(bt(i),0.18);} break; }
    case 'pad':
      I.pad(chord, t, spb*beats, 0.07); I.bass(R, t, spb*beats, 0.35); I.kick(t,0.25);
      for(let i=0;i<beats;i++) I.bell(chord[i%chord.length]+12, bt(i)+spb*0.5, spb*0.5, 0.025); break;
    case 'ragtime':
      for(let i=0;i<beats;i++){ if(i%2===0){ I.bass(i%4===0?R:Fd,bt(i),spb*0.6,0.5); I.keys([R+12],bt(i),spb*0.5,0.1);} else { I.keys(chord,bt(i),spb*0.45,0.11,'square'); } I.hat(bt(i),false,0.05);} break;
    case 'drama':
      I.brass(low, t, spb*beats*0.98, 0.08); I.bass(R, t, spb*beats, 0.45); I.timp(R+12, t, 0.5);
      if(beats>=3) I.timp(F5, bt(beats-1), 0.35);
      if(bar.index%2===0) I.crash(t,0.1); break;
    case 'disco':
      for(let i=0;i<beats;i++){ I.kick(bt(i),0.6); I.hat(bt(i)+spb*0.5,true,0.09); I.bass(R,bt(i),spb*0.45,0.5); I.bass(R+12,bt(i)+spb*0.5,spb*0.4,0.4); if(i%2) I.snare(bt(i),0.2); I.keys(chord,bt(i)+spb*0.5,spb*0.25,0.08,'square'); } break;
  }
}

// ---------- Singer v2: harmonic (additive) vocal synth with cascade formant envelope ----------
const V5={IY:[270,2290,3010,3500,4300],IH:[390,1990,2550,3500,4300],EH:[530,1840,2480,3500,4300],AE:[660,1720,2410,3500,4300],
  AA:[730,1090,2440,3500,4300],AO:[570,840,2410,3500,4300],UH:[440,1020,2240,3500,4300],UW:[300,870,2240,3500,4300],
  AH:[640,1190,2390,3500,4300],ER:[490,1350,1690,3500,4300],OH:[500,820,2400,3500,4300]};
const DIPH={EY:['EH','IY'],AY:['AA','IY'],OW:['OH','UW'],AW:['AA','UW'],OY:['AO','IY']};
const GSCALE={m:[1,1,1,1,1],f:[1.17,1.18,1.15,1.1,1.08],c:[1.3,1.3,1.26,1.18,1.12]};
const BW0=[75,95,130,180,240];
const SIN=new Float32Array(4096); for(let i=0;i<4096;i++) SIN[i]=Math.sin(TWO_PI*i/4096);
const vowelF=n=> DIPH[n] ? {f:V5[DIPH[n][0]], f2:V5[DIPH[n][1]]} : {f:V5[n]||V5.AH};
const cF=f=> f.length>=5?f:[f[0],f[1],f[2],3500,4300];
function diatonic(m, steps, key, mode){
  const sc = mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  let pc=((m-key)%12+12)%12, p=pc; while(sc.indexOf(p)<0) p=(p+11)%12;
  const base=m-((pc-p+12)%12); const idx=sc.indexOf(p);
  const t=idx+steps, oct=Math.floor(t/7), ni=((t%7)+7)%7;
  return base - sc[idx] + sc[ni] + 12*oct;
}
function sing(N, D){
  const P=D.preset, C=D.C, notes=D.notes, out=new Float32Array(N);
  const KEYS=['amp','na','nf','nq','asp','vib','sc','f0','f1','f2','f3','f4']; (P.layers||[{}]).forEach((_,i)=>KEYS.push('fr'+i));
  const KI={}; KEYS.forEach((k,i)=>KI[k]=i);
  const ev=[]; const E=(t,k,v,tau)=>ev.push({t:Math.max(0,t),k:KI[k],v,tau:Math.max(0.001,tau)});
  const setF=(f,t,tau)=>{ for(let i=0;i<5;i++) E(t,'f'+i,f[i],tau); };
  const setAmp=(v,t,tau=0.01)=>E(t,'amp',v,tau);
  const setNoise=(v,freq,q,t,tau=0.006)=>{ E(t,'na',v,tau); if(freq){ E(t,'nf',freq,0.002); E(t,'nq',q||1,0.002);} };
  const setAsp=(v,t,tau=0.006)=>E(t,'asp',v,tau);
  const layers=P.layers||[{g:1}];
  const attack=P.attack||0.018;
  notes.forEach((n,ni)=>{
    const t0=n.t, dur=n.dur, ph=n.ph;
    layers.forEach((ly,li)=>{ let mm = ly.harm ? diatonic(n.midi, ly.harm, D.key, D.mode) : n.midi; mm += (P.shift||0) + D.transpose + (ly.semi||0);
      E(t0-0.015,'fr'+li, mtof(mm), P.glide||0.03); });
    if(P.scoop && (n.wordStart || ni===0)){ E(t0-0.016,'sc',-P.scoop,0.001); E(t0+0.005,'sc',0,P.scoopTau||0.06); }
    if(P.fall && (ni===notes.length-1 || notes[ni+1].t-(t0+dur)>0.15)){ E(t0+dur*0.75,'sc',-P.fall,dur*0.12); E(t0+dur+0.05,'sc',0,0.01); }
    if(P.vib){ const depth=P.vib*Math.min(1,dur/0.45); E(t0,'vib',P.vib*0.15,0.04); E(t0+Math.min(P.vibDelay==null?0.2:P.vibDelay,dur*0.35),'vib',depth,0.14); }
    const vf=vowelF(ph.vowel.a);
    const nOn=ph.onset.length, nCo=ph.coda.length;
    const cd=Math.min(0.075,dur*0.18);
    let onT=nOn*cd, coT=nCo*cd*0.85; const lim=dur*0.5; if(onT+coT>lim){ const k=lim/(onT+coT); onT*=k; coT*=k; }
    let t=t0;
    const seg=(cn,ts,sd,nextF)=>{ const c=C[cn]; if(!c) return;
      if(c.k==='fric'){ setF(nextF,ts,0.03); setAmp(c.v?0.3:0,ts); setNoise(c.g,c.nf,c.q,ts); setAsp(0,ts); }
      else if(c.k==='stop'){ setF(nextF,ts,0.03); setAmp(c.v?0.12:0,ts,0.006); setNoise(0,null,null,ts,0.004); const tb=ts+sd*0.5;
        setNoise(c.g*0.9,c.nf,1.1,tb,0.002); setNoise(0,null,null,tb+Math.max(0.012,sd*0.25),0.008);
        if(!c.v){ setAsp(0.5,tb+0.01,0.004); setAsp(0,tb+sd*0.5,0.012); }
        setAmp(c.v?0.5:0.0,tb,0.008); }
      else if(c.k==='affr'){ setF(nextF,ts,0.03); setAmp(c.v?0.12:0,ts,0.006); setNoise(0,null,null,ts,0.004); setNoise(c.g,c.nf,1.4,ts+sd*0.3,0.004); setAmp(c.v?0.3:0,ts+sd*0.3); }
      else { setF(cF(c.f),ts,0.015); setAmp(c.k==='nasal'?0.38:0.6,ts,0.012); setNoise(0,null,null,ts); setAsp(0,ts); }
    };
    ph.onset.forEach(c=>{ seg(c,t,onT/nOn,vf.f); t+=onT/nOn; });
    const rel=Math.min(0.045,dur*0.15);
    const vEnd=t0+dur-coT-rel;
    setF(vf.f,t,nOn?0.025:0.01); setAmp(1,t,nOn?0.012:attack); setNoise(0,null,null,t,0.01); setAsp(0,t+0.01,0.02);
    if(!nOn){ setAsp(0.12,t0,0.003); setAsp(0,t0+0.04,0.02); } // soft breathy onset on vowel-initial words
    if(vf.f2 && vEnd>t){ const tm=t+(vEnd-t)*0.5; setF(vf.f2,tm,Math.max(0.03,(vEnd-tm)*0.35)); }
    t=Math.max(t,vEnd);
    ph.coda.forEach(c=>{ seg(c,t,coT/nCo,vf.f2||vf.f); t+=coT/nCo; });
    setAmp(0,t0+dur-rel,rel*0.45); setNoise(0,null,null,t0+dur-rel*0.5,0.006);
    if(P.breathOut && !nCo){ setAsp(0.15,t0+dur-rel,0.01); setAsp(0,t0+dur+0.05,0.03); }
  });
  ev.sort((a,b)=>a.t-b.t);
  const NK=KEYS.length, cv=new Float64Array(NK), tg=new Float64Array(NK), ta=new Float64Array(NK).fill(0.01);
  cv[KI.nf]=4000; cv[KI.nq]=1; V5.AH.forEach((f,i)=>cv[KI['f'+i]]=f); layers.forEach((_,li)=>cv[KI['fr'+li]]=220); tg.set(cv);
  const I_AMP=KI.amp,I_NA=KI.na,I_NF=KI.nf,I_NQ=KI.nq,I_ASP=KI.asp,I_VIB=KI.vib,I_SC=KI.sc,I_F=KI.f0,I_FR=KI.fr0;
  const CT=32, ctrlDt=CT/SR, MAXH=64;
  const tilt=P.tilt||1.15, ring=P.ring||0, twang=P.twang||0, sq=P.wave==='square', whisper=!!P.whisper, breath=P.breath||0.06;
  const LS = layers.map(ly=>{ const gs=GSCALE[ly.gender||P.gender||'m'], fs=(P.fscale||1)*(ly.fs||1);
    const src=new Float32Array(MAXH+1); for(let k=1;k<=MAXH;k++) src[k]= sq ? (k%2?1/k:0) : Math.pow(k,-tilt);
    return {gs:gs.map(x=>x*fs), src, a:new Float64Array(MAXH+1), da:new Float64Array(MAXH+1), p:Math.floor(Math.random()*4294967295), inc:0, nH:0, det:Math.pow(2,(ly.det||0)/1200), g:ly.g==null?1:ly.g}; });
  const fric=new Biquad(), br=[new Biquad(),new Biquad(),new Biquad()];
  const jp=[R2(),R2(),R2()]; function R2(){ return rnd()*10; }
  let vibPh=rnd(), rough=P.rough||0, jitter=P.jitter==null?6:P.jitter, shimmer=P.shimmer||0;
  const F=new Float64Array(5), B=new Float64Array(5);
  let ei=0; const lastN=notes[notes.length-1]; const endS=Math.min(N, Math.ceil(((lastN?lastN.t+lastN.dur:0)+0.4)*SR));
  const VK=0.06; const blk=new Float64Array(CT);
  for(let b0=0;b0<endS;b0+=CT){
    const now=b0/SR;
    while(ei<ev.length && ev[ei].t<=now){ const e=ev[ei++]; tg[e.k]=e.v; ta[e.k]=e.tau; }
    for(let k=0;k<NK;k++){ const d=tg[k]-cv[k]; if(d!==0){ cv[k]+=d*(1-Math.exp(-ctrlDt/ta[k])); if(Math.abs(tg[k]-cv[k])<1e-7) cv[k]=tg[k]; } }
    vibPh += (P.vibRate||5.5)*(1+0.06*Math.sin(now*0.9))*ctrlDt; if(vibPh>1) vibPh-=1;
    const jc = jitter*(0.5*Math.sin(TWO_PI*0.71*now+jp[0])+0.3*Math.sin(TWO_PI*2.3*now+jp[1])+0.2*Math.sin(TWO_PI*5.7*now+jp[2])) + jitter*0.25*(rnd()*2-1);
    const cents = cv[I_VIB]*Math.sin(TWO_PI*vibPh) + jc + cv[I_SC];
    const pmul = Math.pow(2,cents/1200);
    let am = cv[I_AMP] * (1 + shimmer*(0.6*Math.sin(TWO_PI*(P.tremRate||5)*now)+0.4*(rnd()-0.5)));
    if(rough) am *= 1 - rough*0.6*rnd();
    if(whisper) am=0;
    const maxF=Math.min(5800,SR*0.42);
    for(let li=0;li<LS.length;li++){ const L=LS[li];
      const f0 = cv[I_FR+li]*L.det*pmul;
      L.inc = f0/SR*4294967296;
      const nH=Math.min(MAXH, Math.floor(maxF/f0));
      for(let i=0;i<5;i++){ F[i]=cv[I_F+i]*L.gs[i]; B[i]=BW0[i]*(1+breath*1.5); }
      if(F[0]<f0*1.1) F[0]=f0*1.1; if(F[1]<F[0]+200) F[1]=F[0]+200; // singers tune F1 to the pitch
      B[0]=Math.max(B[0],f0*0.22);
      const top=Math.max(nH,L.nH);
      for(let k=1;k<=top;k++){
        let target=0;
        if(k<=nH){ const fk=k*f0, fk2=fk*fk; let prod=1;
          for(let i=0;i<5;i++){ const Fi2=F[i]*F[i], d=Fi2-fk2, bw=B[i]*fk; prod*=Fi2/Math.sqrt(d*d+bw*bw); }
          if(ring){ const x=(fk-2900)/420; prod*=1+ring*3*Math.exp(-x*x); }
          if(twang){ const x=(fk-2100)/450, y=(fk-1000)/250; prod*=(1+twang*2.6*Math.exp(-x*x))*(1-twang*0.45*Math.exp(-y*y)); }
          target=L.src[k]*prod*L.g*am*VK; if(target<1e-7) target=0; }
        if(target===0 && L.a[k]<1e-7 && L.a[k]>-1e-7){ L.a[k]=0; L.da[k]=0; } else L.da[k]=(target-L.a[k])/CT;
      }
      L.nH=top;
    }
    // noise paths
    fric.set('bp',cv[I_NF],cv[I_NQ]);
    for(let i=0;i<3;i++) br[i].set('bp',Math.min(F[i] || cv[I_F+i],9000),Math.max(2,(cv[I_F+i]||500)/(BW0[i]*2.2)));
    const brAmt = (whisper? cv[I_AMP]*0.9 : breath*cv[I_AMP]*0.7) + cv[I_ASP];
    const e=Math.min(endS,b0+CT), cnt=e-b0;
    blk.fill(0);
    for(let li=0;li<LS.length;li++){ const L=LS[li]; let p=L.p; const inc=L.inc, a=L.a, da=L.da, h=L.nH;
      for(let j=0;j<cnt;j++){ p=(p+inc)>>>0; let v=0; for(let k=1;k<=h;k++){ v+=a[k]*SIN[Math.imul(k,p)>>>20]; a[k]+=da[k]; } blk[j]+=v; }
      L.p=p; }
    const na=cv[I_NA]*(sq?0.75:0.55), ba=brAmt*(whisper?1.8:0.55), useB=brAmt>0.0005;
    for(let j=0;j<cnt;j++){ const nz=rnd()*2-1; let v=blk[j]+fric.p(nz)*na; if(useB) v+=(br[0].p(nz)+br[1].p(nz)*0.8+br[2].p(nz)*0.45)*ba; out[b0+j]=v; }
  }
  // loudness: normalize the active (sung) part to a consistent level
  let s2=0,cnt=0; for(let i=0;i<endS;i++){ const x=out[i]; if(x>1e-4||x<-1e-4){ s2+=x*x; cnt++; } }
  const rms=Math.sqrt(s2/Math.max(1,cnt))||1; let g=(D.voiceRms||0.2)/rms;
  if(P.drive){ const dr=P.drive; for(let i=0;i<endS;i++) out[i]=Math.tanh(out[i]*g*dr)/dr*1.3; g=1; }
  if(g!==1) for(let i=0;i<endS;i++) out[i]*=g;
  return out;
}

// ---------- Reverb (Freeverb-ish, mono) ----------
function reverb(send, out, amount){
  const combL=[1116,1188,1277,1356,1422,1491,1557,1617], apL=[556,441,341,225];
  const combs=combL.map(l=>({b:new Float32Array(l),i:0,s:0})), aps=apL.map(l=>({b:new Float32Array(l),i:0}));
  const fb=0.84, damp=0.22, g=0.015;
  for(let n=0;n<send.length;n++){
    const x=send[n]*g; let o=0;
    for(let c=0;c<8;c++){ const C=combs[c]; const y=C.b[C.i]; C.s = y*(1-damp)+C.s*damp; C.b[C.i]=x+C.s*fb; if(++C.i>=C.b.length) C.i=0; o+=y; }
    for(let a=0;a<4;a++){ const A=aps[a]; const bo=A.b[A.i]; const y=-o+bo; A.b[A.i]=o+bo*0.5; if(++A.i>=A.b.length) A.i=0; o=y; }
    out[n]+=o*amount;
  }
}

function applause(I, t, len){ const n=Math.floor(len*55); for(let i=0;i<n;i++){ const x=rnd(); const env=Math.sin(Math.PI*Math.min(1,x*1.3))*0.9+0.1; I.clap(t+x*len, 0.35*env*(0.5+rnd()*0.5)); } }

function renderSong(D){
  const tail = D.ending==='none'?0.8:4.4;
  const len = Math.ceil((D.songEnd+tail)*SR);
  const mix=new Float32Array(len), send=new Float32Array(len);
  const I = makeKit(mix, send);
  const style = D.style;
  D.bars.forEach((b,i)=>{ b.index=i; playBar(I, style, b, i===D.bars.length-2); });
  if(style!=='none') D.bars.filter(b=>b.isIntro).forEach(b=>{ for(let i=0;i<b.beats;i++) I.hat(b.t+i*b.spb,false,0.14); });
  const bellVol = D.preset.tts ? 0.16 : (D.bells===false?0:0.06);
  if(bellVol>0) D.notes.forEach(n=>I.bell(n.midi+D.transpose, n.t, Math.min(n.dur,1.2), bellVol));
  if(!D.preset.tts){ const v=sing(len, D); const wet=D.preset.wet||0.2; for(let i=0;i<len;i++){ mix[i]+=v[i]; send[i]+=v[i]*wet; } }
  const E=D.songEnd, tonic=rootMidi(D.key,48);
  if(D.ending==='sting'){
    const sp=0.16, pat=[[4,1],[2,0.5],[2,0.5],[3,1],[2,1.4],[-1,1],[6,1],[7,1]];
    const deg=d=> d<0?null : tonic+[0,2,4,5,7,9,11,12][d];
    let tt=E+0.15; pat.forEach(([d,l])=>{ const m=deg(d); if(m!==null){ I.keys([m+12,m],tt,sp*l*1.8,0.16,'square'); I.snare(tt,0.12);} tt+=sp*l*2; });
    I.kick(tt-0.32,0.6); I.crash(tt-0.32,0.18);
    applause(I, tt+0.1, 2.6);
  } else if(D.ending==='fail'){
    const st=E+0.2; [0,-1,-2,-3].forEach((s,i)=>I.trombone(tonic+2+s, st+i*0.55, i===3?1.6:0.48));
    for(let c=0;c<10;c++) I.chirp(st+2.6+c*0.32+rnd()*0.05, 0.05);
  } else if(D.ending==='big'){
    applause(I, E+0.4, 3.4);
  }
  reverb(send, mix, 1.0);
  if(D.raw) return mix;
  let peak=0; for(let i=0;i<len;i++){ const a=Math.abs(mix[i]); if(a>peak) peak=a; }
  // normalize + gentle soft clip for loudness
  const g = peak>0 ? 1.35/peak : 1, th=Math.tanh(1.35);
  for(let i=0;i<len;i++){ mix[i]=Math.tanh(mix[i]*g)/th*0.93; }
  return mix;
}

G.SIO_DSP = {renderSong, SR};
if(typeof G.importScripts==='function' && typeof G.document==='undefined'){
  G.onmessage = e=>{ try{ const out=renderSong(e.data); G.postMessage({ok:true, pcm:out, sr:SR},[out.buffer]); } catch(err){ G.postMessage({ok:false, error:String(err&&err.stack||err)}); } };
}
})(typeof self!=='undefined'?self:this);
