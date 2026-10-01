/* SingItOut — visuals: backgrounds, lyric animations, screen chaos, finales */
(function(){
const R = Math.random, PI2 = Math.PI*2;
const rr = (a,b)=>a+R()*(b-a);
const pick = a => a[Math.floor(R()*a.length)];
const hsl = (h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;

// ======================= BACKGROUND EFFECTS =======================
const FX = {};
FX.disco = {name:'Disco Inferno', emoji:'🪩',
  init(S,W,H){ S.tiles=[]; },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#14001f'); g.addColorStop(1,'#33004d'); c.fillStyle=g; c.fillRect(0,0,W,H);
    // floor
    const rows=6, cols=6, fy=H*0.68, fh=(H-fy)/rows;
    for(let r=0;r<rows;r++) for(let k=0;k<cols;k++){ const on=((r+k+I.beat)%3===0); const h=(I.beat*40+r*30+k*50)%360;
      c.fillStyle= on?hsl(h,100,55,0.55+I.pulse*0.4):hsl(h,60,18,0.6); c.fillRect(k*W/cols+2, fy+r*fh+2, W/cols-4, fh-4); }
    // beams
    c.save(); c.globalCompositeOperation='lighter';
    const bx=W/2, by=H*0.13;
    for(let i=0;i<8;i++){ const a=I.t*0.9+i*PI2/8; const h=(i*45+I.t*60)%360;
      c.fillStyle=hsl(h,100,60,0.12+I.pulse*0.12); c.beginPath(); c.moveTo(bx,by);
      c.lineTo(bx+Math.cos(a-0.07)*H*1.4, by+Math.abs(Math.sin(a-0.07))*H*1.4); c.lineTo(bx+Math.cos(a+0.07)*H*1.4, by+Math.abs(Math.sin(a+0.07))*H*1.4); c.fill(); }
    c.restore();
    // disco ball
    const r=Math.min(W,H)*0.09; c.save(); c.translate(bx,by);
    c.fillStyle='#ccc'; c.beginPath(); c.arc(0,0,r,0,PI2); c.fill(); c.clip();
    const n=8; for(let y=-n;y<n;y++) for(let x=-n;x<n;x++){ const sh=Math.sin(I.t*6+x*1.7+y*2.3); c.fillStyle= sh>0.75?'#fff':hsl((x*30+y*20+I.t*80)%360,40,50+sh*25); c.fillRect(x*r/n*1.2+((I.t*30)%(r/n*1.2)), y*r/n*1.2, r/n*1.1, r/n*1.1); }
    c.restore(); c.strokeStyle='#888'; c.beginPath(); c.moveTo(bx,0); c.lineTo(bx,by-r); c.stroke();
  }};
FX.warp = {name:'Space Warp', emoji:'🚀',
  init(S,W,H){ S.st=[]; for(let i=0;i<220;i++) S.st.push({x:rr(-1,1),y:rr(-1,1),z:R()}); },
  draw(c,W,H,I,S){
    c.fillStyle='rgba(2,0,12,0.35)'; c.fillRect(0,0,W,H);
    const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,H*0.6); const h=(I.t*20)%360; g.addColorStop(0,hsl(h,80,30,0.25)); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
    const sp=0.25+I.pulse*1.2+(I.noteNorm||0)*0.3; c.lineCap='round';
    S.st.forEach(s=>{ const pz=s.z; s.z-=I.dt*sp; if(s.z<=0.02){ s.x=rr(-1,1); s.y=rr(-1,1); s.z=1; return; }
      const k=Math.min(W,H)*0.5; const x=W/2+s.x/s.z*k, y=H/2+s.y/s.z*k, px=W/2+s.x/pz*k, py=H/2+s.y/pz*k;
      c.strokeStyle=hsl((h+s.x*90)%360,90,80,1-s.z); c.lineWidth=(1-s.z)*4+0.5; c.beginPath(); c.moveTo(px,py); c.lineTo(x,y); c.stroke(); });
  }};
FX.underwater = {name:'Under the Sea', emoji:'🐠',
  init(S,W,H){ S.b=[]; for(let i=0;i<40;i++) S.b.push({x:R()*W,y:R()*H,r:rr(3,14),s:rr(30,90)}); S.fish=[]; },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a6aa8'); g.addColorStop(1,'#021c3a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.save(); c.globalCompositeOperation='lighter';
    for(let i=0;i<7;i++){ c.strokeStyle=`rgba(120,220,255,${0.05+I.pulse*0.05})`; c.lineWidth=18; c.beginPath(); for(let x=0;x<=W;x+=20){ const y=H*0.1*i+Math.sin(x*0.01+I.t*1.3+i)*25; x?c.lineTo(x,y):c.moveTo(x,y);} c.stroke(); }
    c.restore();
    for(let k=0;k<9;k++){ const x=W*(k+0.5)/9; c.strokeStyle=hsl(130+k*5,60,30); c.lineWidth=8; c.beginPath(); c.moveTo(x,H); for(let s=1;s<=6;s++){ c.lineTo(x+Math.sin(I.t*1.5+s*0.7+k)*s*5, H-s*H*0.05);} c.stroke(); }
    S.b.forEach(b=>{ b.y-=b.s*I.dt*(1+I.pulse); b.x+=Math.sin(I.t*3+b.r)*0.5; if(b.y<-20){b.y=H+20;b.x=R()*W;} c.strokeStyle='rgba(200,240,255,0.7)'; c.lineWidth=1.5; c.beginPath(); c.arc(b.x,b.y,b.r,0,PI2); c.stroke(); c.fillStyle='rgba(255,255,255,0.5)'; c.beginPath(); c.arc(b.x-b.r*0.3,b.y-b.r*0.3,b.r*0.25,0,PI2); c.fill(); });
    if(I.onBeat && R()<0.35) S.fish.push({x:-60,y:rr(H*0.1,H*0.7),v:rr(60,160),e:pick(['🐠','🐟','🐡','🦈','🐙','🦑','🐬'])});
    c.font=`${Math.round(W*0.1)}px serif`; S.fish=S.fish.filter(f=>{ f.x+=f.v*I.dt; c.save(); c.translate(f.x,f.y+Math.sin(I.t*4+f.y)*8); c.scale(-1,1); c.fillText(f.e,0,0); c.restore(); return f.x<W+80; });
  }};
