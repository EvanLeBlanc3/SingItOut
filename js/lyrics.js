/* SingItOut — text → words → syllables → robot phonemes */
(function(){
const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function numWords(n){
  n=parseInt(n,10); if(isNaN(n)) return '';
  if(n<20) return ONES[n];
  if(n<100) return TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:'');
  if(n<1000) return ONES[Math.floor(n/100)]+' hundred'+(n%100?' '+numWords(n%100):'');
  if(n<1000000) return numWords(Math.floor(n/1000))+' thousand'+(n%1000?' '+numWords(n%1000):'');
  return String(n).split('').map(d=>ONES[+d]).join(' ');
}
const isVowelAt=(w,i)=>{const c=w[i]; if('aeiou'.includes(c)) return true; if(c==='y') return i>0 && !'aeiou'.includes(w[i-1]); return false;};
const ONSET2=['bl','br','cl','cr','dr','fl','fr','gl','gr','pl','pr','sc','sk','sl','sm','sn','sp','st','sw','tr','tw','wh','th','sh','ch','ph','qu','wr','kn'];
function syllabify(w){
  if(w.length<=3) return [w];
  const groups=[]; let i=0;
  while(i<w.length){ if(isVowelAt(w,i)){const s=i; while(i<w.length&&isVowelAt(w,i)) i++; groups.push([s,i]);} else i++; }
  // silent final e (but keep consonant+le like "table")
  if(groups.length>1){
    const last=groups[groups.length-1];
    if(last[0]===w.length-1 && w[w.length-1]==='e' && !(w.endsWith('le') && w.length>3 && !isVowelAt(w,w.length-3))) groups.pop();
    else if(w.endsWith('ed') && last[0]===w.length-2 && !/([td]|[^aeiou]r)ed$/.test(w)) groups.pop();
    else if(w.endsWith('es') && last[0]===w.length-2 && !/(s|x|z|ch|sh|c|g)es$/.test(w)) groups.pop();
  }
  if(groups.length<=1) return [w];
  const parts=[]; let start=0;
  for(let k=0;k<groups.length-1;k++){
    const cs=groups[k][1], ce=groups[k+1][0], n=ce-cs; let split;
    if(n<=1) split=cs;
    else { const cl=w.slice(cs,ce);
      if(cl.startsWith('ck')) split=cs+2;
      else if(n===2 && ONSET2.includes(cl)) split=cs;
      else if(n===2) split=cs+1;
      else if(ONSET2.includes(cl.slice(-2))) split=ce-2;
      else split=ce-1; }
    parts.push(w.slice(start,split)); start=split;
  }
  parts.push(w.slice(start));
  return parts.filter(Boolean);
}
// ---------- phonemes ----------
const V = { // [F1,F2,F3]
  IY:[270,2290,3010], IH:[390,1990,2550], EH:[530,1840,2480], AE:[660,1720,2410], AA:[730,1090,2440],
  AO:[570,840,2410], UH:[440,1020,2240], UW:[300,870,2240], AH:[640,1190,2390], ER:[490,1350,1690], OH:[500,800,2400]
};
const DIPH = { EY:['EH','IY'], AY:['AA','IY'], OW:['OH','UW'], AW:['AA','UW'], OY:['AO','IY'] };
const C = {
  S:{k:'fric',nf:5800,q:1.6,g:0.5}, Z:{k:'fric',nf:5200,q:1.6,g:0.35,v:1}, SH:{k:'fric',nf:2700,q:1.4,g:0.55}, ZH:{k:'fric',nf:2600,q:1.4,g:0.35,v:1},
  F:{k:'fric',nf:6500,q:0.6,g:0.22}, V:{k:'fric',nf:6000,q:0.6,g:0.15,v:1}, TH:{k:'fric',nf:6200,q:0.7,g:0.18}, H:{k:'fric',nf:1600,q:0.4,g:0.25},
  P:{k:'stop',nf:900,g:0.6}, B:{k:'stop',nf:800,g:0.4,v:1}, T:{k:'stop',nf:4200,g:0.6}, D:{k:'stop',nf:3600,g:0.45,v:1}, K:{k:'stop',nf:2000,g:0.6}, G:{k:'stop',nf:1800,g:0.45,v:1},
  CH:{k:'affr',nf:2800,g:0.6}, J:{k:'affr',nf:2600,g:0.45,v:1},
  M:{k:'nasal',f:[260,1100,2300]}, N:{k:'nasal',f:[260,1500,2500]}, NG:{k:'nasal',f:[260,2000,2600]},
  L:{k:'liq',f:[360,1300,2700]}, R:{k:'liq',f:[420,1250,1600]}, W:{k:'liq',f:[300,700,2200]}, Y:{k:'liq',f:[270,2200,3000]}
};
function vowelFor(g, ctx){
  // g = vowel letter group, ctx: {magicE, final, oneSyl, next}
  const map = {ee:'IY',ea:'IY',ie:'IY',ei:'EY',ey:'EY',ai:'EY',ay:'EY',oo:'UW',ou:'AW',ow:'OW',oa:'OW',oe:'OW',oi:'OY',oy:'OY',au:'AO',aw:'AO',ue:'UW',ui:'UW',eu:'UW',ew:'UW',io:'IY',ia:'IY',eo:'IY'};
  if(g.length>=2 && map[g.slice(0,2)]) return map[g.slice(0,2)];
  const c=g[0];
  if(ctx.magicE){ return {a:'EY',e:'IY',i:'AY',o:'OW',u:'UW',y:'AY'}[c]||'AH'; }
  if(ctx.openMid){ return {a: ctx.nSyl===2?'EY':'AH',e:'IY',i:'AY',o:'OW',u:'UW',y:'IH'}[c]||'AH'; }
  if(ctx.openFinal){ return {a:'AA',e:'IY',i:'AY',o:'OW',u:'UW',y: ctx.oneSyl?'AY':'IY'}[c]||'AH'; }
  return {a:'AE',e:'EH',i:'IH',o:'AA',u:'AH',y:'IH'}[c]||'AH';
}
// parse one syllable into {onset:[C...], vowel:{a,b}, coda:[C...]}
function phonemize(syl, info){
  const s=syl; let i=0; const onset=[], coda=[]; let vowel=null;
  const push=(ph)=>{ (vowel?coda:onset).push(ph); };
  while(i<s.length){
    const c=s[i], two=s.slice(i,i+2), three=s.slice(i,i+3);
    if(three==='igh'){ vowel={a:'AY'}; i+=3; continue; }
    if(three==='tch'){ push('CH'); i+=3; continue; }
    if(!vowel && isVowelAt(s,i) || (!vowel && c==='y' && i===s.length-1 && i>0)){
      let j=i; while(j<s.length && isVowelAt(s,j)) j++;
      let g=s.slice(i,j); if(!g) {g=c; j=i+1;}
      if(g.length===1 && (s[j]==='y'||s[j]==='w') && 'aeo'.includes(g)){ g+=s[j]; j++; }
      // r-colored
      const nx=s[j];
      if(nx==='r' && 'eiu'.includes(g) ){ vowel={a:'ER'}; i=j+1; continue; }
      if(nx==='r' && g==='a'){ vowel={a:'AA'}; coda.push('R'); i=j+1; continue; }
      if(nx==='r' && g==='o'){ vowel={a:'AO'}; coda.push('R'); i=j+1; continue; }
      const magicE = info.magicE && info.last && g.length===1;
      const openFinal = j===s.length && g.length===1 && info.last;
      const openMid = j===s.length && g.length===1 && !info.last;
      if(openMid && s.length===1 && g==='a'){ vowel={a:'AH'}; i=j; continue; }
      if(g.startsWith('eau')){ vowel={a:'UW'}; i=j; continue; }
      // consonant + "le" at end of word → "ul"
      if(info.last && g==='e' && j===s.length && s.endsWith('le') && info.nSyl>1 && i===s.length-1){ onset.pop(); vowel={a:'AH'}; coda.push('L'); i=j; continue; }
      vowel={a:vowelFor(g,{magicE,openFinal,openMid,oneSyl:info.oneSyl,nSyl:info.nSyl})};
      i=j; continue;
    }
    if('aeiouy'.includes(c)){ i++; continue; } // extra vowels after nucleus (silent-ish)
    if(two==='ch'){push('CH');i+=2;continue;} if(two==='sh'){push('SH');i+=2;continue;}
    if(two==='th'){push('TH');i+=2;continue;} if(two==='ph'){push('F');i+=2;continue;}
    if(two==='wh'){push('W');i+=2;continue;} if(two==='ck'){push('K');i+=2;continue;}
    if(two==='ng'){push('NG');i+=2;continue;} if(two==='qu'){push('K');push('W');i+=2;continue;}
    if(two==='gh'){i+=2;continue;} if(two==='kn' && i===0){push('N');i+=2;continue;}
    if(two==='wr' && i===0){push('R');i+=2;continue;} if(two==='mb' && i+2===s.length){push('M');i+=2;continue;}
    if(c===s[i+1] && c!=='e' && c!=='o'){ i++; continue; } // double consonant → one
    const map={b:'B',c:('eiy'.includes(s[i+1]||'')?'S':'K'),d:'D',f:'F',g:'G',h:'H',j:'J',k:'K',l:'L',m:'M',n:'N',p:'P',q:'K',r:'R',s:(vowel&&i===s.length-1&&info.last&&s.length>2?'Z':'S'),t:'T',v:'V',w:'W',x:'X',y:'Y',z:'Z'};
    const ph=map[c];
    if(ph==='X'){push('K');push('S');} else if(ph) push(ph);
    i++;
  }
  if(!vowel) vowel={a:'AH'}; // "hmm", "brr" → still sing something
  // drop magic-e leftover
  return {onset, vowel, coda};
}
function vowelFormants(name){
  if(DIPH[name]) return {f:V[DIPH[name][0]], f2:V[DIPH[name][1]]};
  return {f:V[name]||V.AH};
}
const EXC = {you:'Y.UW.',to:'T.UW.',two:'T.UW.',too:'T.UW.',do:'D.UW.',who:'H.UW.',love:'L.AH.V',the:'TH.AH.',of:'.AH.V',are:'.AA.R',was:'W.AH.Z',what:'W.AH.T',
  one:'W.AH.N',said:'S.EH.D',have:'H.AE.V',give:'G.IH.V',live:'L.IH.V',some:'S.AH.M',come:'K.AH.M',done:'D.AH.N',gone:'G.AO.N',your:'Y.AO.R',youre:'Y.AO.R',
  roll:'R.OW.L',old:'.OW.LD',cold:'K.OW.LD',told:'T.OW.LD',eye:'.AY.',eyes:'.AY.Z',buy:'B.AY.',guy:'G.AY.',does:'D.AH.Z',were:'W.ER.',where:'W.EH.R',there:'TH.EH.R',
  their:'TH.EH.R',theyre:'TH.EH.R',here:'H.IY.R',our:'.AW.R',hour:'.AW.R',four:'F.AO.R',door:'D.AO.R',floor:'FL.AO.R',put:'P.UH.T',good:'G.UH.D',book:'B.UH.K',look:'L.UH.K',
  cook:'K.UH.K',should:'SH.UH.D',could:'K.UH.D',would:'W.UH.D',friend:'FR.EH.ND',dog:'D.AO.G',cat:'K.AE.T',im:'.AY.M',ive:'.AY.V',dont:'D.OW.NT',wont:'W.OW.NT',
  cant:'K.AE.NT',night:'N.AY.T',light:'L.AY.T',right:'R.AY.T',eight:'.EY.T',great:'GR.EY.T',break:'BR.EY.K',move:'M.UW.V',once:'W.AH.NS',through:'THR.UW.',
  enough:'.IY.N AH.F',people:'P.IY. P.AH.L',hello:'H.AH. L.OW.',okay:'.OW. K.EY.',ok:'.OW. K.EY.',pizza:'P.IY.T S.AH.',coffee:'K.AA. F.IY.',monday:'M.AH.N D.EY.',
  money:'M.AH. N.IY.',very:'V.EH. R.IY.',every:'.EH.V R.IY.',again:'.AH. G.EH.N',today:'T.AH. D.EY.',tonight:'T.AH. N.AY.T',evan:'.IY. V.AH.N'};
function parsePh(str){ // "ON.VO.CO" with dots, letters splitted by known keys
  const [on,vo,co]=str.split('.');
  const toks=x=>{ const out=[]; let r=x; const keys=Object.keys(C).sort((a,b)=>b.length-a.length);
    while(r.length){ const k=keys.find(k=>r.startsWith(k)); if(!k){r=r.slice(1);continue;} out.push(k); r=r.slice(k.length);} return out; };
  return {onset:toks(on||''), vowel:{a:vo||'AH'}, coda:toks(co||'')};
}
// Tokenize whole text → words with syllables
function analyze(text){
  const tokens = String(text||'').replace(/[\r\n]+/g,' ').split(/\s+/).filter(Boolean);
  const words=[];
  tokens.forEach(tok=>{
    let pieces=[tok];
    if(/\d/.test(tok)){ pieces = tok.replace(/\d+/g,m=>' '+numWords(m)+' ').trim().split(/\s+/); }
    pieces.forEach(p=>{
      const clean = p.toLowerCase().replace(/[’']/g,'').replace(/&/g,'and').replace(/[^a-zà-ÿ]/g,'')
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(!clean) return;
      const display = p.replace(/^[^\p{L}\p{N}'’&]+|[^\p{L}\p{N}'’!?.,&]+$/gu,'') || clean;
      if(EXC[clean]){
        const ex=EXC[clean].split(' ');
        const sy = ex.length===1 ? [clean] : (()=>{ const a=syllabify(clean); return a.length===ex.length?a:ex.map((_,k)=>k===0?clean:''); })();
        words.push({display, clean, syls: ex.map((e,k)=>({text:sy[k]||'', ph:parsePh(e)}))});
        return;
      }
      const syls = syllabify(clean);
      const magicE = /[^aeiou][aeiouy][^aeiouwxy]e$/.test(clean) || /[^aeiou]e$/.test(clean) && clean.length<=4 && /[aiou]/.test(clean.slice(0,-2));
      const sylObjs = syls.map((sy,k)=>({text:sy, ph:phonemize(sy,{last:k===syls.length-1, magicE, oneSyl:syls.length===1, nSyl:syls.length})}));
      words.push({display, clean, syls:sylObjs});
    });
  });
  return words;
}
SIO.lyrics = {analyze, syllabify, phonemize, vowelFormants, C, V, numWords};
})();
