/* Coqui - REFORMAS A DOMICILIO. Twelve bespoke full-body cartoon sprites,
   timed defense, separate normal Flic Flac. coqui-reformas-poses-v2.js required. */
(function(){
'use strict';
const C={active:false,t:0,length:354,speed:.82,actor:null,victim:null,frames:[],
  ready:false,hit:false,miss:false,defense:null,soundStep:0};
window.COQUI_SUPER=C;
const oldStrike=strike,oldUpdate=update,oldDraw=draw,oldHud=updateHud,oldReset=resetArcade;
function reset(){C.active=false;C.t=0;C.actor=null;C.victim=null;C.hit=false;C.miss=false;C.defense=null;C.soundStep=0;}
resetArcade=function(){if(C.active)window.SUPER_DEFENSE?.end('coqui');reset();return oldReset.apply(this,arguments);};
function canStart(a,type){
 return type==='special'&&a&&a.id===2&&a.hp>0&&a.y===0
 &&a.attack<=0&&a.cool<=0&&a.stun<=0&&a.blockstun<=0
 &&!a.blocking&&!a.grabbed&&!a.grabbing&&a.escaping<=0
 &&(practice||a.meter>=100)&&introFrames<=0&&!ending
 &&!(typeof ONLINE!=='undefined'&&ONLINE.active)
 &&!(typeof projectileClash!=='undefined'&&projectileClash)
 &&!['TREX_SUP','DRAPIE_SUPER','ALCA_SUPER','BERGA_SUPER','MALEFICA_SUPER','COQUI_SUPER'].some(k=>window[k]?.active);
}
strike=function(a,b,type,power,low){
 if(!canStart(a,type))return oldStrike.apply(this,arguments);
 reset();C.active=true;C.actor=a;C.victim=b||null;
 window.SUPER_DEFENSE?.start('coqui',a,b);
 a.meter=0;a.attackType='coqui-super';a.attackLength=C.length;a.attack=C.length;
 a.ex=true;a.finisher=false;a.cool=practice?C.length:390;
 a.crouching=false;a.blocking=false;a.moving=false;a.hit=false;a.connected=false;
 a.shots=0;a.cast=++castSerial;a.vy=0;a.y=0;a.invuln=C.length+10;
 if(b)b.moving=false;
 clearActionBuffer();cancelCharges();
 if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡REFORMAS A DOMICILIO!';announceTime=0;exFlash=18;
 haptic(38);oldHud();return true;
};
function line(c,points,color,w){
 c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(points[0],points[1]);
 for(let j=2;j<points.length;j+=2)c.lineTo(points[j],points[j+1]);
 c.stroke();
}
function rect(c,x,y,w,h,r,color,stroke){
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}
}
function roller(c,x,y,tilt){
 c.save();c.translate(x,y);c.rotate(tilt);
 line(c,[-18,71,-18,13,32,13,32,-21],'#20253d',10);
 line(c,[-18,71,-18,13,32,13,32,-21],'#b0c6ce',5);
 rect(c,-30,50,25,65,9,'#e74f37','#39233a');
 rect(c,18,-59,96,47,15,'#fafaf1','#2f3448');
 for(let j=0;j<5;j++)line(c,[25+j*18,-21,19+j*18,-14],'#d6d6da',3);
 c.fillStyle='#fafcfb';for(let i=0;i<7;i++){
  c.beginPath();c.ellipse(30+i*12,-10+(i%2)*8,3+i%3,7,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function sander(c,x,y,angle){
 c.save();c.translate(x,y);c.rotate(angle);
 rect(c,-70,-5,150,19,8,'#dfbc7d','#573a30');
 rect(c,-57,-68,120,76,19,'#0b8b9e','#102b46');
 rect(c,-45,-83,85,26,11,'#263b57','#0e1932');
 rect(c,0,-83,33,22,6,'#ed4739','#54282d');
 line(c,[65,-41,100,-30,109,10],'#182437',7);
 for(let j=0;j<9;j++){
  const px=(j*41)%160-80,py=(j*27)%90-20;
  c.fillStyle='#e6c48b';c.beginPath();c.arc(px,py,3+j%3,0,7);c.fill();
 }
 c.restore();
}
function profile(c,x,y,angle){
 c.save();c.translate(x,y);c.rotate(angle);
 c.fillStyle='#6c8494';c.strokeStyle='#17253b';c.lineWidth=5;
 c.beginPath();c.moveTo(-160,-29);c.lineTo(155,-29);c.lineTo(172,-15);
 c.lineTo(172,20);c.lineTo(145,20);c.lineTo(145,-5);
 c.lineTo(-135,-5);c.lineTo(-135,23);c.lineTo(-161,23);c.closePath();
 c.fill();c.stroke();
 line(c,[-143,-22,155,-22],'#d6ecfa',6);
 for(let j=0;j<5;j++){
  c.fillStyle='#263d50';c.beginPath();c.arc(-110+j*56,-13,4,0,7);c.fill();
 }
 c.restore();
}
function dust(c,x,y,phase){
 c.save();c.translate(x,y);
 for(let i=0;i<9;i++){
  const ang=i*Math.PI*2/9+phase*.1,dist=18+(i%4)*17;
  const px=Math.cos(ang)*dist,py=Math.sin(ang)*dist*.55;
  c.fillStyle=i%2?'#f1d2a1':'#c49d6e';c.strokeStyle='#8e684e';
  c.lineWidth=2;c.beginPath();c.arc(px,py,12+(i%3)*7,0,7);c.fill();c.stroke();
 }
 c.restore();
}
function splash(c,x,y,phase){
 c.save();c.translate(x,y);c.rotate(phase*.07);
 c.fillStyle='#faf8f0';c.strokeStyle='#b2cbd3';c.lineWidth=4;
 c.beginPath();c.ellipse(0,0,65,26,-.3,0,7);c.fill();c.stroke();
 for(let i=0;i<9;i++){
  const a=i*.78;line(c,[Math.cos(a)*20,Math.sin(a)*12,
    Math.cos(a)*(70+i%3*19),Math.sin(a)*(28+i%3*15)],'#fffefd',8);
 }
 c.restore();
}
function burst(c,x,y,phase){
 c.save();c.translate(x,y);c.rotate(phase*.08);
 c.fillStyle='#ffe66c';c.strokeStyle='#b74a24';c.lineWidth=7;c.beginPath();
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,rad=i%2?41:112;
  const px=Math.cos(a)*rad,py=Math.sin(a)*rad;
  if(!i)c.moveTo(px,py);else c.lineTo(px,py);
 }
 c.closePath();c.fill();c.stroke();
 c.fillStyle='#ff7e33';c.beginPath();c.arc(0,0,28,0,7);c.fill();
 c.restore();
}
function prepare(){
 if(C.ready)return;
 try {
  const frames=window.COQUI_REFORMAS_POSES?.build?.();
  if(!frames||frames.length!==12)throw Error('Expected twelve original Coqui poses');
  C.frames=frames;C.ready=true;
 }catch(err){console.warn('[Coqui EX] Bespoke sprite atlas not ready',err);}
}
if(typeof assetReady!=='undefined')assetReady.then(prepare).catch(()=>{});
function pose(t){
 if(t<24)return 0;if(t<52)return 1;if(t<91)return 2;
 if(t<144)return 3;if(t<166)return 4;
 if(t<199)return 5;if(t<242)return 6;
 if(t<266)return 7;if(t<293)return 8;
 if(t<310)return 9;if(t<334)return 10;return 11;
}
function backdrop(t){
 const g=ctx.createLinearGradient(0,0,960,540);
 g.addColorStop(0,'#153c58');g.addColorStop(.55,'#234e68');g.addColorStop(1,'#10172c');
 ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
 ctx.fillStyle='#d1c2ab';ctx.fillRect(485,103,383,363);
 ctx.fillStyle='#8c857e';ctx.fillRect(485,103,383,14);
 for(let i=0;i<8;i++){ctx.strokeStyle='#ded3c0';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(490,143+i*39);ctx.lineTo(868,143+i*39);ctx.stroke();}
 // Coqui paints the wall during the first phase.
 if(t>54){ctx.fillStyle='#fffef4';ctx.fillRect(496,118,Math.min(350,(t-54)*8),Math.min(328,180+Math.max(0,t-90)*5));}
 ctx.fillStyle='#172638';ctx.fillRect(0,465,960,75);
 ctx.strokeStyle='#6d9baf';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,465);ctx.lineTo(960,465);ctx.stroke();
 ctx.fillStyle='#4f6473';ctx.fillRect(46,421,73,43);ctx.fillRect(48,405,68,19);
 ctx.fillStyle='#e4e7e5';ctx.fillRect(60,409,44,9);
 // Assembled framing appears after the sanding step.
 if(t>240){ctx.save();ctx.globalAlpha=Math.min(1,(t-240)/22);
  ctx.strokeStyle='#a6c2d3';ctx.lineWidth=11;
  ctx.strokeRect(540,206,230,238);
  for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(590+j*64,208);ctx.lineTo(590+j*64,442);ctx.stroke();}
  ctx.restore();}
}
function victim(t){
 const b=C.victim;if(!b||!atlasMap?.[b.id])return;
 const hit=t>=316&&C.hit&&C.defense!=='perfect';
 const p=hit?Math.min(1,(t-316)/26):0;
 ctx.save();ctx.translate(760+(hit?p*56:0),464-(hit?Math.sin(p*Math.PI)*70:0));ctx.scale(-1,1);
 const m=hit?actionMap[b.id]:atlasMap[b.id];
 SpriteAtlas.draw(ctx,hit?actionAtlases[m[0]]:atlases[m[0]],m[1],hit?5:0,0,0,300);
 ctx.restore();
}
function actor(t){
 if(!C.ready)prepare();
 const i=pose(t),dash=Math.max(0,Math.min(1,(t-278)/35));
 const x=170+(t>278?dash*140:0);
 ctx.save();ctx.translate(x,465);
 if(C.ready)ctx.drawImage(C.frames[i],-245,-410);
 else {
  const m=atlasMap[2];SpriteAtlas.draw(ctx,atlases[m[0]],m[1],0,0,0,300);
  if(i<4)roller(ctx,120,-210,-.2);
  else if(i<7)sander(ctx,120,-190,.1);
  else profile(ctx,155,-135,-.2);
 }
 ctx.restore();
}
function caption(t){
 if(t<25)return '¡OBRA EN MARCHA!';
 if(t<53)return 'SACANDO EL RODILLO...';
 if(t<145)return '¡PINTURA BLANCA PARA TODOS!';
 if(t<167)return 'AHORA TOCA LIJAR';
 if(t<243)return '¡POLVO POR TODAS PARTES!';
 if(t<267)return 'ARMANDO EL PERFIL...';
 if(t<310)return '¡TE VOY A REFORMAR!';
 if(C.miss)return '¡SE FUE DE MEDIDA!';
 if(C.defense==='perfect')return '¡DEFENSA PERFECTA!';
 return '¡REFORMA TERMINADA!';
}
function label(text,x,y,size){
 ctx.textAlign='center';ctx.font='italic 900 '+size+'px system-ui';
 ctx.lineJoin='round';ctx.strokeStyle='#102135';ctx.lineWidth=7;ctx.strokeText(text,x,y);
 ctx.fillStyle='#fff0a0';ctx.fillText(text,x,y);
}
function cinematic(){
 const t=C.t;
 ctx.save();backdrop(t);
 victim(t);actor(t);
 if(t>=105&&t<155){let p=(t-105)/50;ctx.save();ctx.globalAlpha=Math.min(1,(1-p)*2);
  splash(ctx,465+p*320,225,Math.floor(t/6));ctx.restore();}
 if(t>=194&&t<251){ctx.save();ctx.globalAlpha=Math.max(0,1-Math.max(0,t-231)/20);
  dust(ctx,400+(t-194)*5,270,t);ctx.restore();}
 if(t>=282&&t<338){const p=(t-282)/56;
  ctx.save();ctx.translate(500+250*p,240);ctx.rotate(-.3+.8*p);
  profile(ctx,0,0,0);ctx.restore();}
 if(t>=311&&t<346){
  const p=t-311,perfect=window.SUPER_DEFENSE?.result('coqui')==='perfect';
  ctx.save();ctx.globalAlpha=Math.max(0,1-Math.max(0,p-20)/15);
  if(perfect){ctx.strokeStyle='#93ffe1';ctx.lineWidth=15;
   ctx.beginPath();ctx.arc(750,243,80+p*4,0,7);ctx.stroke();}
  else{burst(ctx,748,255,p);}
  ctx.restore();
 }
 ctx.fillStyle='#071b2e';ctx.fillRect(0,0,960,43);ctx.fillRect(0,497,960,43);
 ctx.textAlign='left';ctx.font='900 21px system-ui';ctx.fillStyle='#ffeaa4';
 ctx.fillText('COQUI / SÚPER EX',25,28);
 ctx.textAlign='right';ctx.fillText('REFORMAS A DOMICILIO',935,28);
 label(caption(t),480,92,t<300?34:40);
 window.SUPER_DEFENSE?.draw('coqui',ctx,t);
 ctx.restore();
}
function impact(){
 if(C.hit)return;C.hit=true;
 const a=C.actor,b=C.victim;
 C.defense=window.SUPER_DEFENSE?.result('coqui')||'fail';
 if(!b||b.hp<=0){C.miss=true;return;}
 // This cinematic hits any active opponent: it is not distance-sensitive.
 const mul=window.SUPER_DEFENSE?.multiplier('coqui')??1;
 window.SUPER_DEFENSE?.notice('coqui');
 if(mul===0){
  effects.push({x:b.x,y:155,t:55,text:'¡TE CABIÓ!',color:'#b4ffe2'});
  haptic(25);return;
 }
 const damage=MAX_HP*.44*mul;
 b.hp=clamp(b.hp-damage,0,MAX_HP);
 b.x=clamp(b.x+(a.dir||1)*(mul===.5?45:95),80,880);
 b.knockback=(a.dir||1)*7;
 b.stun=Math.max(b.stun||0,67);b.blockstun=0;b.blocking=false;b.parryWindow=0;
 b.hitRecoil=1;b.hitStrength=1.65;b.hitHeight=1;b.hitDirection=a.dir||1;b.attack=0;b.hit=true;
 b.meter=clamp(b.meter+12,0,100);a.hit=true;a.connected=true;
 effects.push({x:b.x,y:230,t:33,burst:true,kind:-3,blocked:false});
 effects.push({x:b.x,y:154,t:53,text:'¡PERFILAZO!',color:'#ffe898'});
 shake=Math.max(shake,21);hitstop=Math.max(hitstop,8);sfx('hit',{intensity:2});haptic(90);
 if(a===player&&!practice)score+=Math.round(damage*16);
}
function tick(dt){
 if(!C.active)return;
 C.t=Math.min(C.length,C.t+dt*C.speed);
 const t=C.t,a=C.actor;
 a.attack=Math.max(0,C.length-t);
 window.SUPER_DEFENSE?.tick('coqui',t);
 const step=t>=285?3:t>=195?2:t>=105?1:0;
 if(step>C.soundStep){C.soundStep=step;sfx('ready');haptic(14);}
 if(t>=318&&!C.hit)impact();
 if(t>=C.length){
  const dead=!!C.victim&&C.victim.hp<=0,win=a===player;
  window.SUPER_DEFENSE?.end('coqui');reset();
  a.attack=0;a.attackType='';a.ex=false;a.invuln=0;
  clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];
  if(dead)finish(win);
 }
 oldHud();
}
update=function(dt){if(C.active){tick(dt);return;}return oldUpdate.apply(this,arguments);};
draw=function(){oldDraw.apply(this,arguments);if(C.active)cinematic();};
updateHud=function(){
 oldHud.apply(this,arguments);
 if(!player)return;
 const ready=player.id===2&&(practice||player.meter>=100)&&player.cool<=0&&!C.active;
 const btn=document.querySelector('[data-key=special]');
 if(btn)btn.classList.toggle('coqui-super-ready',ready);
 if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡REFORMAS A DOMICILIO!';
};
const css=document.createElement('style');
css.textContent='.coqui-super-ready{outline:3px solid #e9f8ab!important;box-shadow:0 0 18px 5px #a3eee9!important;animation:coquiExPulse 1s ease-in-out infinite alternate}@keyframes coquiExPulse{to{filter:brightness(1.4)}}';
document.head.appendChild(css);
})();