FX.lava = {name:'Lava Lamp', emoji:'🫠',
  init(S,W,H){ S.bl=[]; for(let i=0;i<9;i++) S.bl.push({x:R()*W,y:R()*H,r:rr(0.18,0.32)*W,vx:rr(-20,20),vy:rr(-40,40),h:rr(0,60)}); },
  draw(c,W,H,I,S){
    c.fillStyle='#2a0018'; c.fillRect(0,0,W,H);
    c.save(); c.globalCompositeOperation='lighter';
    S.bl.forEach((b,i)=>{ b.x+=b.vx*I.dt; b.y+=b.vy*I.dt*(1+I.pulse*2); if(b.x<0||b.x>W) b.vx*=-1; if(b.y<0||b.y>H) b.vy*=-1;
      const r=b.r*(1+I.pulse*0.15+Math.sin(I.t*2+i)*0.08); const g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,r); const h=(b.h+I.t*15+i*20)%360;
      g.addColorStop(0,hsl(h,100,60,0.9)); g.addColorStop(0.5,hsl(h+20,100,45,0.45)); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(b.x,b.y,r,0,PI2); c.fill(); });
    c.restore();
  }};
FX.synthwave = {name:'Retro Synthwave', emoji:'🌆',
  init(){}, draw(c,W,H,I){
    const hz=H*0.55; const g=c.createLinearGradient(0,0,0,hz); g.addColorStop(0,'#12002b'); g.addColorStop(0.6,'#7a0a6e'); g.addColorStop(1,'#ff6a3d'); c.fillStyle=g; c.fillRect(0,0,W,hz);
    const sr=W*0.32*(1+I.pulse*0.04); const sg=c.createLinearGradient(0,hz-sr,0,hz); sg.addColorStop(0,'#ffe259'); sg.addColorStop(1,'#ff2e88'); c.fillStyle=sg; c.beginPath(); c.arc(W/2,hz,sr,Math.PI,0); c.fill();
    c.fillStyle='#7a0a6e'; for(let i=0;i<7;i++){ const y=hz-sr*0.1-i*sr*0.12; c.fillRect(W/2-sr,y,sr*2,2+i*0.9); }
    c.fillStyle='#1b0030'; c.beginPath(); c.moveTo(0,hz); for(let x=0;x<=W;x+=W/12){ c.lineTo(x, hz-Math.abs(Math.sin(x*0.013+1))*H*0.09-15); } c.lineTo(W,hz); c.fill();
    c.fillStyle='#0b0016'; c.fillRect(0,hz,W,H-hz);
    c.strokeStyle=`rgba(255,40,200,${0.6+I.pulse*0.4})`; c.lineWidth=2; c.shadowColor='#ff2ec8'; c.shadowBlur=8;
    for(let i=-12;i<=12;i++){ c.beginPath(); c.moveTo(W/2+i*W*0.02,hz); c.lineTo(W/2+i*W*0.35,H); c.stroke(); }
    const off=(I.t*0.9)%1; for(let k=0;k<14;k++){ const z=(k+off)/14; const y=hz+(H-hz)*z*z; c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    c.shadowBlur=0;
  }};
FX.confetti = {name:'Confetti Party', emoji:'🎉',
  init(S,W,H){ S.p=[]; for(let i=0;i<90;i++) S.p.push(this.mk(W,H,true)); },
  mk(W,H,any){ return {x:R()*W,y:any?R()*H:-20,w:rr(6,14),h:rr(8,18),r:R()*PI2,vr:rr(-6,6),vy:rr(60,160),vx:rr(-30,30),c:hsl(R()*360,90,60)}; },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,W,H); const h=(I.t*10)%360; g.addColorStop(0,hsl(h,70,85)); g.addColorStop(1,hsl(h+60,70,75)); c.fillStyle=g; c.fillRect(0,0,W,H);
    if(I.onDown) for(let i=0;i<40;i++){ const p=this.mk(W,H); p.x=W*(R()<0.5?0.05:0.95); p.y=H*0.9; p.vy=-rr(300,600); p.vx=(p.x<W/2?1:-1)*rr(80,260); S.p.push(p); }
    S.p=S.p.filter(p=>{ p.vy+= (p.vy<150?500:0)*I.dt; p.x+=p.vx*I.dt; p.y+=p.vy*I.dt; p.r+=p.vr*I.dt; c.save(); c.translate(p.x,p.y); c.rotate(p.r); c.scale(1,Math.sin(p.r*2)); c.fillStyle=p.c; c.fillRect(-p.w/2,-p.h/2,p.w,p.h); c.restore(); if(p.y>H+30){ if(S.p.length<130){ Object.assign(p,this.mk(W,H)); return true;} return false;} return true; });
  }};
FX.matrix = {name:'The Matrix', emoji:'🕶️',
  init(S,W,H){ S.fs=Math.round(W/22); S.cols=Math.ceil(W/S.fs); S.y=Array.from({length:S.cols},()=>R()*-50); S.words={}; },
  draw(c,W,H,I,S){
    c.fillStyle='rgba(0,8,0,0.16)'; c.fillRect(0,0,W,H); c.font=`${S.fs}px monospace`;
    const ch='アカサタナハマヤラワ0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
    if(I.wordText){ const col=Math.floor(R()*S.cols); S.words[col]={s:I.wordText.toUpperCase(),i:0}; }
    for(let i=0;i<S.cols;i++){ const w=S.words[i]; let t=w? w.s[w.i++] : ch[Math.floor(R()*ch.length)]; if(w&&w.i>=w.s.length) delete S.words[i];
      c.fillStyle= w? '#eaffea' : (R()<0.1?'#b6ffb6':'#1cff4a'); c.fillText(t||'',i*S.fs,S.y[i]*S.fs);
      S.y[i]+= 0.5+I.pulse*0.8; if(S.y[i]*S.fs>H && R()>0.96) S.y[i]=0; }
  }};
FX.kaleido = {name:'Kaleidoscope', emoji:'🔮',
  init(){}, draw(c,W,H,I){
    c.fillStyle='#08000f'; c.fillRect(0,0,W,H); const n=12, R0=Math.hypot(W,H)/2;
    c.save(); c.translate(W/2,H/2); c.rotate(I.t*0.2);
    for(let k=0;k<n;k++){ c.save(); c.rotate(k*PI2/n); if(k%2) c.scale(1,-1);
      for(let j=0;j<7;j++){ const d=((j*0.15+I.t*0.12)%1)*R0; const s=12+Math.sin(I.t*2+j)*8+I.pulse*12; const h=(j*50+I.t*40+(I.noteNorm||0)*120)%360;
        c.fillStyle=hsl(h,95,60,0.85); c.beginPath(); if(j%3===0){ c.arc(d,d*0.22,s,0,PI2);} else if(j%3===1){ c.moveTo(d,0); c.lineTo(d+s,s*1.4); c.lineTo(d-s,s*1.4);} else { c.rect(d-s/2,d*0.2,s,s*0.6);} c.fill(); }
      c.restore(); }
    c.restore();
  }};
