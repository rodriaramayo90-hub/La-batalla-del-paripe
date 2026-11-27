/* Flor Rubia — SÚPER EX «¡DETENIDA EN ZÚRICH!» (v1).
   Four-act comic airport cinematic. The Swiss police arrest the wrong fighter,
   or arrest Flor herself if the real opponent completes passport controls.
   Genuine fighter portraits/animations come from existing SpriteAtlas.
   All combat functions are owned by SUPER_MANAGER. */
(function(){
'use strict';
const S={
 active:false,t:0,length:432,speed:.82,actor:null,victim:null,
 hit:false,miss:false,verdict:null,spoken:new Set(),cues:new Set()
};
window.FLOR_SUPER=S;
const A=window.FLOR_AIRPORT_ART;
const TAU=Math.PI*2;
const cap=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const smooth=n=>{const t=cap(n);return t*t*(3-2*t)};
const clampFloat=(n,lo,hi)=>cap(n,lo,hi);
const safe=()=>!!A&&!!window.SUPER_MANAGER;
function reset(){
 if(S.active){
  window.SUPER_DEFENSE?.end('flor');
  if(S.spoken.size)try{window.speechSynthesis?.cancel()}catch(_){}
 }
 S.active=false;S.t=0;S.actor=null;S.victim=null;
 S.hit=false;S.miss=false;S.verdict=null;S.spoken.clear();S.cues.clear();
}
function canStart(a,type){
 return type==='special'&&a?.id===7&&safe()
  &&a.hp>0&&a.y===0&&a.attack<=0&&a.cool<=0
  &&a.stun<=0&&a.blockstun<=0&&!a.blocking
  &&!a.grabbed&&!a.grabbing&&a.escaping<=0&&!a.legGone
  &&(practice||a.meter>=100)&&introFrames<=0&&!ending
  &&!(typeof ONLINE!=='undefined'&&ONLINE.active)
  &&!(typeof projectileClash!=='undefined'&&projectileClash)
  &&!window.SUPER_MANAGER.isActive();
}
function startStrike(a,b,type){
 if(!canStart(a,type))return false;
 reset();
 S.active=true;S.actor=a;S.victim=b||null;
 window.SUPER_DEFENSE?.start('flor',a,b);
 a.meter=0;a.attackType='flor-super';a.attackLength=S.length;a.attack=S.length;
 a.ex=true;a.finisher=false;a.cool=practice?S.length:405;
 a.crouching=false;a.blocking=false;a.moving=false;a.hit=false;
 a.connected=false;a.shots=0;a.cast=++castSerial;a.vy=0;a.y=0;
 a.invuln=S.length+10;
 if(b){b.moving=false;b.parryWindow=0;}
 clearActionBuffer();cancelCharges();
 if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡DETENIDA EN ZÚRICH!';announceTime=0;exFlash=22;
 sfx('ready');haptic(38);updateHud();
 return true;
}
function sayOnce(key,words,lang='es-AR'){
 if(S.spoken.has(key))return;
 S.spoken.add(key);
 // Voice is optional; the same full dialogue always appears in subtitles.
 if(!soundEnabled||typeof window.speechSynthesis==='undefined'
   ||typeof window.SpeechSynthesisUtterance==='undefined')return;
 try{
  const utterance=new SpeechSynthesisUtterance(words);
  utterance.lang=lang;utterance.rate=1.16;utterance.pitch=1.09;utterance.volume=.86;
  window.speechSynthesis.speak(utterance);
 }catch(_){}
}
function eventAt(t,marker,fn){
 if(t<marker||S.cues.has(marker))return;
 S.cues.add(marker);fn();
}
function grade(){
 if(S.verdict)return S.verdict;
 return window.SUPER_DEFENSE?.result('flor')||'fail';
}
function impact(){
 if(S.hit)return;
 S.hit=true;S.verdict=grade();
 const b=S.victim,a=S.actor;
 window.SUPER_DEFENSE?.notice('flor');
 if(!b||b.hp<=0){S.miss=true;return;}
 const mul=window.SUPER_DEFENSE?.multiplier('flor')??1;
 if(mul===0){
  effects.push({x:b.x,y:160,t:85,text:'¡TE CABIÓ! PASAPORTE VALIDADO',color:'#baffdc'});
  haptic(25);sfx('guard');return;
 }
 const damage=MAX_HP*.48*mul;
 b.hp=clamp(b.hp-damage,0,MAX_HP);
 b.x=clamp(b.x+(a.dir||1)*(mul===.5?45:105),80,880);
 b.knockback=(a.dir||1)*(mul===.5?5:9);
 b.stun=Math.max(b.stun||0,mul===.5?46:76);
 b.blockstun=0;b.blocking=false;b.parryWindow=0;
 b.hitRecoil=1;b.hitStrength=1.7;b.hitHeight=1;
 b.hitDirection=a.dir||1;b.attack=0;b.hit=true;
 b.meter=clamp(b.meter+12,0,100);
 a.hit=true;a.connected=true;
 effects.push({x:b.x,y:235,t:37,burst:true,kind:-3,blocked:false});
 effects.push({x:b.x,y:149,t:70,
  text:mul===.5?'¡INSPECCIÓN SECUNDARIA!':'¡DEPORTADO!',
  color:mul===.5?'#ffecab':'#ffd09b'});
 if(b.hp<=0){
  effects.push({x:480,y:108,t:95,text:'PROHIBIDA LA ENTRADA A SUIZA',color:'#ff9d9c'});
 }
 shake=Math.max(shake,mul===.5?12:25);
 hitstop=Math.max(hitstop,mul===.5?5:11);
 sfx('hit',{pan:b.x/480-1,intensity:2});haptic(mul===.5?48:100);
 if(a===player&&!practice)score+=Math.round(damage*17);
}
function tick(dt){
 if(!S.active)return;
 const t=S.t=Math.min(S.length,S.t+Math.max(0,dt||0)*S.speed);
 const a=S.actor;
 if(a)a.attack=Math.max(0,S.length-t);
 window.SUPER_DEFENSE?.tick('flor',t);
 eventAt(t,34,()=>{sfx('step');sayOnce('stop','Madame, contrôle de sécurité.','fr-FR')});
 eventAt(t,76,()=>{sfx('ready');sayOnce('deny','¡Yo no hice nada!')});
 eventAt(t,112,()=>{sfx('step');sayOnce('argent','¡Pero si esto en Argentina se puede!')});
 eventAt(t,155,()=>{sfx('ready');sayOnce('suspect','¡ÉL FUE! ¡ESE ES EL SOSPECHOSO!')});
 eventAt(t,168,()=>sfx('ready'));
 eventAt(t,293,()=>{
  S.verdict=grade();
  sfx(S.verdict==='perfect'?'guard':'ready');
  if(S.verdict==='perfect')sayOnce('again','¡Pero otra vez yo, boludo!');
 });
 eventAt(t,342,()=>sfx('step'));
 eventAt(t,368,()=>{if(S.verdict!=='perfect')sfx('ready')});
 if(t>=380&&!S.hit)impact();
 if(t>=S.length){
  const b=S.victim,dead=!!b&&b.hp<=0,win=a===player;
  window.SUPER_DEFENSE?.end('flor');
  reset();
  if(a){a.attack=0;a.attackType='';a.ex=false;a.invuln=0;}
  clearActionBuffer();
  if(typeof SECOND!=='undefined')SECOND.actions=[];
  if(dead)finish(win);
 }
 updateHud();
}
function fighterForScreen(){
 const v=S.victim;
 return v&&Number.isInteger(v.id)&&atlasMap?.[v.id]
  ?v:{id:3,practiceStandin:true};
}
function drawFlor(x,feet,size,pose=0,rotation=0){
 if(!atlases?.[atlasMap[7][0]])return;
 ctx.save();ctx.translate(x,feet);ctx.rotate(rotation);
 // The actual Flor in-game art: no synthetic face, outfit or body scaling.
 const m=atlasMap[7];
 SpriteAtlas.draw(ctx,atlases[m[0]],m[1],pose,0,0,size);
 ctx.restore();
}
function drawOpponent(t,verdict){
 const b=fighterForScreen(),real=!!S.victim;
 if(!atlasMap?.[b.id])return;
 let x=765,feet=464,size=315,angle=0,alpha=1;
 const accused=t>=153;
 if(t>=287&&verdict!=='perfect'){
  if(verdict==='partial'){
   // Partial success: released from arrest, but baggage will hit the opponent.
   x=766;feet=464;
  }else if(t<353){
   const p=smooth((t-292)/55);
   x=766-p*134;size=315*(1-p*.45);feet=464;
   alpha=1-p*.30;angle=-p*.20;
  }else if(t<380){
   alpha=0; // Inside the suitcase; the actual rival returns in the crash.
  }else {
   x=805+smooth((t-380)/19)*88;
   feet=460-Math.sin(cap((t-380)/35)*Math.PI)*90;
   angle=.32*Math.sin((t-380)*.10);
  }
 }
 if(t>=380&&verdict==='partial'){
  const p=cap((t-380)/35);
  x=766+p*102;feet=464-Math.sin(p*Math.PI)*68;
  angle=p*.28;
 }
 const reacting=(accused&&t<173)||(t>=380&&verdict!=='perfect');
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,feet);
 ctx.scale(-1,1);ctx.rotate(-angle);
 const m=reacting?actionMap[b.id]:atlasMap[b.id];
 const sheet=reacting?actionAtlases[m[0]]:atlases[m[0]];
 SpriteAtlas.draw(ctx,sheet,m[1],reacting?5:0,0,0,size);
 ctx.restore();
 if(b.practiceStandin){
  A.label(ctx,'RIVAL DE ENTRENAMIENTO',765,130,13,'#ecfaff');
 }
 if(t>=290&&verdict==='perfect'&&real){
  A.passport(ctx,789,255,.55);
  A.stamp(ctx,'PASAPORTE OK',782,327,-.12,.53);
 }
}
function drawCops(t,verdict){
 const firstX=t<33?520+Math.sin(t*.06)*9:499;
 const secondX= t<26?1100-(t/26)*425:667;
 let p1=t<30?0:t<75?1:t<147?2:t<298?1:3;
 let p2=t<75?0:t<147?2:t<298?1:3;
 let x1=firstX,x2=secondX;
 if(t>=291){
  const v=smooth((t-291)/47);
  if(verdict==='perfect'){
   x1=499+v*30;x2=667+v*188;
   p1=3;p2=3;
  }else{
   x1=499+v*45;x2=667+v*102;
   p1=t<336?3:4;p2=3;
  }
 }
 A.officer(ctx,x1,456,.72,p1,false);
 A.officer(ctx,x2,456,.71,p2,true);
}
function drawFlorActor(t,verdict){
 let x=224,feet=465,rotation=0,pose=0;
 if(t<30){x=35+smooth(t/30)*189;pose=Math.floor(t/5)%2?1:0;}
 else if(t<60){pose=t<39?0:3;rotation=Math.sin(t*.08)*.025;}
 else if(t<151){pose=t>97&&t<118?4:0;}
 else if(t<291){pose=3;rotation=-.07;}
 else if(verdict==='perfect'){
  const p=smooth((t-292)/95);
  x=224+470*p;pose=Math.floor(t/9)%2?1:0;
  rotation=.05*Math.sin(t*.18);
 }else{
  x=224+(t>=358?Math.min(1,(t-358)/28)*65:0);
  pose=t>=338?2:3;
 }
 drawFlor(x,feet,330,pose,rotation);
 if(t<41)A.luggage(ctx,x+128,454,.52,false);
 if(t>=75&&t<151)A.luggage(ctx,435,428,.72,true);
 if(t>=90&&t<151)A.confiscated(ctx,t);
}
function bagAction(t,verdict){
 if(t<290)return;
 if(verdict==='perfect'){
  if(t>=335){
   const x=480+(t-335)*.8;
   A.stamp(ctx,'ACCESO PERMITIDO',760,245,-.10,.64);
   if(t>364)A.stamp(ctx,'DETENIDA OTRA VEZ',480,318,.09,.75);
  }
  return;
 }
 if(verdict==='partial'){
  if(t>=330&&t<378){
   const p=cap((t-330)/48);
   A.luggage(ctx,522+290*p,427,.76,false);
   A.sticker(ctx,520+290*p,368,'CONTROL EXTRA',-.08,.68);
  }
  if(t>=372&&t<417)A.explosion(ctx,t,805,350);
  return;
 }
 if(t<344){
  const x=647,y=430;
  A.luggage(ctx,x,y,.81,t<323);
  if(t>=312)A.sticker(ctx,647,365,'DEPORTADO',-.07,.77);
 }else if(t<385){
  A.baggageArc(ctx,t,670);
 }else if(t<415){
  A.explosion(ctx,t,846,334);
 }
}
function bubble(text,x,y,w=360,fill='#fff5d8',color='#331936'){
 const h=57;
 ctx.save();
 A.rect(ctx,x-w/2,y-h/2,w,h,fill,'#282a4b',16,4);
 ctx.beginPath();ctx.moveTo(x-25,y+h/2);ctx.lineTo(x-12,y+h/2+15);
 ctx.lineTo(x+2,y+h/2);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#282a4b';ctx.lineWidth=2;ctx.stroke();
 A.label(ctx,text,x,y,Math.min(23,Math.max(14,490/text.length)),color);
 ctx.restore();
}
function dialogue(t,verdict){
 if(t<28)return;
 if(t<63)bubble('MADAME, CONTRÔLE DE SÉCURITÉ',580,171,550,'#f4fcff','#0c3d62');
 else if(t<98)bubble('¡YO NO HICE NADA!',262,171,410);
 else if(t<143)bubble('¡PERO SI ESTO EN ARGENTINA SE PUEDE!',262,170,565);
 else if(t<174)bubble('¡ÉL FUE! ¡ESE ES EL SOSPECHOSO!',420,178,560,'#fffae7');
 else if(t>=291&&t<322){
  if(verdict==='perfect')bubble('ALLES GUT. ¡EL PASAPORTE ESTÁ BIEN!',580,177,550,'#ceffef','#104d3f');
  else if(verdict==='partial')bubble('INSPECCIÓN SECUNDARIA...',550,174,460,'#fff4c6');
  else bubble('¡EXPULSIÓN INMEDIATA!',594,174,430,'#ffcfce','#6d1736');
 }else if(t>=347&&verdict==='perfect'){
  bubble('¡PERO OTRA VEZ YO, BOLUDO!',420,169,530,'#fff5d8');
 }
}
function caption(t,verdict){
 if(t<35)return '¡CHECK-IN CON SORPRESA!';
 if(t<73)return '¡CONTROL DE SEGURIDAD!';
 if(t<118)return '¡CONFISCACIÓN MASIVA!';
 if(t<151)return '¡FERNET, QUESO Y PERFUMES!';
 if(t<169)return '¡ÉL FUE!';
 if(t<288)return '¡CONTROL DE PASAPORTE!';
 if(verdict==='perfect')return t<345?'¡LIBRE DE CARGOS!':'¡DETENIDA OTRA VEZ!';
 if(verdict==='partial')return t<368?'¡INSPECCIÓN EXTRA!':'¡VALIJAZO COLATERAL!';
 if(t<348)return '¡EXPULSIÓN INMEDIATA!';
 if(t<382)return '¡DIRECTO A LA CINTA!';
 return '¡DEPORTADO!';
}
function cinematic(){
 if(!S.active)return;
 const t=S.t,verdict=t>=290?grade():'pending';
 if(!A||!ctx)return;
 ctx.save();
 const fade=t<12?t/12:t>418?(432-t)/14:1;
 ctx.globalAlpha*=cap(fade);
 A.background(ctx,t);
 if(t>=288){
  A.conveyor(ctx,t);
  if(verdict!=='perfect')A.scanner(ctx,t);
 }
 drawFlorActor(t,verdict);
 drawOpponent(t,verdict);
 drawCops(t,verdict);
 bagAction(t,verdict);
 if(t>=170&&t<290)A.prompt(ctx,t,verdict);
 dialogue(t,verdict);
 // Cinematic matte / captions: these stay above the moving actors and scenery.
 A.rect(ctx,0,0,960,47,'#08132f');
 A.rect(ctx,0,500,960,40,'#08132f');
 A.cross(ctx,18,8,28);
 A.label(ctx,'FLOR RUBIA  /  ULTRA EX',57,27,19,'#ffedb9','left');
 A.label(ctx,'ZÜRICH AIRPORT • SUIZA',932,27,17,'#acebfa','right');
 A.label(ctx,caption(t,verdict),480,94,29,'#fff7b2','center','#07172d');
 if(t>=379&&verdict==='fail'){
  A.stamp(ctx,'PROHIBIDA LA ENTRADA A SUIZA',485,464,-.07,.62);
 }
 if(t>=369&&verdict==='perfect'){
  A.stamp(ctx,'¡TE CABIÓ! DEFENSA PERFECTA',485,457,.03,.62);
 }
 if(t>=380&&verdict==='partial'){
  A.stamp(ctx,'LIBERADO CON RETRASO',485,462,-.05,.62);
 }
 window.SUPER_DEFENSE?.draw('flor',ctx,t);
 ctx.restore();
}
function drawSuperHud(){
 if(!player)return;
 const ready=player.id===7&&(practice||player.meter>=100)
  &&player.cool<=0&&!S.active;
 const btn=document.querySelector('[data-key=special]');
 if(btn){
  btn.classList.toggle('flor-super-ready',ready);
  if(ready){const small=btn.querySelector('small');if(small)small.textContent='SÚPER EX';
   btn.setAttribute('aria-label','Súper EX de Flor Rubia: ¡Detenida en Zúrich!');}
 }
 if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡DETENIDA EN ZÚRICH!';
}
window.SUPER_MANAGER.register({
 fighterId:7,key:'flor',state:S,canStart,start:startStrike,
 update:tick,draw:cinematic,hud:drawSuperHud,reset
});
})();
