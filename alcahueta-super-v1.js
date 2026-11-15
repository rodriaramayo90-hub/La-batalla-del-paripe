/* La Alcahueta — SÚPER EX: «¡MI DESTINO!»
   Zorrino (alto) y Kipa de Piel (bajo) entran a pelear por ella.
   Independiente del especial «Ataque de Cirujeo»; campaña/CPU y arena de práctica.
   No cambia las reglas de multijugador online ni otros súper existentes. */
(function(){
'use strict';
const MI={active:false,age:0,length:340,speed:.78,actor:null,victim:null,art:null,
         hitEvents:new Set(),blocked:false,said:false,utterance:null};
window.ALCA_SUPER=MI;
const oldStrike=strike,oldUpdate=update,oldDraw=draw,oldHud=updateHud,oldReset=resetArcade;
const phases=[126,184,235,275], fractions=[.08,.09,.09,.22];
function stopVoice(){if(MI.utterance&&typeof window.speechSynthesis!=='undefined'){
 try{window.speechSynthesis.cancel()}catch(_){}}
 MI.utterance=null;}
function reset(){stopVoice();MI.active=false;MI.age=0;MI.actor=null;MI.victim=null;MI.hitEvents.clear();MI.blocked=false;MI.said=false;}
resetArcade=function(){reset();return oldReset.apply(this,arguments);};
function canStart(a,type){
 return type==='special'&&a?.id===0&&a.hp>0&&a.y===0&&a.attack<=0&&a.cool<=0
   &&a.stun<=0&&a.blockstun<=0&&!a.blocking&&!a.grabbed&&!a.grabbing
   &&a.escaping<=0&&(practice||a.meter>=100)&&introFrames<=0&&!ending
   &&!MI.active&&!window.TREX_SUP?.active&&!window.DRAPIE_SUPER?.active
   &&!(typeof ONLINE!=='undefined'&&ONLINE.active)
   &&!(typeof projectileClash!=='undefined'&&projectileClash);
}
strike=function(a,b,type,power,low){
 if(!canStart(a,type))return oldStrike.apply(this,arguments);
 MI.active=true;MI.age=0;MI.actor=a;MI.victim=b||null;MI.hitEvents.clear();MI.blocked=!!(b&&b.blocking&&b.y===0);MI.said=false;
 a.meter=0;a.attackType='alcahueta-super';a.attackLength=MI.length;a.attack=MI.length;
 a.ex=true;a.finisher=false;a.cool=practice?MI.length:420;
 a.vy=0;a.y=0;a.moving=false;a.crouching=false;a.blocking=false;a.hit=false;a.connected=false;
 a.cast=++castSerial;a.shots=0;a.invuln=MI.length+10;
 if(b){b.moving=false;b.parryWindow=0;}
 clearActionBuffer();cancelCharges();
 if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡MI DESTINO!';announceTime=0;exFlash=20;
 sfx('ready');haptic(50);oldHud();return true;
};
function speak(){if(MI.said)return;MI.said=true;
 if(!soundEnabled||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
 try{const msg=new SpeechSynthesisUtterance('¡Mi destino! ¡Zorrino! ¡Kipa de Piel! ¡Denle para que tenga!');
 msg.lang='es-AR';msg.rate=1.12;msg.pitch=1.2;msg.volume=.9;MI.utterance=msg;
 window.speechSynthesis.speak(msg);}catch(_){}
}
function burst(x,y,color,label,size){
 ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.strokeStyle='#250b3b';ctx.lineWidth=4;
 ctx.beginPath();for(let i=0;i<20;i++){let a=i*Math.PI/10,r=i%2?size*.55:size;
  const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
 ctx.font='italic 900 '+Math.max(18,size*.28)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.strokeStyle='#23102f';ctx.lineWidth=5;ctx.strokeText(label,0,0);ctx.fillStyle='#fff';ctx.fillText(label,0,0);ctx.restore();
}
function textLine(str,x,y,size,color){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='italic 900 '+size+'px system-ui';
 ctx.strokeStyle='#180a2d';ctx.lineWidth=size>35?8:5;ctx.lineJoin='round';ctx.strokeText(str,x,y);ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore();
}
function companion(which,pose,x,ground,size){
 // Each row has six separate full-body poses. Crops cannot bleed across cells.
 ctx.save();ctx.translate(x,ground);
 if(MI.art&&MI.art.complete&&MI.art.naturalWidth>=1000){
  const im=MI.art,cw=im.naturalWidth/6,ch=im.naturalHeight/2;
  ctx.drawImage(im,pose*cw,which*ch,cw,ch,-size/2,-size,size,size);
 }else{
  // Fallback graphic if the illustrated asset cannot be downloaded.
  const tall=which===0;ctx.fillStyle=tall?'#655443':'#26344f';ctx.strokeStyle='#171125';ctx.lineWidth=5;
  ctx.beginPath();ctx.roundRect(-size*.20,-size*.59,size*.40,size*.45,14);ctx.fill();ctx.stroke();
  ctx.fillStyle='#dfb28c';ctx.beginPath();ctx.arc(0,-size*.72,size*.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#26212a';ctx.fillRect(-size*.20,-size*.15,size*.14,size*.15);ctx.fillRect(size*.06,-size*.15,size*.14,size*.15);
 }
 ctx.restore();
}
function alca(t){
 ctx.save();ctx.translate(155,459);
 const pose=t<22?0:t<65?1:t<100?2:0;
 SpriteAtlas.draw(ctx,atlases[0],0,pose,0,0,305);
 if(t>=20&&t<=100){ctx.save();ctx.rotate(-.12);ctx.fillStyle='#fae99d';
  for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(0,-210,68+i*18,Math.PI*1.05,Math.PI*1.9);ctx.lineWidth=2.5;ctx.strokeStyle='#ffd962aa';ctx.stroke();}ctx.restore();}
 ctx.restore();
}
function victim(t){
 const b=MI.victim;
 if(!b){ // Training dummy drawn only inside the cutscene, without adding an actual fighter.
  ctx.save();ctx.translate(846,461);
  ctx.fillStyle='#5a4b7a';ctx.strokeStyle='#cfb5fa';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(0,-186,32,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.roundRect(-37,-155,74,109,16);ctx.fill();ctx.stroke();
  ctx.fillStyle='#edce66';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('DUMMY',0,-90);
  ctx.restore();
 }else{
  ctx.save();const wobble=t>=123?Math.sin(t*.48)*Math.min(10,3+((t-120)/25)):0;
  ctx.translate(831+wobble,461);ctx.scale(-1,1);
  const m=atlasMap[b.id],hit=t>=125;
  const im=hit?actionAtlases[actionMap[b.id][0]]:atlases[m[0]];
  SpriteAtlas.draw(ctx,im,hit?actionMap[b.id][1]:m[1],hit?(t>=268?5:3):0,0,0,276);
  ctx.restore();
 }
 if(t>=120&&t<302){
  ctx.save();ctx.textAlign='center';ctx.fillStyle='#ffe67b';ctx.font='900 24px system-ui';
  for(let j=0;j<3;j++){
   const a=t*.1+j*2.094;ctx.fillText('✦',825+Math.cos(a)*52,212+Math.sin(a)*22);
  }ctx.restore();
 }
}
function position(t){
 // The different heights (Zorrino 300px, Kipa 237px) remain fixed in every pose.
 const enter=Math.max(0,Math.min(1,(t-38)/51));const punchZ=Math.max(0,Math.min(1,(t-108)/42));
 const punchK=Math.max(0,Math.min(1,(t-153)/43));
 return {z:-130+enter*495+punchZ*233,k:-180+enter*470+punchK*411};
}
function poses(t){
 const z=t<38?0:t<93?1:t<116?2:t<136?4:t<162?2:t<210?4:t<258?3:t<300?4:2;
 const k=t<38?0:t<93?1:t<152?2:t<189?4:t<221?2:t<260?3:t<295?4:t<310?5:2;
 return {z,k};
}
function cinematic(){
 if(!MI.active)return;const t=MI.age,pos=position(t),ps=poses(t);
 ctx.save();ctx.fillStyle='#070c28';ctx.fillRect(0,0,960,540);
 const bg=ctx.createLinearGradient(0,45,960,480);bg.addColorStop(0,'#4d0d5a');bg.addColorStop(.55,'#24205b');bg.addColorStop(1,'#0e4161');
 ctx.fillStyle=bg;ctx.fillRect(0,0,960,540);
 ctx.globalAlpha=.23;ctx.strokeStyle='#fae27d';ctx.lineWidth=3;
 for(let j=0;j<18;j++){const shift=(j*87+t*2)%1210;ctx.beginPath();ctx.moveTo(shift-280,520);ctx.lineTo(shift+120,63);ctx.stroke();}
 ctx.globalAlpha=1;
 ctx.fillStyle='#10172f';ctx.fillRect(0,460,960,80);ctx.strokeStyle='#cba6ef';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,460);ctx.lineTo(960,460);ctx.stroke();
 victim(t);alca(t);
 if(t>32){
  companion(0,ps.z,pos.z,462,302);
  companion(1,ps.k,pos.k,462,239);
 }
 if(t>=108&&t<154){textLine('¡ZORRINO ATACA!',625,139,31,'#fbe394');if(t>=126&&t<148)burst(766,264,'#ffb82e','¡PAM!',65);}
 if(t>=162&&t<205){textLine('¡KIPA DE PIEL!',625,139,31,'#a9f2ff');if(t>=183&&t<202)burst(798,282,'#f49b40','¡TOMA!',73);}
 if(t>=212&&t<263){textLine('¡POR LA ALCAHUETA!',620,142,30,'#ffb6f5');if(t>=235&&t<252)burst(782,258,'#dca1fa','¡PUM!',86);}
 if(t>=262&&t<302){
  const power=Math.max(0,Math.min(1,(t-266)/12));ctx.fillStyle='rgba(255,255,255,'+(Math.max(0,(283-t)/14)*.25)+')';ctx.fillRect(0,0,960,540);
  burst(777,260,'#fcee6a','¡DESTINAZO!',93+power*25);
 }
 if(t>=304&&t<330){textLine('¡MIS SOLDADOS!',540,142,38,'#fff2a1');}
 ctx.fillStyle='#0d0926';ctx.fillRect(0,0,960,43);ctx.fillRect(0,497,960,43);
 ctx.font='900 19px system-ui';ctx.fillStyle='#ffe7ad';ctx.textAlign='left';ctx.fillText('LA ALCAHUETA / SÚPER EX',28,28);
 ctx.textAlign='right';ctx.fillText('¡MI DESTINO!',930,28);
 const title=t<38?'¡MI DESTINO!':t<95?'¡QUE VENGAN MIS DOS SOLDADOS!':t<261?'¡PEGUEN EN MI NOMBRE!':t<304?'¡GOLPE FINAL!':'¡MISIÓN CUMPLIDA!';
 textLine(title,480,84,t<100?35:38,'#fff0a2');
 if(t>=47){textLine('ZORRINO',pos.z,433,17,'#e9f8ff');textLine('KIPA DE PIEL',pos.k,437,16,'#fff0af');}
 ctx.restore();
}
function hit(n){
 if(MI.hitEvents.has(n))return;MI.hitEvents.add(n);
 const a=MI.actor,b=MI.victim;if(!b||b.hp<=0)return;
 const guarded=MI.blocked,damage=MAX_HP*fractions[n]*(guarded?.35:1);
 b.hp=clamp(b.hp-damage,0,MAX_HP);b.stun=Math.max(b.stun||0,n===3?83:38);
 b.blockstun=guarded?37:0;b.blocking=guarded;b.guardHit=guarded?19:0;
 b.hit=true;b.hitRecoil=guarded?0:1;b.hitStrength=n===3?1.8:1.1;
 b.hitDirection=a.dir||1;b.hitHeight=1;b.parryWindow=0;b.attack=0;
 b.knockback=(a.dir||1)*(n===3?7:2);
 if(n===3)b.x=clamp(b.x+(a.dir||1)*105,80,880);
 b.meter=clamp(b.meter+(guarded?3:6),0,100);
 a.hit=true;a.connected=true;
 effects.push({x:b.x,y:245,t:27,kind:-3,burst:true,blocked:guarded});
 if(n===3)effects.push({x:b.x,y:143,t:48,text:'¡MI DESTINO!',color:'#fff18a'});
 shake=Math.max(shake,n===3?24:9);
 sfx(guarded?'guard':'hit',{intensity:n===3?2:1.1});haptic(n===3?90:24);
 if(a===player&&!practice&&!guarded)score+=Math.round(damage*18);
}
function tick(dt){
 if(!MI.active)return;
 const old=MI.age;MI.age=Math.min(MI.length,MI.age+dt*MI.speed);
 const a=MI.actor;a.attack=Math.max(0,MI.length-MI.age);
 if(old<30&&MI.age>=30)speak();
 for(let i=0;i<phases.length;i++)if(MI.age>=phases[i])hit(i);
 if(MI.age>=MI.length){const b=MI.victim,dead=!!(b&&b.hp<=0),won=a===player;
  reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;
  clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];
  if(dead)finish(won);
 }
 oldHud();
}
update=function(dt){if(MI.active){tick(dt);return;}return oldUpdate.apply(this,arguments);};
draw=function(){oldDraw.apply(this,arguments);if(MI.active)cinematic();};
updateHud=function(){oldHud.apply(this,arguments);if(!player)return;
 const ready=player.id===0&&(practice||player.meter>=100)&&player.cool<=0&&!MI.active;
 const btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('alca-super-ready',ready);
  if(ready){const label=btn.querySelector('small');if(label)label.textContent='SÚPER EX';btn.setAttribute('aria-label','La Alcahueta, súper EX: Mi destino');}}
 if(ready&&$('cool'))$('cool').textContent='EX LLENO · ○ / L: ¡MI DESTINO!';
};
// Optional sprite asset is lazy. The fight continues if the network is unavailable.
fetch('assets/alca-duo-sprites-v1.b64?v=1').then(r=>{if(!r.ok)throw Error('Sprites invocados '+r.status);return r.text();}).then(s=>{
 const im=new Image();im.onload=()=>{if(im.naturalWidth>=1000&&im.naturalHeight>=600)MI.art=im;};
 im.onerror=()=>console.warn('[Mi destino] Sprites no disponibles; usando figuras de respaldo');
 im.src='data:image/webp;base64,'+s.replace(/\s/g,'');
}).catch(e=>console.warn('[Mi destino] No se pudo cargar el atlas',e));
const css=document.createElement('style');css.textContent='.alca-super-ready{outline:3px solid #fff3ab!important;box-shadow:0 0 17px 5px #ffca73!important;animation:alcaEXGlow .85s ease-in-out infinite alternate}@keyframes alcaEXGlow{from{filter:brightness(1)}to{filter:brightness(1.35)}}';
document.head.appendChild(css);
})();