FX.glitch = {name:'Glitch TV', emoji:'📺',
  init(){}, draw(c,W,H,I){
    const bars=['#c0c0c0','#c0c000','#00c0c0','#00c000','#c000c0','#c00000','#0000c0'];
    bars.forEach((col,i)=>{ c.fillStyle=col; c.fillRect(i*W/7,0,W/7+1,H*0.7); });
    c.fillStyle='#111'; c.fillRect(0,H*0.7,W,H*0.3);
    for(let i=0;i<7;i++){ c.fillStyle=pick(['#fff','#000','#0ff','#f0f','#ff0']); c.fillRect(i*W/7,H*0.7,W/7,H*0.04); }
    const n=8+Math.floor(I.pulse*30);
    for(let i=0;i<n;i++){ const y=R()*H, h=rr(2,30); const sx=rr(-60,60)*(I.pulse+0.2); c.drawImage(c.canvas,0,y,W,h,sx,y,W,h); }
    for(let i=0;i<120;i++){ c.fillStyle=`rgba(255,255,255,${R()*0.25})`; c.fillRect(R()*W,R()*H,rr(1,4),rr(1,3)); }
    c.fillStyle='rgba(0,0,0,0.18)'; for(let y=0;y<H;y+=4) c.fillRect(0,y,W,2);
    if(I.onDown){ c.fillStyle=`rgba(${pick(['255,0,80','0,255,200','255,255,0'])},0.25)`; c.fillRect(0,0,W,H); }
  }};
FX.storm = {name:'Thunderstorm', emoji:'⛈️',
  init(S,W,H){ S.rain=[]; for(let i=0;i<160;i++) S.rain.push({x:R()*W,y:R()*H,l:rr(10,26),v:rr(500,900)}); S.bolt=null; S.flash=0; },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a1f2e'); g.addColorStop(1,'#05070c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    for(let i=0;i<6;i++){ const x=((i*W/4+I.t*15)%(W*1.5))-W*0.25, y=H*0.08+(i%2)*H*0.05; const r=W*0.35; const cg=c.createRadialGradient(x,y,0,x,y,r); cg.addColorStop(0,'rgba(70,75,95,0.9)'); cg.addColorStop(1,'rgba(30,32,45,0)'); c.fillStyle=cg; c.fillRect(x-r,y-r,r*2,r*2); }
    if((I.onDown && R()<0.6) || (I.noteHigh && I.onNote && R()<0.3)){ S.flash=1; let x=rr(W*0.1,W*0.9), y=0; S.bolt=[[x,y]]; while(y<H*0.75){ x+=rr(-40,40); y+=rr(20,50); S.bolt.push([x,y]); } S.boltLife=0.25; }
    if(S.bolt && S.boltLife>0){ S.boltLife-=I.dt; c.strokeStyle='#fff'; c.shadowColor='#9cf'; c.shadowBlur=25; c.lineWidth=4; c.beginPath(); S.bolt.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.stroke(); c.shadowBlur=0; }
    c.strokeStyle='rgba(170,190,230,0.55)'; c.lineWidth=1.3; c.beginPath();
    S.rain.forEach(d=>{ d.y+=d.v*I.dt; d.x-=d.v*I.dt*0.15; if(d.y>H){d.y=-20; d.x=R()*W*1.2;} c.moveTo(d.x,d.y); c.lineTo(d.x+d.l*0.15,d.y-d.l); }); c.stroke();
    if(S.flash>0){ c.fillStyle=`rgba(220,235,255,${S.flash*0.6})`; c.fillRect(0,0,W,H); S.flash-=I.dt*4; }
  }};
FX.fireworks = {name:'Fireworks', emoji:'🎆',
  init(S){ S.r=[]; S.p=[]; },
  draw(c,W,H,I,S){
    c.fillStyle='rgba(3,3,20,0.22)'; c.fillRect(0,0,W,H);
    if(I.onBeat) S.r.push({x:rr(W*0.15,W*0.85),y:H,vy:-rr(H*0.9,H*1.3),vx:rr(-40,40),h:R()*360,ty:rr(H*0.12,H*0.45)});
    S.r=S.r.filter(r=>{ r.y+=r.vy*I.dt; r.x+=r.vx*I.dt; c.fillStyle='#ffd'; c.fillRect(r.x-1.5,r.y-1.5,3,8); if(r.y<=r.ty){ const n=50; const kind=Math.floor(R()*3); for(let i=0;i<n;i++){ const a=i/n*PI2, sp=kind===1? 150 : rr(40,240); S.p.push({x:r.x,y:r.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:1,h:kind===2?(r.h+i*7):r.h}); } return false;} return true; });
    S.p=S.p.filter(p=>{ p.vy+=120*I.dt; p.vx*=0.985; p.vy*=0.985; p.x+=p.vx*I.dt; p.y+=p.vy*I.dt; p.l-=I.dt*0.6; c.fillStyle=hsl(p.h%360,100,65,p.l); c.beginPath(); c.arc(p.x,p.y,2.2,0,PI2); c.fill(); return p.l>0; });
  }};
FX.emoji = {name:'Emoji Storm', emoji:'🤪',
  init(S,W,H,A){ S.set=[A.song.emoji,'🤪','🎤','🎵','💥','🙃','🦄','🍕','🐸','🔥','👀','🥳','🎶','🤖','🌮']; S.e=[]; for(let i=0;i<26;i++) S.e.push(this.mk(S,W,H)); },
  mk(S,W,H){ return {x:R()*W,y:R()*H,vx:rr(-90,90),vy:rr(-90,90),r:R()*PI2,vr:rr(-3,3),s:rr(0.06,0.13)*W,e:pick(S.set)}; },
  draw(c,W,H,I,S){
    const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,H*0.8); const h=(I.t*25)%360; g.addColorStop(0,hsl(h,90,65)); g.addColorStop(1,hsl(h+120,90,35)); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.textAlign='center'; c.textBaseline='middle';
    S.e.forEach(e=>{ e.x+=e.vx*I.dt*(1+I.pulse*2); e.y+=e.vy*I.dt*(1+I.pulse*2); e.r+=e.vr*I.dt; if(e.x<0||e.x>W) e.vx*=-1; if(e.y<0||e.y>H) e.vy*=-1;
      c.save(); c.translate(e.x,e.y); c.rotate(e.r); const sc=1+I.pulse*0.35; c.scale(sc,sc); c.font=`${Math.round(e.s)}px serif`; c.fillText(e.e,0,0); c.restore(); });
  }};
