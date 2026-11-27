/* La Drapie - Sobredosis de Redes: 12 original poses, optional spoken news,
   dizzy opponent, and a single decisive EX impact. Solo/practice/local only. */
(function(){
'use strict';
const DS={active:false,t:0,length:330,speed:.72,actor:null,victim:null,art:null,hit:false,stunned:false,spoke:false,utterance:null,finished:false};
window.DRAPIE_SUPER=DS;
const priorCancelSpeech=cancelSpeech;
const stories=[
 {site:'X / TWITTER',tag:'X',color:'#242b46',text:'¡Un vecino se hizo viral por discutir con una gaviota!'},
 {site:'INSTAGRAM',tag:'IG',color:'#b74291',text:'Subió 37 historias para explicar que no sube historias.'},
 {site:'TIKTOK',tag:'♪',color:'#12a8b9',text:'¡Nuevo reto! Bailar sin perder la dignidad.'},
 {site:'X / TWITTER',tag:'X',color:'#242b46',text:'¡Debate nacional por el último chipa de la bolsa!'},
 {site:'INSTAGRAM',tag:'IG',color:'#b74291',text:'Una foto del desayuno ya tiene mil comentarios.'},
 {site:'TIKTOK',tag:'♪',color:'#12a8b9',text:'¡Parte 84 de una historia que nadie pidió!'},
 {site:'TODAS LAS REDES',tag:'!!!',color:'#dc6341',text:'¡Y todavía me quedan DOSCIENTAS noticias!'}
];
const narration='Última hora: Twitter estalla. Instagram se hace eco. TikTok confirma el papelón. Mil comentarios, doscientos reels, ¡y nadie se calla! ¡Atendé esta noticia!';
function muteOurVoice(){
 if(DS.utterance && typeof speechSynthesis!=='undefined'){
  try{speechSynthesis.cancel()}catch(_){}
 }
 DS.utterance=null;
}
function reset(){muteOurVoice();DS.active=false;DS.actor=null;DS.victim=null;DS.t=0;DS.hit=false;DS.stunned=false;DS.spoke=false;DS.finished=false;}

cancelSpeech=function(){muteOurVoice();return priorCancelSpeech.apply(this,arguments);};
function canStart(a,type){
 return type==='special'&&a&&a.id===6&&a.hp>0&&a.attack<=0&&a.cool<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking&&!a.grabbed&&!a.grabbing&&a.escaping<=0&&a.y===0&&(practice||a.meter>=100)&&introFrames<=0&&!ending&&!DS.active&&!(window.TREX_SUP&&window.TREX_SUP.active)&&!(typeof ONLINE!=='undefined'&&ONLINE.active)&&!(typeof projectileClash!=='undefined'&&projectileClash);
}
function startStrike(a,b,type,power,low){
 if(!canStart(a,type))return false;
 DS.active=true;DS.actor=a;DS.victim=b||null;window.SUPER_DEFENSE?.start('drapie',a,b);DS.t=0;DS.hit=false;DS.stunned=false;DS.spoke=false;DS.finished=false;
 a.meter=0;a.attackType='drapie-super';a.attackLength=DS.length;a.attack=DS.length;a.finisher=false;a.ex=true;a.cool=practice?DS.length:390;
 a.hit=false;a.connected=false;a.crouching=false;a.blocking=false;a.moving=false;a.shots=0;a.vy=0;a.y=0;a.cast=++castSerial;a.invuln=DS.length+12;
 if(b)b.moving=false;
 clearActionBuffer();cancelCharges();if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡SOBREDOSIS DE REDES!';announceTime=0;exFlash=18;sfx('ready');haptic(35);updateHud();return true;
};
function speak(){
 if(DS.spoke)return;DS.spoke=true;
 if(!soundEnabled||typeof window.speechSynthesis==='undefined'||typeof window.SpeechSynthesisUtterance==='undefined')return;
 try{
  muteOurVoice();const u=new SpeechSynthesisUtterance(narration);
  u.lang='es-AR';u.rate=1.55;u.pitch=1.18;u.volume=.95;
  DS.utterance=u;window.speechSynthesis.speak(u);
 }catch(err){console.warn('[Drapie EX] Voz no disponible',err);}
}
function roundRect(x,y,w,h,r,color,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}
}
function drawHeadline(str,x,y,maxWidth,sz,color){
 ctx.save();ctx.font='900 '+sz+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#211035';ctx.fillStyle=color;
 const words=str.split(' '),lines=[];let line='';
 for(const word of words){const tryLine=(line?line+' ':'')+word;if(line&&ctx.measureText(tryLine).width>maxWidth){lines.push(line);line=word;}else line=tryLine;}if(line)lines.push(line);
 const lh=sz*1.21;for(let i=0;i<lines.length;i++){let yy=y+(i-(lines.length-1)/2)*lh;ctx.strokeText(lines[i],x,yy);ctx.fillText(lines[i],x,yy);}ctx.restore();
}
function renderNews(t){
 const step=Math.max(0,Math.min(stories.length-1,Math.floor((t-60)/25)));
 const item=stories[step],pulse=Math.sin(t*.12)*4;
 const x=344,y=210+pulse;
 // Huge legible pop-up rather than small indecipherable social-media cards.
 ctx.save();ctx.shadowColor='#f879f2';ctx.shadowBlur=22;roundRect(x,y,302,156,18,'#faf6ff','#e863f0');ctx.shadowBlur=0;
 roundRect(x+9,y+10,284,42,11,item.color);
 ctx.textAlign='left';ctx.fillStyle='#ffffff';ctx.font='900 22px system-ui';ctx.fillText(item.tag+'  '+item.site,x+22,y+39);
 drawHeadline(item.text,x+151,y+105,259,21,'#301c4a');ctx.restore();
 // Persistent stream of floating smaller notifications, deliberately abstract.
 ctx.save();ctx.globalAlpha=.48;
 for(let i=0;i<5;i++){
  const lx=365+(i%2)*222+Math.sin(t*.08+i)*14,ly=410-i*27-(t*1.2+i*32)%80;
  roundRect(lx,ly,68,16,5,i%3===0?'#fa76b3':i%3===1?'#71f0ef':'#ffe38d');
 }
 ctx.restore();
}
function drawActor(t){
 const phase=t<15?0:t<32?1:t<60?2:t<82?3:t<222?[4,5,6,7][Math.floor((t-82)/14)%4]:t<241?6:t<260?8:t<291?9:t<310?10:11;
 const dash=Math.max(0,Math.min(1,(t-257)/38));const dx=dash*dash*(3-2*dash)*245;
 const actorX=230+dx;
 ctx.save();ctx.translate(actorX,463);
 if(DS.art&&DS.art.complete&&DS.art.naturalWidth){
  const cw=DS.art.naturalWidth/4,ch=DS.art.naturalHeight/3;
  ctx.drawImage(DS.art,(phase%4)*cw,Math.floor(phase/4)*ch,cw,ch,-200,-374,400,400);
 }else{
  // Fully playable fallback while optional illustrated sprites load.
  SpriteAtlas.draw(ctx,drapieOutfitArt[0],0,phase>=9?4:0,0,0,330);
  if(t>=32&&t<260){roundRect(57,-248,26,48,5,'#1b2339','#9affff');}
 }
 ctx.restore();
 return actorX;
}
function drawVictim(t){
 const b=DS.victim;if(!b)return;
 ctx.save();let wobble=t>=205?Math.sin(t*.27)*7:0;
 ctx.translate(755+wobble,463);ctx.scale(-1,1);
 let [sheet,row]=atlasMap[b.id],im=atlases[sheet],col=0;
 if(t>=200){let a=actionMap[b.id];im=actionAtlases[a[0]];row=a[1];col=t>=288?5:0;}
 SpriteAtlas.draw(ctx,im,row,col,0,0,306);
 ctx.restore();
 if(t>=200&&t<330){
  ctx.save();ctx.translate(755,173);ctx.textAlign='center';ctx.font='900 38px system-ui';ctx.fillStyle='#ffef57';
  for(let i=0;i<4;i++){
   const ang=t*.10+i*Math.PI*.5;ctx.fillText('✦',Math.cos(ang)*67,Math.sin(ang)*19);
  }
  ctx.restore();
 }
}
function cinematic(){
 if(!DS.active)return;
 const t=DS.t;ctx.save();ctx.fillStyle='#100924';ctx.fillRect(0,0,960,540);
 const gradient=ctx.createRadialGradient(480,245,70,480,245,560);
 gradient.addColorStop(0,t>=285?'#8d4ad2':'#642180');gradient.addColorStop(.62,'#241044');gradient.addColorStop(1,'#090d23');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,540);
 ctx.save();ctx.globalAlpha=.20;ctx.strokeStyle='#f693ff';ctx.lineWidth=3;
 for(let i=0;i<18;i++){let j=(i*83+t*2)%1080;ctx.beginPath();ctx.moveTo(j-200,510);ctx.lineTo(j+120,65);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#10112f';ctx.fillRect(0,462,960,78);ctx.strokeStyle='#b6a7f9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,463);ctx.lineTo(960,463);ctx.stroke();
 drawVictim(t);drawActor(t);
 if(t>=60&&t<250)renderNews(t);
 if(t>=82&&t<258){ctx.save();ctx.strokeStyle='#ff9fff';ctx.globalAlpha=.52;ctx.lineWidth=3;
  for(let n=0;n<5;n++){ctx.beginPath();ctx.ellipse(385+(t%46)*6,252,26+n*12,42+n*8,0,-1,1);ctx.stroke();}ctx.restore();}
 if(t>=240&&t<300){ctx.save();ctx.fillStyle='#fff4b8';ctx.textAlign='center';ctx.font='italic 900 29px system-ui';ctx.fillText('¡ATURDIDO!',755,107);ctx.restore();}
 if(t>=286&&t<314){ctx.save();let alpha=Math.max(0,(314-t)/28);
  ctx.globalAlpha=alpha;ctx.strokeStyle='#fff5b8';ctx.lineWidth=18;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(515+i*13,190+i*38);ctx.lineTo(760+i*18,160+i*40);ctx.stroke();}ctx.restore();}
 if(t>=288&&t<297){ctx.fillStyle='rgba(255,255,255,'+(Math.max(0,(297-t)/9)*.70)+')';ctx.fillRect(0,0,960,540);}
 ctx.fillStyle='#090823';ctx.fillRect(0,0,960,43);ctx.fillRect(0,495,960,45);
 ctx.font='900 20px system-ui';ctx.fillStyle='#ffeb9d';ctx.textAlign='left';ctx.fillText('LA DRAPIE  /  ULTRA EX',28,29);ctx.textAlign='right';ctx.fillText('SOBREDOSIS DE REDES',930,29);
 const title=t<54?'¡SE VIENE UN HILO ETERNO!':t<218?'¡NO PARA DE LEER!':t<265?'¡SATURACIÓN TOTAL!':t<288?'¡AHORA ME ESCUCHÁS VOS!':'¡GOLPE VIRAL!';
 drawHeadline(title,480,88,880,t<280?38:48,'#ffe66d');
 ctx.fillStyle='#f5e9ff';ctx.textAlign='left';ctx.font='bold 18px system-ui';
 ctx.fillText(t<62?'Sacando el celular…':t<222?'X · Instagram · TikTok · MÁS Y MÁS PUBLICACIONES':t<288?'¡El rival no puede reaccionar!':'¡IMPACTO DEFINITIVO!',30,525);
 window.SUPER_DEFENSE?.draw('drapie',ctx,t);ctx.restore();
}
function dealDamage(){
 if(DS.hit)return;DS.hit=true;
 const a=DS.actor,b=DS.victim;if(!b)return;
 const damage=MAX_HP*.48*(window.SUPER_DEFENSE?.multiplier('drapie')??1);window.SUPER_DEFENSE?.notice('drapie');if(damage===0)return;
 b.hp=clamp(b.hp-damage,0,MAX_HP);b.x=clamp(b.x+(a.dir||1)*114,80,880);
 b.knockback=(a.dir||1)*9;b.stun=Math.max(b.stun||0,72);b.blockstun=0;b.blocking=false;b.parryWindow=0;b.guardMix=0;b.hitRecoil=1;b.hitStrength=1.85;b.hitHeight=1;b.hitDirection=a.dir||1;b.attack=0;b.hit=true;b.invuln=Math.max(b.invuln||0,27);
 b.meter=clamp(b.meter+12,0,100);a.hit=true;a.connected=true;
 effects.push({x:b.x,y:247,t:29,kind:-3,burst:true,blocked:false});
 effects.push({x:b.x,y:152,t:48,text:'¡GOLPE VIRAL!',color:'#fff08b'});
 shake=Math.max(shake,22);hitstop=Math.max(hitstop,10);sfx('hit',{pan:b.x/480-1,intensity:2});haptic(95);
 if(a===player&&!practice)score+=Math.round(damage*15);
}
function tick(dt){
 if(!DS.active)return;
 DS.t=Math.min(DS.length,DS.t+dt*DS.speed);
 const a=DS.actor;a.attack=Math.max(0,DS.length-DS.t);
 window.SUPER_DEFENSE?.tick('drapie',DS.t);if(DS.t>=56)speak();
 if(DS.t>=210)DS.stunned=true;
 if(DS.t>=288&&!DS.hit){muteOurVoice();dealDamage();}
 if(DS.t>=DS.length){
  const b=DS.victim;const dead=!!b&&b.hp<=0;const win=a===player;
  window.SUPER_DEFENSE?.end('drapie');reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;
  clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];
  if(dead)finish(win);
 }
 updateHud();
}


