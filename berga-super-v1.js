/* Dra. En Berga — BOCINAZO FEROZ. Cinematic car, Dr. Tostador passenger, road rage and run-over. */
(function(){'use strict';
const S={active:false,t:0,length:320,speed:.72,a:null,b:null,hit:false,horn:0};
window.BERGA_SUPER=S;
const previousStrike=strike,previousUpdate=update,previousDraw=draw,previousHud=updateHud,previousReset=resetArcade;
function reset(){S.active=false;S.t=0;S.a=null;S.b=null;S.hit=false;S.horn=0;}
resetArcade=function(){reset();return previousReset.apply(this,arguments)};
function allowed(a,type){return type==='special'&&a?.id===5&&a.hp>0&&a.y===0&&a.attack<=0&&a.cool<=0&&a.stun<=0&&a.blockstun<=0&&!a.blocking&&!a.grabbed&&!a.grabbing&&a.escaping<=0&&(practice||a.meter>=100)&&introFrames<=0&&!ending&&!window.TREX_SUP?.active&&!window.DRAPIE_SUPER?.active&&!window.ALCA_SUPER?.active&&!S.active&&!(typeof ONLINE!=='undefined'&&ONLINE.active)}
strike=function(a,b,type,power,low){if(!allowed(a,type))return previousStrike.apply(this,arguments);
 S.active=true;S.t=0;S.a=a;S.b=b||null;S.hit=false;S.horn=0;window.SUPER_DEFENSE?.start('berga',a,b);
 a.meter=0;a.attackType='berga-super';a.attackLength=S.length;a.attack=S.length;a.ex=true;a.finisher=false;a.cool=practice?S.length:420;a.vy=0;a.y=0;a.blocking=false;a.crouching=false;a.moving=false;a.hit=false;a.connected=false;a.cast=++castSerial;a.shots=0;a.invuln=S.length+10;
 if(b)b.moving=false;clearActionBuffer();cancelCharges();if(typeof SECOND!=='undefined'){SECOND.actions=[];cancelSecondCharges();}
 announcement='¡BOCINAZO FEROZ!';announceTime=0;exFlash=20;haptic(55);previousHud();return true;
};
function text(s,x,y,size,color='#fff'){ctx.save();ctx.font='italic 900 '+size+'px system-ui';ctx.textAlign='center';ctx.lineWidth=7;ctx.strokeStyle='#170b2c';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore()}
function person(id,x,y,size){const m=atlasMap[id];ctx.save();ctx.translate(x,y);SpriteAtlas.draw(ctx,atlases[m[0]],m[1],0,0,0,size);ctx.restore()}
function car(x,y,t){ctx.save();ctx.translate(x,y);const bounce=t>=100&&t<236?Math.sin(t*.65)*3:0;ctx.translate(0,bounce);
 // Chassis and tires are drawn as coherent original vector animation.
 ctx.fillStyle='#14162c';for(const w of [-125,122]){ctx.beginPath();ctx.arc(w,6,37,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bbc6da';ctx.beginPath();ctx.arc(w,6,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#14162c'}
 ctx.fillStyle='#d6455f';ctx.strokeStyle='#401c36';ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(-201,-91,403,95,23);ctx.fill();ctx.stroke();
 ctx.fillStyle='#e85c6b';ctx.beginPath();ctx.moveTo(-130,-91);ctx.lineTo(-84,-167);ctx.lineTo(93,-167);ctx.lineTo(158,-91);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#b3e9f3';ctx.beginPath();ctx.moveTo(-70,-154);ctx.lineTo(8,-154);ctx.lineTo(8,-98);ctx.lineTo(-106,-98);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(22,-154);ctx.lineTo(83,-154);ctx.lineTo(133,-98);ctx.lineTo(22,-98);ctx.closePath();ctx.fill();
 ctx.save();ctx.beginPath();ctx.rect(-108,-157,243,61);ctx.clip();person(5,-44,-72,165);person(4,73,-72,158);ctx.restore();
 ctx.strokeStyle='#281c3b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(13,-157);ctx.lineTo(13,-92);ctx.stroke();
 ctx.fillStyle='#fff4a6';ctx.fillRect(171,-65,25,23);ctx.fillStyle='#ffb6c1';ctx.fillRect(-200,-66,15,21);
 if(t>=98&&t<230){const intensity=20+Math.sin(t*.8)*14;for(let i=0;i<3;i++){ctx.strokeStyle='#ffe16d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(215,-48,28+i*19+intensity*.3,-.65,.65);ctx.stroke()}}
 ctx.restore()}
function background(t){const g=ctx.createLinearGradient(0,0,960,540);g.addColorStop(0,'#391d62');g.addColorStop(.55,'#ab5060');g.addColorStop(1,'#ffb56b');ctx.fillStyle=g;ctx.fillRect(0,0,960,540);ctx.fillStyle='#1d2847';for(let i=0;i<12;i++){const x=i*100-40;ctx.fillRect(x,210-(i%3)*31,76,210+(i%3)*31)}ctx.fillStyle='#42485b';ctx.fillRect(0,414,960,126);ctx.fillStyle='#ffe9a0';for(let i=0;i<7;i++)ctx.fillRect((i*190-t*3)%1100-120,476,100,9)}
function cinematic(){if(!S.active)return;const t=S.t;ctx.save();background(t);
 let x=t<46?-300+(t/46)*515:t<235?215:t<285?215+((t-235)/50)*1120:1400;
 if(t>=235&&t<285){ctx.save();ctx.globalAlpha=.32;for(let i=0;i<8;i++){ctx.strokeStyle='#fff5b1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,260+i*26);ctx.lineTo(960,260+i*26);ctx.stroke()}ctx.restore()}
 if(S.b){const m=atlasMap[S.b.id];ctx.save();ctx.translate(792,432);ctx.scale(-1,1);SpriteAtlas.draw(ctx,t>=271?actionAtlases[actionMap[S.b.id][0]]:atlases[m[0]],t>=271?actionMap[S.b.id][1]:m[1],t>=271?5:0,0,0,270);ctx.restore()}
 car(x,418,t);
 if(t>=94&&t<236){const k=Math.floor((t-94)/18);text(k%2?'¡MOOOOOC!':'¡PIIIIIIP!',480,130,51,'#fff083');text('¡IRA DE CARRETERA!',480,195,32,'#ffb4be')}
 if(t>=235&&t<290)text('¡BOCINAZO FEROZ!',480,100,53,'#ffe16d');
 if(t>=275&&t<298){ctx.fillStyle='rgba(255,255,255,'+(298-t)/55+')';ctx.fillRect(0,0,960,540)}
 ctx.fillStyle='#111029';ctx.fillRect(0,0,960,43);ctx.fillRect(0,496,960,44);ctx.font='900 20px system-ui';ctx.textAlign='left';ctx.fillStyle='#ffe7ac';ctx.fillText('DRA. EN BERGA / SÚPER EX',27,28);ctx.textAlign='right';ctx.fillText('CON DR. TOSTADOR',932,28);
 if(t<93)text('¡SUBAN AL COCHE!',480,87,39,'#fff0b2');
 window.SUPER_DEFENSE?.draw('berga',ctx,t);ctx.restore()}
function impact(){if(S.hit)return;S.hit=true;const a=S.a,b=S.b;if(!b||b.hp<=0)return;const factor=window.SUPER_DEFENSE?.multiplier('berga')??1;window.SUPER_DEFENSE?.notice('berga');if(factor===0)return;const damage=MAX_HP*.48*factor;b.hp=clamp(b.hp-damage,0,MAX_HP);b.x=clamp(b.x+(a.dir||1)*115,80,880);b.knockback=(a.dir||1)*9;b.stun=Math.max(b.stun||0,78);b.blockstun=0;b.blocking=false;b.parryWindow=0;b.hitRecoil=1;b.hitStrength=1.9;b.hitDirection=a.dir||1;b.hitHeight=1;b.attack=0;b.hit=true;b.meter=clamp(b.meter+12,0,100);a.hit=true;a.connected=true;effects.push({x:b.x,y:235,t:34,burst:true,kind:-3,blocked:false});effects.push({x:b.x,y:150,t:50,text:'¡ATROPELLADO!',color:'#ffe38d'});shake=Math.max(shake,25);hitstop=Math.max(hitstop,11);sfx('hit',{intensity:2});haptic(90);if(a===player&&!practice)score+=Math.round(damage*18)}
function tick(dt){if(!S.active)return;S.t=Math.min(S.length,S.t+dt*S.speed);const a=S.a;a.attack=Math.max(0,S.length-S.t);window.SUPER_DEFENSE?.tick('berga',S.t);if(S.t>=98&&S.t<229&&Math.floor(S.t/20)>S.horn){S.horn=Math.floor(S.t/20);sfx('ready');haptic(20)}if(S.t>=270&&!S.hit)impact();if(S.t>=S.length){const dead=!!S.b&&S.b.hp<=0,win=a===player;window.SUPER_DEFENSE?.end('berga');reset();a.attack=0;a.attackType='';a.ex=false;a.invuln=0;clearActionBuffer();if(typeof SECOND!=='undefined')SECOND.actions=[];if(dead)finish(win)}previousHud()}
update=function(dt){if(S.active){tick(dt);return}return previousUpdate.apply(this,arguments)};
draw=function(){previousDraw.apply(this,arguments);if(S.active)cinematic()};
updateHud=function(){previousHud.apply(this,arguments);if(!player)return;const ready=player.id===5&&(practice||player.meter>=100)&&player.cool<=0&&!S.active;const btn=document.querySelector('[data-key=special]');if(btn){btn.classList.toggle('berga-super-ready',ready);if(ready){const label=btn.querySelector('small');if(label)label.textContent='SÚPER EX';btn.setAttribute('aria-label','Bocinazo feroz')}}if(ready&&$('cool'))$('cool').textContent='EX LLENO · ¡BOCINAZO FEROZ!'};
const css=document.createElement('style');css.textContent='.berga-super-ready{outline:3px solid #ffdc8a!important;box-shadow:0 0 17px 5px #fa7695!important;animation:bergaGlow .8s infinite alternate}@keyframes bergaGlow{to{filter:brightness(1.4)}}';document.head.appendChild(css);
})();