FX.haunted = {name:'Haunted Mansion', emoji:'👻',
  init(S,W,H){ S.g=[]; for(let i=0;i<5;i++) S.g.push({p:R()*10,y:rr(0.15,0.7)*H,s:rr(0.4,1)}); S.bats=[]; S.eyes=[]; for(let i=0;i<10;i++) S.eyes.push({x:R()*W,y:rr(0.55,0.95)*H,ph:R()*10}); },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#160624'); g.addColorStop(1,'#03010a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='#f5f0c8'; c.shadowColor='#fff8c0'; c.shadowBlur=40; c.beginPath(); c.arc(W*0.78,H*0.13,W*0.11,0,PI2); c.fill(); c.shadowBlur=0;
    c.fillStyle='#0a0412'; c.beginPath(); c.moveTo(0,H*0.75); c.lineTo(W*0.15,H*0.62); c.lineTo(W*0.25,H*0.62); c.lineTo(W*0.25,H*0.5); c.lineTo(W*0.32,H*0.42); c.lineTo(W*0.39,H*0.5); c.lineTo(W*0.39,H*0.6); c.lineTo(W*0.6,H*0.6); c.lineTo(W*0.6,H*0.47); c.lineTo(W*0.7,H*0.38); c.lineTo(W*0.8,H*0.47); c.lineTo(W*0.8,H*0.7); c.lineTo(W,H*0.72); c.lineTo(W,H); c.lineTo(0,H); c.fill();
    c.fillStyle=`rgba(255,220,90,${0.5+Math.sin(I.t*9)*0.3})`; c.fillRect(W*0.3,H*0.5,W*0.04,H*0.04); c.fillRect(W*0.66,H*0.5,W*0.04,H*0.04);
    S.eyes.forEach(e=>{ const bl=Math.sin(I.t*1.3+e.ph)>0.93; if(bl) return; c.fillStyle='#ff2a2a'; c.beginPath(); c.ellipse(e.x,e.y,5,3+I.pulse*2,0,0,PI2); c.ellipse(e.x+14,e.y,5,3+I.pulse*2,0,0,PI2); c.fill(); });
    for(let i=0;i<4;i++){ const x=((I.t*20*(i+1))%(W*1.6))-W*0.3; const fg=c.createRadialGradient(x,H*0.85,0,x,H*0.85,W*0.45); fg.addColorStop(0,'rgba(170,150,200,0.22)'); fg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=fg; c.fillRect(0,H*0.5,W,H*0.5); }
    c.font=`${Math.round(W*0.13)}px serif`; c.textAlign='center';
    S.g.forEach((g2,i)=>{ const x=W/2+Math.sin(I.t*g2.s+g2.p)*W*0.4, y=g2.y+Math.sin(I.t*2+i)*20; c.globalAlpha=0.55+Math.sin(I.t*3+i)*0.3; c.fillText('👻',x,y); }); c.globalAlpha=1;
    if(I.onDown) S.bats.push({x:-30,y:rr(H*0.1,H*0.4),v:rr(150,280)});
    c.font=`${Math.round(W*0.08)}px serif`; S.bats=S.bats.filter(b=>{ b.x+=b.v*I.dt; c.fillText('🦇',b.x,b.y+Math.sin(I.t*15+b.y)*10); return b.x<W+40; });
  }};
FX.vortex = {name:'Rainbow Vortex', emoji:'🌀',
  init(){}, draw(c,W,H,I){
    c.save(); c.translate(W/2,H/2); const M=Math.hypot(W,H)/2;
    for(let i=40;i>0;i--){ const r=M*i/40; c.fillStyle=hsl((i*18-I.t*120)%360,95,55-(i%2)*12); c.beginPath(); c.arc(0,0,r*(1+I.pulse*0.05),0,PI2); c.fill(); }
    c.rotate(I.t*1.4); c.globalAlpha=0.35; c.fillStyle='#000';
    for(let a=0;a<6;a++){ c.beginPath(); for(let r=0;r<M;r+=8){ const ang=a*PI2/6+r*0.012; c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);} for(let r=M;r>0;r-=8){ const ang=a*PI2/6+r*0.012+0.25; c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);} c.fill(); }
    c.restore(); c.globalAlpha=1;
  }};
FX.eyeballs = {name:'Weird Eyeballs', emoji:'👁️',
  init(S,W,H){ S.e=[]; let tries=0; while(S.e.length<16 && tries++<400){ const r=rr(0.06,0.13)*W, x=rr(r,W-r), y=rr(r,H-r); if(S.e.every(o=>Math.hypot(o.x-x,o.y-y)>o.r+r+4)) S.e.push({x,y,r,bl:0,h:pick([200,120,30,280,0])}); } S.look={x:W/2,y:H/2}; },
  draw(c,W,H,I,S){
    const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,H); g.addColorStop(0,'#ff9fb5'); g.addColorStop(1,'#a3204a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    const tx = I.lyricX!=null? I.lyricX : W/2+Math.sin(I.t)*W*0.4, ty = I.lyricY!=null? I.lyricY : H/2+Math.cos(I.t*0.7)*H*0.3;
    S.look.x+=(tx-S.look.x)*0.1; S.look.y+=(ty-S.look.y)*0.1;
    S.e.forEach((e,i)=>{ if(I.onDown && R()<0.4) e.bl=0.18; e.bl=Math.max(0,e.bl-I.dt);
      const r=e.r*(1+I.pulse*0.06);
      c.fillStyle='#fff'; c.beginPath(); c.arc(e.x,e.y,r,0,PI2); c.fill(); c.strokeStyle='rgba(200,0,30,0.35)'; c.lineWidth=1; for(let k=0;k<5;k++){ c.beginPath(); const a=k*1.3+i; c.moveTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r); c.lineTo(e.x+Math.cos(a+0.2)*r*0.6,e.y+Math.sin(a+0.3)*r*0.6); c.stroke(); }
      const a=Math.atan2(S.look.y-e.y,S.look.x-e.x), d=Math.min(r*0.42,Math.hypot(S.look.x-e.x,S.look.y-e.y)*0.2);
      const px=e.x+Math.cos(a)*d, py=e.y+Math.sin(a)*d;
      c.fillStyle=hsl(e.h,70,45); c.beginPath(); c.arc(px,py,r*0.45,0,PI2); c.fill(); c.fillStyle='#000'; c.beginPath(); c.arc(px,py,r*(0.2+I.pulse*0.08),0,PI2); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(px-r*0.12,py-r*0.12,r*0.08,0,PI2); c.fill();
      if(e.bl>0){ c.fillStyle='#e8798f'; c.beginPath(); c.arc(e.x,e.y,r+1,0,PI2); c.fill(); c.strokeStyle='#7a1030'; c.lineWidth=3; c.beginPath(); c.moveTo(e.x-r,e.y); c.quadraticCurveTo(e.x,e.y+r*0.5,e.x+r,e.y); c.stroke(); }
    });
  }};
