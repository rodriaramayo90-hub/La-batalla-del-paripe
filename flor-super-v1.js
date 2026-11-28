/* Flor Rubia — SÚPER EX «¡DETENIDA EN ZÚRICH!» (v1).
   Four-act comic airport cinematic. The Swiss police arrest the wrong fighter,
   or arrest Flor herself if the real opponent completes passport controls.
   Genuine fighter portraits/animations come from existing SpriteAtlas.
   All combat functions are owned by SUPER_MANAGER. */
(function(){
'use strict';
const S={
 active:false,t:0,length:432,speed:.82,actor:null,victim:null,
 hit:false,miss:false,verdict:null,spoken:new Set(),cues:new Set(),
 voiceWait:null,voiceToken:0,voiceWatchdog:null
};
window.FLOR_SUPER=S;
const A=window.FLOR_AIRPORT_ART;
const TAU=Math.PI*2;
const cap=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const smooth=n=>{const t=cap(n);return t*t*(3-2*t)};
const clampFloat=(n,lo,hi)=>cap(n,lo,hi);
const safe=()=>!!A&&!!window.SUPER_MANAGER;
function stopNarration(){
 // Invalidate pending TTS callbacks before cancelling the browser's voice queue.
 ++S.voiceToken;
 if(S.voiceWatchdog!==null){clearTimeout(S.voiceWatchdog);S.voiceWatchdog=null;}
 S.voiceWait=null;
 if(S.spoken.size)try{window.speechSynthesis?.cancel()}catch(_){}
}
function reset(){
 if(S.active)window.SUPER_DEFENSE?.end('flor');
 stopNarration();
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
/* Speak only on the exact subtitle frame. Browser TTS latency/duration varies:
 * the story waits for speech to finish, without changing QTE frame windows.
 */
const NARRATION=[
 {at:28,key:'stop',words:'Madame, contrôle de sécurité.',lang:'fr-FR'},
 {at:63,key:'deny',words:'¡Yo no hice nada!',lang:'es-AR'},
 {at:98,key:'argent',words:'¡Pero si esto en Argentina se puede!',lang:'es-AR'},
 {at:143,key:'suspect',words:'¡Él fue! ¡Ese es el sospechoso!',lang:'es-AR'},
 {at:291,key:'decision',words:()=>{
   const r=grade();
   return r==='perfect'?'Alles gut. ¡El pasaporte está bien!':
    r==='partial'?'Inspección secundaria...':'¡Expulsión inmediata!';
  },lang:'es-AR'},
 {at:347,key:'again',words:'¡Pero otra vez yo, boludo!',
  lang:'es-AR',when:()=>grade()==='perfect'}
];
function releaseVoice(token){
 if(token!==S.voiceToken)return;
 if(S.voiceWatchdog!==null){clearTimeout(S.voiceWatchdog);S.voiceWatchdog=null;}
 S.voiceWait=null;
}
function startNarration(cue){
 S.spoken.add(cue.key);
 if(cue.when&&!cue.when())return;
 const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
 if(!soundEnabled||typeof document!=='undefined'&&document.hidden||
   !synth||typeof synth.speak!=='function'||typeof Utterance!=='function')return;
 const words=typeof cue.words==='function'?cue.words():cue.words;
 const token=++S.voiceToken;
 try{
  // Flush any older line; speechSynthesis otherwise queues past its caption.
  synth.cancel();
  const u=new Utterance(words);
  u.lang=cue.lang;u.rate=1.16;u.pitch=1.09;u.volume=.86;
  S.voiceWait={at:cue.at,key:cue.key,words};
  u.onend=()=>releaseVoice(token);
  u.onerror=()=>releaseVoice(token);
  // Safari / mobile TTS sometimes never fires onend: fail open.
  S.voiceWatchdog=setTimeout(()=>{
   if(token!==S.voiceToken)return;
   try{synth.cancel()}catch(_){}
   releaseVoice(token);
  },Math.min(8500,Math.max(3500,words.length*115)));
  synth.speak(u);
 }catch(error){
  releaseVoice(token);
  console.warn('[Flor EX] Voz no disponible; la escena continuará',error);
 }
}
function nextNarration(from,to){
 return NARRATION.find(cue=>!S.spoken.has(cue.key)&&from<cue.at&&to>=cue.at);
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
 if(S.voiceWait){
  // If the user mutes the game mid-phrase, never leave the EX frozen.
  if(!soundEnabled)stopNarration();
  else return;
 }
 const previous=S.t,target=Math.min(S.length,previous+Math.max(0,dt||0)*S.speed);
 const next=nextNarration(previous,target);
 const t=S.t=next?next.at:target;
 if(next)startNarration(next);
 const a=S.actor;
 if(a)a.attack=Math.max(0,S.length-t);
 window.SUPER_DEFENSE?.tick('flor',t);
 // Sound cues now land on the visual cuts, not 6–14 frames late.
 eventAt(t,28,()=>sfx('step'));
 eventAt(t,63,()=>sfx('ready'));
 eventAt(t,98,()=>sfx('step'));
 eventAt(t,143,()=>sfx('ready'));
 eventAt(t,168,()=>sfx('ready'));
 eventAt(t,291,()=>{
  S.verdict=grade();
  sfx(S.verdict==='perfect'?'guard':'ready');
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
   x=766-p*134;size=315;feet=464;
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
 const walking=t<30;
 let x1=walking?550-51*smooth(t/30):499;
 let x2=walking?975-308*smooth(t/30):667;
 const p1=t<30?8:t<76?1:t<147?2:t<173?5:t<288?4:7;
 const p2=t<30?8:t<73?0:t<147?2:t<174?6:t<288?2:7;
 let pose1=p1,pose2=p2;
 if(t>=291){
  const progress=smooth((t-291)/47);
  if(verdict==='perfect'){
   x1=499+30*progress;x2=667+188*progress;
   pose1=t<315?6:3;pose2=t<315?7:3;
  }else{
   x1=499+45*progress;x2=667+102*progress;
   pose1=t<315?5:t<341?7:3;
   pose2=t<318?7:t<350?3:4;
  }
 }
 const firstBob=walking?Math.sin(t*.21)*4:0;
 const secondBob=walking?Math.sin(t*.19+2)*4:0;
 A.officer(ctx,x1,456+firstBob,.77,pose1,false,0,t);
 A.officer(ctx,x2,456+secondBob,.75,pose2,true,1,t);
}
function drawCinematicFX(t,verdict){
 const beats=[34,76,151,171,291,343,380];
 let pulse=0;
 for(const at of beats){
  const d=t-at;
  if(d>=0&&d<=13)pulse=Math.max(pulse,(1-d/13)*(at===151||at===380?1:.6));
 }
 if(pulse){
  ctx.save();
  ctx.globalAlpha=Math.min(.33,pulse*.27);
  ctx.fillStyle=t>=291&&verdict==='perfect'?'#9effce':'#fff9dc';
  ctx.fillRect(0,0,960,540);
  ctx.restore();
 }
 if(t>=147&&t<172){
  const p=(t-147)/25;
  ctx.save();ctx.translate(491,271);
  ctx.globalAlpha=Math.max(0,1-p);
  for(let i=0;i<18;i++){
   const a=i*Math.PI/9,r=150+(i%3)*16;
   ctx.strokeStyle=i%2?'#fffbd9':'#ef4e67';
   ctx.lineWidth=i%3?5:9;
   ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
   ctx.lineTo(Math.cos(a)*(r+150+p*240),Math.sin(a)*(r+150+p*240));
   ctx.stroke();
  }
  ctx.restore();
 }
 if(t>=364&&t<411&&verdict!=='perfect'){
  const p=(t-364)/47;
  ctx.save();ctx.globalAlpha=(1-p)*.67;
  for(let i=0;i<22;i++){
   const a=i*2.3999,r=(i%2?70:120)+p*160;
   ctx.fillStyle=i%3===0?'#ffeaa7':i%3===1?'#ff8b67':'#fffefa';
   ctx.beginPath();ctx.arc(822+Math.cos(a)*r,321+Math.sin(a)*r,2+i%4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 if(t>0&&t<27){
  const a=1-t/27;
  ctx.save();ctx.globalAlpha=a*.47;ctx.fillStyle='#06132d';
  ctx.fillRect(0,0,960,540);
  ctx.globalAlpha=a;ctx.textAlign='center';
  ctx.font='italic 900 61px system-ui';ctx.lineWidth=12;
  ctx.strokeStyle='#09152d';ctx.strokeText('¡DETENIDA EN ZÚRICH!',480,280);
  ctx.fillStyle='#ffebae';ctx.fillText('¡DETENIDA EN ZÚRICH!',480,280);
  ctx.restore();
 }
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
 // Camera moves with the actors, but HUD and timed passport prompts
 // remain stable in screen coordinates for reliable controller timing.
 const accent=t>=147&&t<169?Math.sin(Math.PI*(t-147)/22)*.15:0;
 const zoom=1+accent+(t>=291&&t<378?.045*smooth((t-291)/33):0);
 ctx.save();
 ctx.translate(480,270);ctx.scale(zoom,zoom);ctx.translate(-480,-270);
 A.background(ctx,t);
 if(t>=288){
  A.conveyor(ctx,t);
  if(verdict!=='perfect')A.scanner(ctx,t);
 }
 drawFlorActor(t,verdict);
 drawOpponent(t,verdict);
 drawCops(t,verdict);
 bagAction(t,verdict);
 ctx.restore(); // The animated scene ends here: draw text and QTE at fixed size.
 drawCinematicFX(t,verdict);
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