function drawSuperHud(){
if(!player)return;
 const ready=player.id===6&&(practice||player.meter>=100)&&player.cool<=0&&!DS.active;
 const btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('drapie-super-ready',ready);if(ready){const label=btn.querySelector('small');if(label)label.textContent='SÚPER EX';btn.setAttribute('aria-label','Súper EX de La Drapie: sobredosis de redes');}}
 if(ready&&$('cool'))$('cool').textContent='EX LLENO · ○ / L / ESPACIO: SOBREDOSIS DE REDES';
};
// New sheet is lazy so failure to load art never blocks start of a fight.
try{
 fetch('assets/drapie-super-identity-v2.b64?v=2').then(r=>{if(!r.ok)throw new Error('Drapie sprites '+r.status);return r.text();}).then(s=>{
  const im=new Image();im.onload=()=>{if(im.naturalWidth>=1000&&im.naturalHeight>=700)DS.art=im;};
  im.onerror=()=>console.warn('[Drapie EX] Sprites no disponibles; usando traje original');
  im.src='data:image/webp;base64,'+s.replace(/\s/g,'');
 }).catch(e=>console.warn('[Drapie EX] Fallback de sprites activo',e));
}catch(e){console.warn('[Drapie EX] Sin sprite externo',e);}
const css=document.createElement('style');css.textContent='.drapie-super-ready{outline:3px solid #ffb1f8!important;box-shadow:0 0 16px 5px #eb6efe,inset 0 0 12px #fff0bf!important;animation:drapieExPulse .8s ease-in-out infinite alternate}@keyframes drapieExPulse{from{filter:brightness(1)}to{filter:brightness(1.4)}}';document.head.appendChild(css);

// Central EX dispatcher owns strike/update/draw/HUD/reset. No global wrappers here.
window.SUPER_MANAGER.register({fighterId:6,key:'drapie',state:DS,
 canStart:canStart,start:startStrike,update:tick,draw:cinematic,hud:drawSuperHud,reset});
})();