FX.snow = {name:'Winter Wonderland', emoji:'❄️',
  init(S,W,H){ S.f=[]; for(let i=0;i<140;i++) S.f.push({x:R()*W,y:R()*H,r:rr(1,4),v:rr(30,90),p:R()*10}); },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0b1d4a'); g.addColorStop(1,'#3a5c9c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='#e8f1ff'; c.beginPath(); c.moveTo(0,H*0.8); c.quadraticCurveTo(W*0.3,H*0.68,W*0.6,H*0.8); c.quadraticCurveTo(W*0.85,H*0.72,W,H*0.78); c.lineTo(W,H); c.lineTo(0,H); c.fill();
    c.font=`${Math.round(W*0.14)}px serif`; c.fillText('🎄',W*0.1,H*0.82); c.fillText('⛄',W*0.72,H*0.84);
    for(let i=0;i<16;i++){ const on=(i+I.beat)%3===0; c.fillStyle=on?hsl(i*60%360,100,60):hsl(i*60%360,40,30); c.beginPath(); c.arc(W*(i+0.5)/16, H*0.06+Math.sin(i*0.8)*12, 5, 0, PI2); c.fill(); }
    c.fillStyle='#fff'; S.f.forEach(f=>{ f.y+=f.v*I.dt; f.x+=Math.sin(I.t+f.p)*0.6; if(f.y>H){f.y=-5;f.x=R()*W;} c.beginPath(); c.arc(f.x,f.y,f.r,0,PI2); c.fill(); });
  }};
FX.food = {name:'Food Chorus Line', emoji:'🌮',
  init(S,W,H){ S.items=['🍕','🌮','🍩','🥑','🍔','🌭','🧁','🍟','🥨','🍉','🍌','🥦']; },
  draw(c,W,H,I,S){
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#ffcf3f'); g.addColorStop(1,'#ff6f3c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    for(let i=0;i<14;i++){ c.fillStyle=i%2?'rgba(255,255,255,0.12)':'rgba(255,0,80,0.08)'; c.beginPath(); c.moveTo(W/2,H*1.1); const a=i/14*Math.PI+I.t*0.2; c.lineTo(W/2+Math.cos(Math.PI+a)*H*2,H*1.1+Math.sin(Math.PI+a)*H*2); c.lineTo(W/2+Math.cos(Math.PI+a+0.22)*H*2,H*1.1+Math.sin(Math.PI+a+0.22)*H*2); c.fill(); }
    const rows=4, cols=4, s=W/cols*0.62; c.font=`${Math.round(s)}px serif`; c.textAlign='center'; c.textBaseline='middle';
    for(let r=0;r<rows;r++) for(let k=0;k<cols;k++){ const idx=(r*cols+k)%S.items.length; const ph=I.beatF*Math.PI + (k+r)%2*Math.PI;
      const x=(k+0.5)*W/cols, y=H*0.18+r*H*0.22 - Math.abs(Math.sin(ph))*H*0.035; c.save(); c.translate(x,y); c.rotate(Math.sin(ph)*0.35); const sq=1+Math.abs(Math.cos(ph))*0.12; c.scale(1/sq,sq); c.fillText(S.items[idx],0,0); c.restore(); }
  }};
FX.plasma = {name:'Psychedelic Plasma', emoji:'🍄',
  init(S){ S.cv=document.createElement('canvas'); S.cv.width=48; S.cv.height=80; S.cx=S.cv.getContext('2d'); S.img=S.cx.createImageData(48,80); },
  draw(c,W,H,I,S){
    const d=S.img.data, t=I.t*(1+I.pulse*0.5), w=48, h=80;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const v=Math.sin(x*0.16+t)+Math.sin((y*0.1+t)*1.3)+Math.sin((x*0.1+y*0.12+t)*0.9)+Math.sin(Math.sqrt((x-24)*(x-24)+(y-40)*(y-40))*0.2-t*2);
      const k=(y*w+x)*4; d[k]=128+127*Math.sin(v*Math.PI); d[k+1]=128+127*Math.sin(v*Math.PI+2.1+I.pulse); d[k+2]=128+127*Math.sin(v*Math.PI+4.2); d[k+3]=255; }
    S.cx.putImageData(S.img,0,0); c.imageSmoothingEnabled=true; c.drawImage(S.cv,0,0,W,H);
  }};

// ======================= LYRIC MODES =======================
const LY = {};
const el=(cls,txt,parent)=>{ const e=document.createElement('div'); e.className=cls; if(txt!=null) e.textContent=txt; if(parent) parent.appendChild(e); return e; };
function offsetTo(e, anc){ let x=0,y=0; while(e && e!==anc){ x+=e.offsetLeft; y+=e.offsetTop; e=e.offsetParent; } return {x,y}; }
const FONTS=['"Arial Black",Impact,sans-serif','"Marker Felt","Comic Sans MS",cursive','"Courier New",monospace','Georgia,serif','"Chalkboard SE","Comic Sans MS",cursive','"Futura","Trebuchet MS",sans-serif','"American Typewriter",serif','"Copperplate",fantasy'];
const COLORS=['#fff','#ffe600','#00f0ff','#ff4fd8','#7CFF4F','#ff8a00','#b18cff'];
function sylDisplay(arr, n){ const w=arr.words[n.syl.w]; return n.syl.n>1 ? n.syl.text + (n.syl.si<n.syl.n-1?'-':'') : (w?w.display:n.syl.text); }
function wordOf(arr,n){ return arr.occ[n.occ].display; }

LY.karaoke = {name:'Karaoke', emoji:'🎤',
  init(S,root,arr){ S.box=el('ly-karaoke','',root); S.l1=el('k-line cur','',S.box); S.l2=el('k-line next','',S.box); S.ball=el('k-ball','🔴',root); S.line=-1; },
  build(S,arr,li){
    const fill=(lineEl,idx)=>{ lineEl.innerHTML=''; const spans=[]; if(idx>=arr.lines.length) return spans;
      arr.lines[idx].forEach(oi=>{ const o=arr.occ[oi]; const w=el('k-word','',lineEl);
        o.notes.forEach((ni,k)=>{ const n=arr.notes[ni]; const txt = o.notes.length>1 ? n.syl.text : o.display; const s=document.createElement('span'); s.textContent=txt; s.dataset.n=ni; w.appendChild(s); spans.push(s); });
        if(o.notes.length>1){ const p=o.display.match(/[!?.,]+$/); if(p){ const s=document.createElement('span'); s.textContent=p[0]; w.appendChild(s);} } });
      return spans; };
    S.spans=fill(S.l1,li); fill(S.l2,li+1); S.line=li;
    S.l1.classList.remove('pop'); void S.l1.offsetWidth; S.l1.classList.add('pop');
  },
  frame(S,arr,I){
    const n=I.note; if(!n) return; if(n.line!==S.line) this.build(S,arr,n.line);
    let cur=null; S.spans.forEach(s=>{ const ni=+s.dataset.n; const on=ni<=I.noteIdx; s.classList.toggle('on',on); s.classList.toggle('now',ni===I.noteIdx); if(ni===I.noteIdx) cur=s; });
    if(cur){ const o=offsetTo(cur,S.ball.parentNode); const p=Math.min(1,(I.t-n.t)/Math.max(0.05,n.dur));
      const x=o.x+cur.offsetWidth/2, y=o.y-18-Math.sin(p*Math.PI)*34; S.ball.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${1+(1-p)*0.3},${1-(1-p)*0.2})`; I.lyricX=x*I.dpr; I.lyricY=y*I.dpr; }
  }};
LY.slam = {name:'Word Slam', emoji:'💥',
  init(S,root){ S.root=el('ly-center','',root); },
  onNote(S,arr,n,I){ if(n.syl.si!==0 && n.syl.n>1){ if(S.cur){ S.cur.classList.remove('throb'); void S.cur.offsetWidth; S.cur.classList.add('throb'); } return; }
    if(S.cur){ const old=S.cur; old.classList.add('slam-out'); setTimeout(()=>old.remove(),500); }
    const e=el('slam',wordOf(arr,n),S.root); e.style.fontFamily=pick(FONTS); e.style.color=pick(COLORS); e.style.setProperty('--rot',rr(-12,12)+'deg');
    const len=wordOf(arr,n).length; e.style.fontSize=`min(${Math.max(9,26-len*1.4)}vw, 120px)`; S.cur=e; I.fx('shake-s'); }
};
LY.fly = {name:'Flying Words', emoji:'🕊️',
  init(S,root){ S.root=el('ly-abs','',root); S.n=0; },
  onNote(S,arr,n,I){ if(n.syl.si!==0) return; const e=el('flyw',wordOf(arr,n),S.root); const W=S.root.clientWidth,H=S.root.clientHeight;
    e.style.fontFamily=pick(FONTS); e.style.color=pick(COLORS); e.style.fontSize=rr(8,14)+'vw';
    const x=rr(0.08,0.6)*W, y=rr(0.12,0.8)*H; const side=Math.floor(R()*4); const fx=[-W, W*2, x, x][side], fy=[y, y, -H, H*2][side];
    e.style.left=x+'px'; e.style.top=y+'px'; e.style.transform=`translate(${fx-x}px,${fy-y}px) rotate(${rr(-720,720)}deg) scale(0.3)`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ e.style.transform=`translate(0,0) rotate(${rr(-15,15)}deg) scale(1)`; }));
    setTimeout(()=>{ e.style.opacity='0'; e.style.transform+=' scale(1.6)'; },2200); setTimeout(()=>e.remove(),3200); }
};
LY.spiral = {name:'Spiral Galaxy', emoji:'🌀',
  init(S,root){ S.root=el('ly-abs spiral','',root); S.items=[]; },
  onNote(S,arr,n){ if(n.syl.si!==0) return; const e=el('spw',wordOf(arr,n),S.root); e.style.color=pick(COLORS); e.style.fontFamily=pick(FONTS); S.items.push({e,born:performance.now(),a:R()*PI2}); if(S.items.length>14){ S.items.shift().e.remove(); } },
  frame(S,arr,I){ const W=S.root.clientWidth,H=S.root.clientHeight, now=performance.now();
    S.items.forEach(it=>{ const age=(now-it.born)/1000; const r=age*Math.min(W,H)*0.12; const a=it.a+age*1.6; const sc=Math.max(0.2,1.6-age*0.25);
      it.e.style.transform=`translate(${W/2+Math.cos(a)*r}px,${H/2+Math.sin(a)*r}px) translate(-50%,-50%) rotate(${a+Math.PI/2}rad) scale(${sc})`; it.e.style.opacity=Math.max(0,1-age/6); }); }
};
LY.rain = {name:'Word Rain', emoji:'🌧️',
  init(S,root){ S.root=el('ly-abs','',root); S.items=[]; },
  onNote(S,arr,n){ const txt = n.syl.n>1 ? n.syl.text : wordOf(arr,n); const e=el('rainw',txt,S.root); e.style.color=pick(COLORS); e.style.fontFamily=pick(FONTS); e.style.fontSize=rr(7,12)+'vw';
    S.items.push({e,x:rr(0.05,0.75)*S.root.clientWidth,y:-60,vy:rr(20,80),r:rr(-30,30),vr:rr(-90,90)}); },
  frame(S,arr,I){ const H=S.root.clientHeight; S.items=S.items.filter(it=>{ it.vy+=600*I.dt; it.y+=it.vy*I.dt; it.r+=it.vr*I.dt; if(it.y>H*0.82 && it.vy>0){ it.vy*=-0.45; it.vr*=-0.6; if(Math.abs(it.vy)<60) it.dead=(it.dead||0)+1; }
      it.e.style.transform=`translate(${it.x}px,${it.y}px) rotate(${it.r}deg)`; if(it.dead>2||S.items.length>18&&it===S.items[0]){ it.e.style.opacity=0; setTimeout(()=>it.e.remove(),400); return false;} return true; }); }
};
LY.zoom = {name:'Hyper Zoom', emoji:'🔭',
  init(S,root){ S.root=el('ly-center','',root); },
  onNote(S,arr,n){ if(n.syl.si!==0) return; const e=el('zoomw',wordOf(arr,n),S.root); e.style.color=pick(COLORS); e.style.fontFamily=pick(FONTS); e.style.setProperty('--zr',rr(-40,40)+'deg'); setTimeout(()=>e.remove(),1900); }
};
LY.wave = {name:'Wavy Gravy', emoji:'🌊',
  init(S,root){ S.box=el('ly-center','',root); S.line=-1; },
  frame(S,arr,I){ const n=I.note; if(!n) return;
    if(n.line!==S.line){ S.line=n.line; S.box.innerHTML=''; S.letters=[]; const wrap=el('wave-line','',S.box);
      arr.lines[n.line].forEach(oi=>{ const o=arr.occ[oi]; const w=el('wave-word','',wrap); w.dataset.o=oi; [...o.display].forEach(ch=>{ const s=document.createElement('span'); s.textContent=ch; w.appendChild(s); S.letters.push({s,o:oi}); }); }); }
    S.letters.forEach((L,i)=>{ const cur=L.o===n.occ; const done=L.o<n.occ; const y=Math.sin(I.t*6+i*0.55)*(cur?18:7); const sc=cur?1.35:1;
      L.s.style.transform=`translateY(${y}px) scale(${sc}) rotate(${Math.sin(I.t*4+i)*(cur?12:3)}deg)`; L.s.style.color= cur? hsl((i*25+I.t*200)%360,100,65) : done?'#fff':'rgba(255,255,255,0.45)'; }); }
};
LY.typewriter = {name:'Typewriter', emoji:'⌨️',
  init(S,root){ S.box=el('ly-type','',root); S.lines={}; },
  frame(S,arr,I){ const n=I.note; if(!n) return; const li=n.line;
    if(!S.lines[li]){ const e=el('tw-line','',S.box); S.lines[li]=e; const ks=Object.keys(S.lines); if(ks.length>4){ const k=ks[0]; S.lines[k].remove(); delete S.lines[k]; } }
    // compute typed text of current line
    const occs=arr.lines[li]; let txt='';
    for(const oi of occs){ const o=arr.occ[oi]; const first=arr.notes[o.notes[0]]; if(first.t>I.t) break;
      const lastN=arr.notes[o.notes[o.notes.length-1]]; const prog=Math.min(1,(I.t-first.t)/Math.max(0.08,(lastN.t+lastN.dur*0.6-first.t)));
      txt += o.display.slice(0,Math.ceil(o.display.length*prog)) + (prog>=1?' ':''); }
    const e=S.lines[li]; if(e.dataset.t!==txt){ e.dataset.t=txt; e.textContent=txt; e.style.transform=`rotate(${rr(-1.5,1.5)}deg) translateX(${rr(-3,3)}px)`; }
    Object.values(S.lines).forEach(l=>l.classList.toggle('done',l!==e)); }
};
LY.bubble = {name:'Bubble Pop', emoji:'🫧',
  init(S,root){ S.root=el('ly-abs','',root); },
  onNote(S,arr,n){ if(n.syl.si!==0) return; const e=el('bub',wordOf(arr,n),S.root); const W=S.root.clientWidth;
    e.style.left=rr(0.05,0.6)*W+'px'; e.style.setProperty('--dx',rr(-60,60)+'px'); e.style.setProperty('--hue',Math.floor(R()*360)); setTimeout(()=>{ e.classList.add('pop'); },2600); setTimeout(()=>e.remove(),3000); }
};
LY.pianoroll = {name:'Pitch Roller', emoji:'🎹',
  init(S,root,arr){ S.root=el('ly-abs roll','',root); S.play=el('roll-head','',S.root); S.pills=arr.notes.map((n,i)=>{ const e=el('pill', sylDisplay(arr,n), null); e.style.setProperty('--h',(n.midi*29)%360); return e; }); S.shown=new Set(); },
  frame(S,arr,I){ const W=S.root.clientWidth,H=S.root.clientHeight, px=W*0.3, speed=W*0.42, span=Math.max(6,arr.maxMidi-arr.minMidi);
    S.play.style.left=px+'px';
    arr.notes.forEach((n,i)=>{ const x=px+(n.t-I.t)*speed; const vis=x>-W*0.5 && x<W*1.2; const e=S.pills[i];
      if(vis && !S.shown.has(i)){ S.root.appendChild(e); S.shown.add(i); } else if(!vis && S.shown.has(i)){ e.remove(); S.shown.delete(i); }
      if(vis){ const y=H*0.78-(n.midi-arr.minMidi)/span*H*0.55; const cur=i===I.noteIdx; e.style.width=Math.max(30,n.dur*speed-4)+'px'; e.style.transform=`translate(${x}px,${y}px) scale(${cur?1.25:1})`; e.classList.toggle('cur',cur); e.classList.toggle('past',i<I.noteIdx); if(cur){ I.lyricX=x*I.dpr; I.lyricY=y*I.dpr; } } }); }
};

// ======================= STAGE =======================
const CHAOS_FX = ['shake','zoompulse','hue','tilt','jelly','invert','flipx','rgb','squish'];
function Stage(dom, arr, opts){
  this.dom=dom; this.arr=arr; this.opts=opts;
  this.canvas=dom.querySelector('canvas'); this.c=this.canvas.getContext('2d'); this.lyr=dom.querySelector('.lyr'); this.stageEl=dom;
  this.lyr.innerHTML='';
  this.dpr=opts.size?1:Math.min(2,window.devicePixelRatio||1);
  this.resize();
  this.fxKey = FX[opts.fx]?opts.fx:'disco'; this.lyKey = LY[opts.lyric]?opts.lyric:'karaoke';
  this.bgS={}; this.lyS={};
  FX[this.fxKey].init(this.bgS,this.W,this.H,arr);
  if(!opts.noDom) LY[this.lyKey].init(this.lyS,this.lyr,arr);
  this.noteIdx=-1; this.beatIdx=0; this.pulse=0; this.beat=0; this.lastT=0; this.running=false;
}
Stage.prototype.resize=function(){ if(this.opts.size){ this.W=this.opts.size.w; this.H=this.opts.size.h; this.canvas.width=this.W; this.canvas.height=this.H; return; } this.W=Math.max(10,Math.round(this.dom.clientWidth*this.dpr)); this.H=Math.max(10,Math.round(this.dom.clientHeight*this.dpr)); this.canvas.width=this.W; this.canvas.height=this.H; };
Stage.prototype.fx=function(name){ const ch=this.opts.chaos||0; if(ch<=0) return; const el=this.stageEl; el.classList.remove(name); void el.offsetWidth; el.classList.add(name); clearTimeout(this['t_'+name]); this['t_'+name]=setTimeout(()=>el.classList.remove(name),700); };
Stage.prototype.start=function(getTime, onEnd){
  this.getTime=getTime; this.onEnd=onEnd; this.running=true; this.ended=false;
  const loop=()=>{ if(!this.running) return; this.frame(); this.raf=requestAnimationFrame(loop); };
  this.raf=requestAnimationFrame(loop);
};
Stage.prototype.stop=function(){ this.running=false; cancelAnimationFrame(this.raf); };
Stage.prototype.frame=function(){
  const arr=this.arr, t=this.getTime(); const dt=Math.min(0.1,Math.max(0,t-this.lastT)); this.lastT=t;
  const I={t,dt,dpr:this.dpr,pulse:this.pulse,beat:this.beat,onBeat:false,onDown:false,onNote:false,note:null,noteIdx:-1,fx:n=>this.fx(n)};
  while(this.beatIdx<arr.beats.length && arr.beats[this.beatIdx].t<=t){ const b=arr.beats[this.beatIdx++]; I.onBeat=true; this.beat++; this.pulse=1; if(b.down){ I.onDown=true; this.onDownbeat(); } }
  let newNotes=[];
  while(this.noteIdx+1<arr.notes.length && arr.notes[this.noteIdx+1].t<=t){ this.noteIdx++; newNotes.push(this.noteIdx); }
  const idx=this.noteIdx; const n= idx>=0? arr.notes[idx] : arr.notes[0];
  I.note=n; I.noteIdx=idx; I.noteNorm=(n.midi-arr.minMidi)/Math.max(1,arr.maxMidi-arr.minMidi); I.noteHigh=I.noteNorm>0.8;
  I.beat=this.beat; I.pulse=this.pulse; I.beatF = this.beat + Math.min(1,(t-(arr.beats[this.beatIdx-1]||{t:0}).t)/0.5);
  if(newNotes.length){ I.onNote=true; const nn=arr.notes[newNotes[newNotes.length-1]]; if(nn.syl.si===0) I.wordText=arr.occ[nn.occ].display;
    if(!this.opts.noDom) newNotes.forEach(i=>{ const m=LY[this.lyKey]; if(m.onNote) m.onNote(this.lyS,arr,arr.notes[i],I); });
    if(I.noteHigh && (this.opts.chaos||0)>=2 && R()<0.5) this.fx(pick(['shake','zoompulse'])); }
  const L=LY[this.lyKey]; if(!this.opts.noDom && L.frame && idx>=0) L.frame(this.lyS,arr,I);
  this.c.save(); FX[this.fxKey].draw(this.c,this.W,this.H,I,this.bgS); this.c.restore();
  if(this.postDraw){ this.c.save(); this.postDraw(this.c,this.W,this.H,I); this.c.restore(); }
  this.pulse*=Math.pow(0.02,dt);
  if(this.onProgress) this.onProgress(t/arr.songEnd);
  if(!this.ended && t>=arr.songEnd){ this.ended=true; this.onEnd&&this.onEnd(); }
};
Stage.prototype.onDownbeat=function(){
  const ch=this.opts.chaos||0; if(!ch) return;
  if(ch===1){ if(R()<0.5) this.fx('zoompulse'); return; }
  const pool = ch===2 ? ['zoompulse','shake','hue','tilt','squish'] : CHAOS_FX;
  if(R()< (ch===2?0.55:0.85)) this.fx(pick(pool));
};

// ======================= FINALES =======================
const REVIEWS = ['The Grammys have been notified. They are concerned.','Beethoven rolled over in his grave. Approvingly.','Your neighbors have filed a formal complaint (5 stars).','Critics call it "a lot."','Certified Ridiculous by the Ministry of Silly Songs.','A pigeon outside wept openly.','This is now stuck in someone\'s head forever. You did that.','Mozart wants his melody back. He is not getting it.','The robot singer asked for a raise.','Rolling Stone: "Why?"','Your phone is now legally a karaoke machine.','Nominated for Best Use of Words in a Song (category invented today).'];
function finale(layer, type, onDone){
  layer.innerHTML=''; layer.className='finale show f-'+type;
  const big=el('fin-big','',layer); const sub=el('fin-sub','',layer);
  const throwers = {big:['🌹','👏','🎉','💐','⭐'], sting:['💥','🎤','🔥','😎'], fail:['🍅','🍅','🥬','🦗','🍅'], none:['✨']}[type]||['✨'];
  if(type==='sting'){ big.textContent='MIC DROP'; const mic=el('mic','🎤',layer); setTimeout(()=>layer.parentNode.classList.add('shake'),650); }
  else if(type==='fail'){ big.textContent='...wow.'; sub.textContent='*cricket noises*'; }
  else { big.textContent=pick(['BRAVO!','ENCORE!','LEGENDARY!','MAGNIFICO!','ICONIC!']); }
  const spawn=(i)=>{ const e=el('thrown',pick(throwers),layer); const fromL=R()<0.5; e.style.setProperty('--sx',(fromL?-20:120)+'vw'); e.style.setProperty('--ex',rr(10,85)+'vw'); e.style.setProperty('--ey',rr(20,75)+'vh'); e.style.setProperty('--rot',rr(-720,720)+'deg'); e.style.animationDelay=(i*0.06)+'s'; if(type==='fail') e.classList.add('splat'); };
  for(let i=0;i<(type==='none'?8:28);i++) spawn(i);
  const card=el('fin-card','',layer);
  const score = type==='fail' ? Math.floor(rr(3,41)) : Math.floor(rr(87,101));
  card.innerHTML=`<div class="fc-t">Ridiculousness Rating</div><div class="fc-s">${score}%</div><div class="fc-r">${pick(REVIEWS)}</div>`;
  setTimeout(()=>onDone&&onDone(),1400);
}

SIO.visuals = {FX, LY, Stage, finale};
})();
