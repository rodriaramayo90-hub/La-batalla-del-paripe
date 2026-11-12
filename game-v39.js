
const fighters=[
['Alcahueta','Ciruja callejera','Ataque de Cirujeo',7,8,8,8,'#df395c','¡Alcahuetovich!'],
['T-Rex','Dinosaurio desarticulado','Pierna voladora',9,5,8,6,'#3e9b76','RAAAAAWR'],
['Coqui','Gimnasta acrobática','Flic Flac',7,8,5,9,'#e2a936','¡Aguante Burzaco papá!'],
['Lucas','Experto en sobras','Flan de Orujo',8,7,7,8,'#5d9fea','¡Flan de orujo!'],
['Dr. Tostador','Médico experimental','Golden Shower',8,7,7,8,'#ae70e0','¡Meada de castigo!'],
['Dra. En Berga','Especialista en bolos fecales','Picada con Sobreprecio',7,8,7,8,'#ef6d89','¡Son 50 euros!'],
['La Drapie','Limpieza profunda','Limpieza Extrema',8,7,7,8,'#4fb7c7','¡Limpieza extrema!'],
['Flor Rubia','Padelera implacable','Paletazo',7,8,7,8,'#f7a84d','¡Para vos Vero!'],
['Bites','Científico implacable','MIR',8,7,7,8,'#91b3ff','¡MIR!'],
['Malefica','Artista golpista','Ataque Artístico',6,9,8,9,'#a850e9','¡Ataque artístico!'],
['Lu','Gritos aturdidores','Grito Supersónico',6,9,8,9,'#df3e9d','¡Grito supersónico!'],
['Daf','Logística sanitaria','Respirador de Air Liquide',7,8,7,8,'#56b4b1','¡Respirador!']
];
'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function loadImage(src){const image=new Image();image.src=src;return image}
const atlases=['normal-v12-a.webp','normal-v12-b.webp','normal-v12-c.webp'].map(n=>loadImage('assets/'+n));
const specials=['a','b','c'].map(n=>loadImage('assets/specials-v12-'+n+'.webp'));
const props=loadImage('assets/props-v4.webp'),florPortrait=loadImage('assets/flor-portrait-v4.webp');
const actionAtlases=['a','b','c'].map(n=>loadImage('assets/actions-v12-'+n+'.webp'));const allImages=[...atlases,...specials,...actionAtlases,props,florPortrait];
const phoneArt=loadImage('assets/trex-phone-v28.webp');allImages.push(phoneArt);
const crouchArt=loadImage('assets/crouch-v31.webp'),grabArt=loadImage('assets/grab-v31.webp');const lowPunchArt=loadImage('assets/low-punch-v33.webp'),lowKickArt=loadImage('assets/low-kick-v33.webp');allImages.push(crouchArt,grabArt,lowPunchArt,lowKickArt);
const finisherAtlases=['a','b','c','d'].map(n=>{const im=loadImage('assets/finishers-v35-'+n+'.webp');im.spriteRows=3;return im;});const biteArt=loadImage('assets/trex-bite-v35.webp');const revisedFinisherArt=loadImage('assets/finishers-v37-lucas-bites.webp');revisedFinisherArt.spriteRows=2;finisherAtlases.push(revisedFinisherArt);const themedFinisherArt=['a','b'].map(n=>{const im=loadImage('assets/finishers-v38-'+n+'.webp');im.spriteRows=2;return im;});finisherAtlases.push(...themedFinisherArt);const alcaFinisherArt=loadImage('assets/finishers-v39.webp');alcaFinisherArt.spriteRows=2;finisherAtlases.push(alcaFinisherArt);const diveMaskArt=loadImage('assets/dive-mask-v39.webp');allImages.push(...finisherAtlases,biteArt,diveMaskArt);
let assetsLoaded=false;
const assetReady=Promise.all(allImages.map(im=>im.decode())).then(async()=>{
 const reports=await SpriteAtlas.prepare([...atlases,...actionAtlases,...specials,...finisherAtlases]);
 if(reports.some(report=>report.fallback))throw new Error('Sprite atlas extraction incomplete');
 crouchCells=combatSheet(crouchArt);grabCells=combatSheet(grabArt);lowPunchCells=combatSheet(lowPunchArt);lowKickCells=combatSheet(lowKickArt);prepareKnockdownBounds();assetsLoaded=true;return true;
});assetReady.catch(()=>{});
const atlasMap=[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[0,3],[2,1],[1,3],[2,2],[2,3]];
const specialMap=[[0,0],[0,1],[2,0],[0,2],[0,3],[1,0],[1,3],[2,2],[1,2],[2,1],[2,3],[1,1]];
const specialNames=['Cirujeo: bolsa y objetos','Pierna voladora','Flic Flac','Flan de Orujo','Golden Shower','Picada con sobreprecio','Limpieza extrema','Para vos, Vero','MIR','Ataque artístico','Grito supersónico','Respirador de Air Liquide'];
const specialPlans=[{length:90,times:[45,49,53,57,61,65],items:[0,1,2,3,4,5]},{length:82,times:[41],items:[6]},{length:88,times:[],items:[]},{length:76,times:[38],items:[7]},{length:76,times:[38],items:[8]},{length:80,times:[40],items:[9]},{length:76,times:[],items:[]},{length:72,times:[36],items:[14]},{length:88,times:[44,48,52,56],items:[11,12,13,11]},{length:76,times:[38,42,46],items:[-1,-1,-1]},{length:80,times:[40],items:[-2]},{length:80,times:[40],items:[10]}];
let selected=0,queue=[],battle=0,player,enemy,projectiles=[],effects=[],mode='menu',last=0,keys={},aiClock=0,frame=0,announcement='',announceTime=0,animationId=0,ending=false,battleToken=0,castSerial=0,starting=false;
let hitstop=0,shake=0;const queued={punch:0,kick:0,special:0,grab:0};
const audio=new ArcadeAudio();let soundEnabled=!audio.muted;
function refreshAudioButton(){const b=$('audio-toggle');if(!b)return;const ready=audio.isReady?audio.isReady():audio.context?.state==='running';b.textContent=!soundEnabled?'SONIDO OFF':ready?'SONIDO ON':'ACTIVAR SONIDO';b.setAttribute('aria-pressed',String(soundEnabled&&ready));}
audio.onStateChange=refreshAudioButton;
function unlockAudio(){const pending=audio.unlock();pending.then(ok=>{if(ok&&mode==='game'&&soundEnabled)audio.startMusic();refreshAudioButton()}).catch(refreshAudioButton);return pending;}
function toggleAudio(){const needsActivation=soundEnabled&&!(audio.isReady?audio.isReady():audio.context?.state==='running');if(!needsActivation)soundEnabled=!soundEnabled;audio.setMuted(!soundEnabled);if(soundEnabled)unlockAudio();refreshAudioButton();}
function toggleSound(){toggleAudio()}
function sfx(type,opts={}){if(typeof ONLINE!=='undefined'&&ONLINE.active&&ONLINE.role===0)ONLINE.events.push({type:({guard:'block',step:'land',ko:'win'})[type]||type,opts});audio.cue(({guard:'block',step:'land',ko:'win'})[type]||type,opts)}
function haptic(ms){try{if('vibrate'in navigator)navigator.vibrate(ms)}catch{}}
const collides=(a,b)=>a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function hurtbox(a){return {left:a.x-43,right:a.x+43,top:463-a.y-(a.crouching?160:258),bottom:463-a.y-15}}
function facingHitbox(a,type){if(a.finisher&&a.attack>0)return finisherHitbox(a);const kick=type==='kick',level=attackLevel(a),far=(kick?173:139)+(fighters[a.id][5]-7)*9;const x1=a.x+a.dir*28,x2=a.x+a.dir*far;const top=level==='low'?399:level==='high'?220:level==='overhead'?260: a.crouching?306:284;const bottom=level==='low'?451:level==='high'?290:level==='overhead'?445:a.crouching?395:397;return{left:Math.min(x1,x2),right:Math.max(x1,x2),top:top-a.y,bottom:bottom-a.y}}
function specialHitbox(a){const far=a.id===2?211:300,from=32;
const x1=a.x+a.dir*from,x2=a.x+a.dir*far;
return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:463-a.y-277,bottom:463-a.y-55}}
function projectileHitbox(p){if(p.finisherProjectile)return themedProjectileBox(p);const dx=p.kind===-2?65:p.kind===6?55:43,dy=p.kind===-2?72:47;return{left:p.x-dx,right:p.x+dx,top:p.y-dy,bottom:p.y+dy}}
function bufferAction(key,power=false,low=!!keys.down){if(inputQueue.length>=6)return;inputQueue.push({type:key,power,low,ttl:48});queued[key]=48;}
const CHARGE_FRAMES=36,chargeInputs=new Map(),queuedPower={punch:false,kick:false};
function beginCharge(type,source){if(type==='punch'&&keys.defend){bufferAction('grab');return;}if(mode!=='game'||ending||introFrames>0||!player||player.escaping>0||player.stun>0||player.blockstun>0||keys.defend||type==='kick'&&player.legGone)return;chargeInputs.set(source,{type,frames:0,ready:false,low:!!keys.down});}
function releaseCharge(source,cancel=false){const hold=chargeInputs.get(source);if(!hold)return;chargeInputs.delete(source);if(!cancel&&mode==='game'&&!ending&&player.stun<=0){queuedPower[hold.type]=hold.frames>=CHARGE_FRAMES;bufferAction(hold.type,queuedPower[hold.type],hold.low||!!keys.down);}syncChargeButtons();}
function cancelCharges(){chargeInputs.clear();queuedPower.punch=queuedPower.kick=false;syncChargeButtons();}
function activeCharge(){return [...chargeInputs.values()].sort((a,b)=>b.frames-a.frames)[0];}
function syncChargeButtons(){for(const type of ['punch','kick']){const b=document.querySelector('[data-key='+type+']');if(!b)continue;const holds=[...chargeInputs.values()].filter(h=>h.type===type),amount=Math.max(0,...holds.map(h=>h.frames/CHARGE_FRAMES));b.style.setProperty('--charge',Math.min(100,amount*100)+'%');b.classList.toggle('charging',holds.length>0);b.classList.toggle('charge-ready',amount>=1);}}
function updateCharge(dt){if(player.escaping>0||player.stun>0||player.blockstun>0||keys.defend||ending){cancelCharges();return;}for(const h of chargeInputs.values()){if(keys.down)h.low=true;if(!player.attack&&player.y===0){h.frames=Math.min(CHARGE_FRAMES,h.frames+dt);if(h.frames>=CHARGE_FRAMES&&!h.ready){h.ready=true;sfx('ready');haptic(16)}}}syncChargeButtons();}
function activateAudioFromGesture(e){if(e.target.closest?.('#audio-toggle'))return;unlockAudio();}
for(const event of ['pointerdown','pointerup','touchend','click','keydown'])document.addEventListener(event,activateAudioFromGesture,{capture:true,passive:true});
const MAX_HP=220,DAMAGE_SCALE=.85;let practice=false,selectPractice=false,practiceStage=0;
let introFrames=0,matchFrames=99*60,comboTimer=0,comboCount=0,bestCombo=0,score=0,exFlash=0,trailClock=0;let trails=[];const lastTap={left:-10000,right:-10000};const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ctx=$('canvas').getContext('2d');
function portraitMarkup(i){if(i===7)return '<img src="assets/flor-portrait-v4.webp" alt="Flor Rubia">';if(i===9)return '<div class="corrected-portrait" role="img" aria-label="Malefica"></div>';return `<img src="assets/face${i}.jpg" alt="${fighters[i][0]}">`}
function show(id){cancelCharges();battleToken++;keys={};clearActionBuffer();cancelAnimationFrame(animationId);['menu','select','game','online-screen','tower'].forEach(s=>$(s).classList.toggle('hidden',s!==id));mode=id;syncPortraitMode()}
function goMenu(){if(typeof ONLINE!=='undefined'&&ONLINE.ws){onlineLeave();return;}cancelSpeech();audio.stopMusic();practice=false;$('game').classList.remove('practice');show('menu')}
function showSelect(forPractice=false){cancelSpeech();audio.stopMusic();sfx('select');selectPractice=forPractice;show('select');$('select-title').textContent=forPractice?'ELIGE PARA PRACTICAR':'ELIGE TU LUCHADOR';$('start').textContent=forPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE';renderRoster();document.querySelector('.roster-scroll').scrollTop=0}
function renderRoster(){$('roster').innerHTML=fighters.map((f,i)=>`<button type="button" class="fighter ${i===selected?'selected':''}" onclick="choose(${i})" aria-pressed="${i===selected}">${portraitMarkup(i)}<b>${f[0]}</b><small>${f[1]}</small></button>`).join('');const f=fighters[selected];const flavor=['Abre la bolsa y convierte lo que encuentra en una lluvia de objetos.','Se quita la pierna y la lanza. El paripé no conoce límites.','Enlaza acrobacias sobre el banco y remata con una patada aérea.','De la bolsa a tu cara: flan con una generosa dosis de orujo.','Agita, apunta y lanza su botella de líquido dorado.','Una picada contundente. El sobreprecio viene incluido.','Barre el escenario con una escoba de alcance devastador.','Arma la pala y remata una pelota directa al rival.','Libros, apuntes y jeringas en una avalancha de conocimiento.','Carga el pincel y dispara un estallido de pintura.','Inhala y desata una onda de sonido supersónica.','Abre el maletín y lanza mascarilla y tubo de oxígeno.'][selected];$('detail').innerHTML=`<div class="dossier-copy"><span class="dossier-kicker">EXPEDIENTE / ${String(selected+1).padStart(2,'0')}</span><h2>${f[0]}</h2><p class="dossier-style">${f[1]}</p><div class="dossier-stats">${['FUERZA','VELOCIDAD','ALCANCE','ESPECIAL'].map((label,i)=>`<div class="stat-row"><span>${label}</span><span class="stat-track"><i class="stat-value" style="width:${f[i+3]*10}%"></i></span><b>${f[i+3]}</b></div>`).join('')}</div><div class="dossier-special"><small>ATAQUE ESPECIAL</small><strong>${specialNames[selected]}</strong><p>${flavor}</p><span class="combat-benefit" style="display:block;font-size:12px;font-weight:700">Daño base aprox. ${Math.round(SPECIAL_ADVANTAGES[selected].rawDamage*DAMAGE_SCALE)} · ${SPECIAL_ADVANTAGES[selected].label}</span></div><div class="combo-routes"><small>COMBOS · TOCÁ EN ORDEN, SIN MANTENER</small>${COMBO_ROUTES[selected].map(r=>`<p><b>${r[0]}</b> ${comboLabel(r[1])}<span style="display:block;font-size:11px;opacity:.85">${FINISHER_PROFILES[selected][COMBO_ROUTES[selected].indexOf(r)].description}</span><span class="combat-benefit" style="display:block;font-size:11px;font-weight:700">${FINISHER_ADVANTAGES[selected][COMBO_ROUTES[selected].indexOf(r)].label}</span></p>`).join('')}</div>${combatInstructions()}</div>`}

function choose(i){sfx('select');selected=i;renderRoster()}
async function startCampaign(){unlockAudio();if(starting)return;starting=true;const token=battleToken;$('start').disabled=true;$('start').textContent='CARGANDO LUCHADORES…';try{await assetReady;if(mode!=='select'||token!==battleToken)return;queue=fighters.map((_,i)=>i).filter(i=>i!==selected);for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}battle=0;score=0;bestCombo=0;sfx('confirm');audio.startMusic();practice=selectPractice;$('game').classList.toggle('practice',practice);if(practice){show('game');newPractice()}else showTower()}catch{$('detail').textContent='No se pudieron cargar las imágenes. Recargá para reintentar.'}finally{starting=false;$('start').disabled=false;$('start').textContent=selectPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE'}}
// Timing is shared by hit detection, animation and CPU decisions (60 Hz frames).
function moveData(a,type){if(a.finisher&&a.attack>0)return finisherData(a);const power=a.power;const d=baseMoveData(a,type);return power?{...d,total:d.total+12,start:d.start+4,end:d.end+4,stun:36,push:90}:d}
function baseMoveData(a,type){const speed=fighters[a.id][4],heavy=fighters[a.id][3]>=9;return type==='kick'?{total:34+(heavy?3:0),start:12,end:17,stun:25,push:27}:{total:24-Math.floor((speed-5)/2),start:7,end:10,stun:19,push:15}}
function canChain(a,type,low=a.crouching){return a.attack>0&&a.attackType!=='special'&&a.attackType!=='grab'&&!a.chainUsed&&a.attackLength-a.attack>moveData(a,a.attackType).start&&routeCanContinue(a,type,low);}
const ESCAPE_COOLDOWN=300;
function tryEscape(){return escapeUnit(player,enemy)}
function escapeUnit(a,opponent){
 if(!a||mode!=='game'||ending||introFrames>0||a.hp<=0||a.escapeCool>0||a.escaping>0||a.y>25)return false;
 const away=opponent?(a.x<opponent.x?-1:1):a.x<480?1:-1;
 let destination=clamp(a.x+away*200,80,880);
 if(Math.abs(destination-a.x)<110){const inward=a.x<480?1:-1;destination=clamp(opponent?opponent.x+inward*145:a.x+inward*220,80,880);}
 a.escapeStart=a.x;a.escapeEnd=destination;a.escaping=30;a.escapeCool=practice?0:ESCAPE_COOLDOWN;
 clearAfflictions(a);a.moveTrail='';a.moveAge=0;a.routePerformed='';a.stun=0;a.blockstun=0;a.attack=0;a.power=false;a.blocking=false;a.guardMix=0;a.dash=0;a.knockback=0;a.invuln=Math.max(a.invuln,36);a.vy=11.5;
 if(a===player){keys.jump=false;clearActionBuffer();cancelCharges();}
 if(opponent){opponent.aiAction='';opponent.aiMove=0;opponent.aiRest=Math.max(opponent.aiRest,24);}
 hitstop=0;sfx('dash');haptic(14);effects.push({x:a.x,y:160-a.y,t:45,text:'¡ESCAPE!',color:'#9ef7ff'});return true;
}
function cpuThink(dt){if(typeof ONLINE!=='undefined'&&ONLINE.active){onlineRemoteStep(dt);return;}
 const a=enemy,b=player;posture(a,a?.aiDown);if(!a||a.stun>0||a.blockstun>0)return;if(a.aiRest>0){a.aiAction='';if(!a.attack){a.x-=movementDirection(a,a.dir)*1.4*movementMultiplier(a)*dt;a.moving=true;}return;}
 const distance=Math.abs(a.x-b.x),level=Math.min(1,battle/10),ranged=![2,6].includes(a.id);
 a.brainTimer-=dt;
 if(a.brainTimer<=0){
  a.brainTimer=24-level*6+Math.random()*16;
  const incoming=projectiles.some(p=>p.owner===b&&p.life>0&&(a.x-p.x)*p.dir>0&&Math.abs(p.x-a.x)<290&&Math.abs(p.y-(300-a.y))<150);
  const attacking=b.attack>0&&distance<220,whiff=b.attack>0&&b.attackType!=='special'&&!b.connected&&b.attack< b.attackLength*.45;
  a.aiDown=attacking&&attackLevel(b)==='low'||Math.random()<.2;
  a.aiGuard=(incoming||attacking&&!whiff)&&Math.random()<.52+level*.25;
  a.aiMove=0;a.aiAction='';
  if(incoming&&!a.aiGuard&&a.y===0&&Math.random()<.5)a.vy=13;
  if(!a.aiGuard){
   const desired=ranged&&a.cool<=0?280:130;
   if(distance<83&&b.blocking&&a.grabCool<=0&&Math.random()<.2)a.aiAction='grab';else if(whiff&&distance<205){a.aiAction=distance<145?'punch':'kick';a.aiMove=a.dir}
   else if(b.y>65&&distance<180)a.aiAction='kick';
   else if(distance<145&&Math.random()<.68)a.aiAction=Math.random()<.7?'punch':'kick';
   else if(distance<195&&Math.random()<.45)a.aiAction='kick';
   else if(a.cool<=0&&distance>(ranged?220:110)&&distance<(ranged?620:260)&&Math.random()<.35+level*.2)a.aiAction='special';
   else if(distance>desired+35)a.aiMove=a.dir;
   else if(distance<desired-30)a.aiMove=-a.dir;
   if(distance>390&&level>.2&&Math.random()<.15)dashUnit(a,a.dir);
  }
 }
 if(a.attack>0){if(battle>=3&&a.chainDepth<1&&a.connected&&Math.random()<.012+level*.012)strike(a,b,(COMBO_ROUTES[a.id].find(r=>r[1].startsWith(a.hitTrail))?.[1][a.hitTrail.length]==='P'?'punch':'kick'));return}
 a.blocking=!!a.aiGuard&&a.y===0;
 if(!a.blocking){if(a.aiAction){const action=a.aiAction;a.aiAction='';strike(a,b,action)}if(!a.attack){a.x+=movementDirection(a,a.aiMove)*(a.crouching?.25:1)*(2+fighters[a.id][4]*.25)*movementMultiplier(a)*dt;a.moving=!!a.aiMove}}
}
function entity(id,x,dir){return{reverse:0,diveMask:0,moveTrail:'',moveAge:0,routePerformed:'',receivedHits:0,slow:0,slowSpeed:1,daze:0,knockdown:0,controlResist:0,crouching:false,level:"mid",hitTrail:"",hitAge:0,finisher:false,routeCompleted:"",grabCool:0,throwImmune:0,escaping:0,escapeCool:0,escapeStart:0,escapeEnd:0,aiRest:0,power:false,knockback:0,brainTimer:18,aiMove:0,aiAction:"",blockstun:0,chainDepth:0,chainUsed:false,id,x,y:0,vy:0,dir,hp:MAX_HP,meter:0,dash:0,dashCool:0,dashDir:1,ex:false,cool:0,attack:0,attackLength:0,attackType:'',hit:false,connected:false,shots:0,cast:0,stun:0,invuln:0,walk:0,moving:false,blocking:false,guardMix:0,guardHit:0,guardClock:0,pose:0,posePrevious:0,poseFade:1,landSquash:0,hitRecoil:0,legGone:false,castHits:new Set()}}
function newPractice(){cancelCharges();practice=true;$('game').classList.add('practice');resetArcade(true);battleToken++;ending=false;keys={};player=entity(selected,480,1);enemy=null;projectiles=[];effects=[];hitstop=0;shake=0;announcement="¡PRACTICÁ A TU RITMO!";announceTime=110;$("overlay").classList.add("hidden");$("bg").src="assets/bg"+practiceStage+".jpg";$("pn").textContent=fighters[selected][0];$("player-identity").innerHTML=portraitMarkup(selected);$("round").textContent="PRÁCTICA";$("arena-label").textContent="Sin rival · Especial libre";updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function changeStage(){practiceStage=(practiceStage+1)%3;$("bg").src="assets/bg"+practiceStage+".jpg"}
function newBattle(){cancelCharges();resetArcade(false);practice=false;$("game").classList.remove("practice");$("arena-label").textContent="Campeonato";battleToken++;ending=false;keys={};player=entity(selected,240,1);enemy=entity(queue[battle],720,-1);projectiles=[];effects=[];hitstop=0;shake=0;aiClock=0;announcement='¡A PELEAR!';announceTime=80;$('overlay').classList.add('hidden');$('bg').src='assets/bg'+battle%3+'.jpg';$('pn').textContent=fighters[selected][0];$('player-identity').innerHTML=portraitMarkup(selected);$('en').textContent=fighters[enemy.id][0];$('enemy-identity').innerHTML=portraitMarkup(enemy.id);$('round').textContent=`BATALLA ${battle+1} / 11`;updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function hit(target,damage,push,kind=-3,impactY=target?280-target.y:280,info=null){
if(!target||practice||target.invuln>0||ending||target.hp<=0)return false;
const attacker=info?.attacker||(target===enemy?player:enemy),advantage=info?.advantage,power=kind===-3&&!info?.special&&attacker?.power,facing=target.dir===-Math.sign(push),guardBreak=(power||advantage?.breakGuard)&&target.blocking&&facing,blocked=kind!==-4&&!guardBreak&&guardCovers(target,info?.level||(kind===-3?attackLevel(attacker):'mid'))&&facing,wasCounter=target.attack>0&&!target.hit&&!blocked;
if(advantage){damage*=advantage.damage??1;push=Math.sign(push)*(advantage.push??(info.special?40:36));}
target.lastBlocked=blocked;if(!blocked){target.crouching=false;target.hitTrail="";target.hitAge=0;target.moveTrail='';target.moveAge=0;}if(target===player)cancelCharges();if(guardBreak){target.blocking=false;target.blockstun=0;target.guardMix=0;target.aiGuard=false;effects.push({x:target.x,y:170-target.y,t:48,text:'¡GUARDIA ROTA!',color:'#ffe435'});sfx('ready');}if(power){damage*=guardBreak?1.5:1.85;target.knockback=Math.sign(push)*(guardBreak?3:6);hitstop=Math.max(hitstop,11);shake=Math.max(shake,9)}
if(!blocked&&attacker){target.receivedHits=target.stun>0?(target.receivedHits||0)+1:1;damage*=Math.max(.65,1-(target.receivedHits-1)*.055);if(attacker===player){comboCount=target.receivedHits;comboTimer=108;bestCombo=Math.max(bestCombo,comboCount);if(comboCount>1)sfx('combo',{count:comboCount});score+=Math.round(damage*10)*(comboCount>1?2:1)}}
damage*=DAMAGE_SCALE*(wasCounter?1.12:1);target.meter=clamp(target.meter+(blocked?8:6),0,100);if(attacker)attacker.meter=clamp(attacker.meter+(blocked?5:12),0,100);
if(blocked){if(kind===-3){damage=advantage?.chip?damage*advantage.chip:0;if(attacker){attacker.x=clamp(attacker.x+target.dir*24,80,880);attacker.knockback=target.dir*2;}}else damage*=(advantage?.chip??.12);push*=.15;target.invuln=8;target.blockstun=Math.max(12,advantage?.guardStun||0);target.guardHit=14;sfx('guard',{pan:target.x/480-1});hitstop=Math.max(hitstop,3);shake=Math.max(shake,2);effects.push({x:target.x+target.dir*42,y:255-target.y,t:28,text:'BLOCK',color:'#9efaff'})}
else{target.stun=Math.max(target.stun,info?.finisher?32:kind===-3?moveData(attacker,attacker.attackType).stun:23,guardBreak?36:0);target.invuln=kind===-3?8:22;target.hitRecoil=1;target.attack=0;target.hit=true;sfx('hit',{pan:target.x/480-1,intensity:kind===-3?1:1.4});hitstop=Math.max(hitstop,kind===-3?6:9);shake=Math.max(shake,kind===-3?5:8);if(target===player)haptic(22);if(wasCounter)effects.push({x:target.x,y:160-target.y,t:42,text:target.attackType==='special'?'¡ESPECIAL INTERRUMPIDO!':'COUNTER!',color:'#ff5d9f'})}
if(blocked)damage=Math.min(damage,Math.max(0,target.hp-1));if(target.diveMask>0)damage*=1-DIVE_MASK_REDUCTION;target.hp=clamp(target.hp-damage,0,MAX_HP);const beforeX=target.x;target.x=clamp(target.x+push,80,880);if(attacker&&(kind===-3||kind===-4)){const unused=push-(target.x-beforeX);attacker.x=clamp(attacker.x-unused,80,880);}effects.push({x:target.x,y:impactY,t:26,kind,burst:true,blocked});applyAdvantage(target,attacker,advantage);if(target.hp<=0)finish(target===enemy);return true}

function strike(a,b,type,power=false,low=a.crouching){if(type==='grab')return beginGrab(a,b);const cancel=canChain(a,type,low),linked=a.attack<=0&&routeCanContinue(a,type,low),chained=cancel||linked;if((a.attack>0&&!cancel)||a.stun>0||a.blockstun>0||a.blocking||a.escaping>0||ending||a.hp<=0)return false;if(chained){a.chainUsed=true;a.chainDepth++}else a.chainDepth=0;if(type==='kick'&&a.legGone)return false;if(type==='special'&&(a.cool>0||a.legGone))return false;a.crouching=!!low&&a.y===0&&a.vy<=0&&type!=='special';a.moveToken=comboMoveToken(a,type,low);a.finisher=chained&&COMBO_ROUTES[a.id].some(r=>r[1]===routePrefix(a,a.moveToken));a.finisherVariant=a.finisher?COMBO_ROUTES[a.id].findIndex(r=>r[1]===routePrefix(a,a.moveToken)):-1;a.finisherAdvance=0;a.finisherSound=false;a.finisherImpactX=b?b.x:a.x+a.dir*155;a.level=type==='kick'?((a.y>0||a.vy>0)?'overhead':a.crouching?'low':'mid'):type==='punch'?(a.crouching?'mid':'high'):'mid';if(a.finisher){a.crouching=false;a.level=finisherData(a).level;}a.power=power&&!a.finisher&&type!=='special';a.attackType=type;a.attackLength=a.finisher?finisherData(a).total:type==='special'?specialPlans[a.id].length:moveData(a,type).total;a.attack=a.attackLength;a.hit=false;a.connected=false;a.chainUsed=false;a.shots=0;commitComboMove(a,type,chained);sfx(type==='special'||a.finisher?'special':type,{id:a.id,pan:a.x/480-1});if(type==='special'){if(a.id===2)a.benchX=clamp(a.x+a.dir*110,130,830);audio.playVoice(a.id);if(typeof ONLINE!=='undefined'&&ONLINE.active&&ONLINE.role===0)ONLINE.events.push({voice:a.id});a.ex=practice||a.meter>=100;if(a.ex){a.meter=0;exFlash=22;hitstop=Math.max(hitstop,7);announcement=specialNames[a.id];sfx('ready')}a.cool=practice?a.attackLength:390;a.cast=++castSerial;announcement=a.ex?specialNames[a.id]:fighters[a.id][8];announceTime=85}return true}
function phaseFor(a){return clamp(Math.floor((1-a.attack/a.attackLength)*6),0,5)}
function spawn(a,item,index){sfx('release',{id:a.id,pan:a.x/480-1});const wave=item===-2;const handY=[213,205,220,211,228,217,225,175,214,205,198,215][a.id];projectiles.push({x:a.x+a.dir*(wave?55:a.id===7?120:130),y:handY-a.y+(a.id===0?(index%3-1)*12:0),dir:a.dir,owner:a,life:105,speed:a.id===1?10:wave?9:8.2+fighters[a.id][5]*.25,damage:specialDamage(a),advantage:{...SPECIAL_ADVANTAGES[a.id]},level:SPECIAL_ADVANTAGES[a.id].level||'mid',kind:item,cast:a.cast,age:0,spin:item===6?.025:item===7?.035:.085});if(a.id===1)a.legGone=true}
function resolveAttack(a,b,dt){if(!a||!a.attack||a.stun>0)return;const elapsed=a.attackLength-a.attack;if(a.attackType==='grab'){resolveGrab(a,b);return;}if(a.attackType==='special'){const plan=specialPlans[a.id];while(a.shots<plan.times.length&&elapsed>=plan.times[a.shots]){spawn(a,plan.items[a.shots],a.shots);a.shots++}if(b&&(a.id===2||a.id===6)&&!a.hit&&elapsed>=(a.id===2?58:38)){if(b&&collides(specialHitbox(a),hurtbox(b))){a.hit=hit(b,specialDamage(a),a.dir*50,-5,280-b.y,{attacker:a,advantage:SPECIAL_ADVANTAGES[a.id],level:SPECIAL_ADVANTAGES[a.id].level||'mid',special:true});}}return}if(a.finisher&&resolveThemedFinisher(a,b,elapsed))return;const data=moveData(a,a.attackType);if(a.hit||elapsed<data.start||elapsed>data.end)return;if(practice&&!b){a.hit=true;a.connected=true;recordCombo(a,{x:a.x+a.dir*115,y:a.y,vy:0});return;}if(b&&b.invuln<=0&&collides(facingHitbox(a,a.attackType),hurtbox(b))){a.hit=true;a.connected=hit(b,((a.attackType==='kick'?8:6)+fighters[a.id][3]*.8),a.dir*data.push,-3,280-b.y,a.finisher?{attacker:a,advantage:finisherAdvantage(a),level:a.level,special:false}:null)&&!b.lastBlocked;if(a.connected)recordCombo(a,b);else{a.hitTrail='';a.hitAge=0;}}}
function update(dt){frame+=dt;if(keys.defend&&keys.jump)tryEscape();if(comboTimer>0)comboTimer=Math.max(0,comboTimer-dt);else comboCount=0;exFlash=Math.max(0,exFlash-dt);if(!practice){matchFrames=Math.max(0,matchFrames-dt);if(!matchFrames){finish(player.hp>=enemy.hp);return}}for(const a of [player,enemy].filter(Boolean)){tickAfflictions(a,dt);a.diveMask=Math.max(0,a.diveMask-dt);a.moveAge=Math.max(0,a.moveAge-dt);a.grabCool=Math.max(0,a.grabCool-dt);a.throwImmune=Math.max(0,a.throwImmune-dt);a.hitAge=Math.max(0,a.hitAge-dt);a.comboFlash=Math.max(0,(a.comboFlash||0)-dt);a.escapeCool=Math.max(0,a.escapeCool-dt);a.aiRest=Math.max(0,a.aiRest-dt);if(a.escaping>0){a.escaping=Math.max(0,a.escaping-dt);const t=1-a.escaping/30;a.x=a.escapeStart+(a.escapeEnd-a.escapeStart)*(1-Math.cos(t*Math.PI))*.5;}
const previousAttack=a.attack;a.x+=a.knockback*dt;a.knockback*=Math.pow(.86,dt);a.dashCool=Math.max(0,a.dashCool-dt);if(a.dash>0){a.x+=a.dashDir*12*dt;a.dash=Math.max(0,a.dash-dt)}a.cool=Math.max(0,a.cool-dt);a.attack=Math.max(0,a.attack-dt);finisherStep(a);if(a===enemy&&previousAttack>0&&!a.attack){a.aiRest=24-Math.min(10,battle)+Math.random()*12;a.aiAction="";}a.stun=Math.max(0,a.stun-dt);a.blockstun=Math.max(0,a.blockstun-dt);a.invuln=Math.max(0,a.invuln-dt);const oldY=a.y;a.vy-=.75*dt;a.y+=a.vy*dt;if(a.y<0){a.y=0;a.vy=0;if(oldY>8){a.landSquash=1;shake=Math.max(shake,1.5);sfx('step')}}a.landSquash=Math.max(0,a.landSquash-.065*dt);a.hitRecoil=Math.max(0,a.hitRecoil-.075*dt);if(!a.attack&&enemy)a.dir=a===player?(enemy.x>player.x?1:-1):(player.x>enemy.x?1:-1);a.moving=false;a.blocking=a.blockstun>0;if(a.id===2&&a.attackType==='special'&&a.attack>0&&a.stun<=0){const elapsed=a.attackLength-a.attack;if(elapsed>13&&elapsed<66)a.x+=a.dir*5.5*dt}if(a.legGone&&!projectiles.some(p=>p.owner===a&&p.kind===6&&p.life>0))a.legGone=false}
posture(player,keys.down);updateCharge(dt);if(inputQueue[0]?.type==='grab')consumeInput(player,enemy,inputQueue);player.blocking=(!!keys.defend||player.blockstun>0)&&player.stun<=0&&!player.attack&&player.y===0&&player.escaping<=0;
if(player.blocking){keys.punch=false;keys.kick=false;keys.special=false;keys.jump=false}else if(player.escaping<=0&&player.stun<=0&&player.blockstun<=0){const move=movementDirection(player,Number(!!keys.right)-Number(!!keys.left));if(!player.attack)player.x+=move*(player.crouching?.25:activeCharge()?.35:1)*(player.legGone?1.8:2.3+fighters[player.id][4]*.35)*movementMultiplier(player)*dt;player.moving=!!move;if(practice&&move&&!player.attack)player.dir=move;if(keys.jump&&player.y===0&&!player.attack){player.vy=13;keys.jump=false;sfx('jump')}consumeInput(player,enemy,inputQueue);}
cpuThink(dt);
for(const a of [player,enemy].filter(Boolean)){a.x=clamp(a.x,80,880);if(a.moving)a.walk+=dt;const goal=a.blocking?1:0;a.guardMix+=(goal-a.guardMix)*Math.min(1,dt*.24);a.guardHit=Math.max(0,a.guardHit-dt);if(a.blocking)a.guardClock+=dt;
 const desiredPose=poseFor(a);
 if(desiredPose!==a.pose){a.posePrevious=a.pose;a.pose=desiredPose;a.poseFade=0}
 a.poseFade=Math.min(1,a.poseFade+dt*.28)
 }ageInputBuffer(dt);shake=Math.max(0,shake-dt);if(enemy&&player.escaping<=0&&Math.abs(player.x-enemy.x)<65&&Math.abs(player.y-enemy.y)<110){const sign=player.x<=enemy.x?1:-1,overlap=65-Math.abs(player.x-enemy.x);player.x=clamp(player.x-sign*overlap/2,80,880);enemy.x=clamp(enemy.x+sign*overlap/2,80,880)}resolveAttack(player,enemy,dt);resolveAttack(enemy,player,dt);
for(const p of projectiles){p.x+=p.dir*p.speed*dt;p.life-=dt;p.age+=dt;const target=p.owner===player?enemy:player;if(!target)continue;const targetY=(p.kind===-2?210:255)-target.y;if(collides(projectileHitbox(p),hurtbox(target))){if(!target.castHits.has(p.cast)&&hit(target,p.damage,p.dir*40,p.kind,p.y,{attacker:p.owner,advantage:p.advantage,level:p.level||'mid',special:!p.finisherProjectile,finisher:!!p.finisherProjectile})){target.castHits.add(p.cast);if(p.finisherProjectile&&!target.lastBlocked)confirmFinisherProjectile(p,target);}p.life=0}}
projectiles=projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<1060);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);announceTime-=dt;captureTrails(dt);updateHud()}
function updateHud(){const specialButton=document.querySelector('[data-key=special]');if(specialButton){const label=specialButton.querySelector('small');if(label)label.textContent=player.cool>0?'RECARGA '+Math.ceil(player.cool/60)+'s':'ESPECIAL';specialButton.style.opacity=player.cool>0?'.55':'1';specialButton.setAttribute('aria-label',player.cool>0?'Especial recargando: '+Math.ceil(player.cool/60)+' segundos':'Ataque especial listo');}const escape=$('escape-hint');if(escape)escape.textContent=player.escapeCool>0?'Escape: '+Math.ceil(player.escapeCool/60)+' s':'Escape: 🛡 + ↑ · Agarre: F / 🛡 + piña';if($('timer'))$('timer').textContent=practice?'∞':Math.ceil(matchFrames/60);if($('p-meter'))$('p-meter').style.width=(practice?100:player.meter)+'%';if($('e-meter'))$('e-meter').style.width=(enemy?enemy.meter:0)+'%';if($('combo-counter'))$('combo-counter').textContent=practice?(player.moveAge>0?'SECUENCIA '+player.moveTrail.length+' / 3':''):comboCount>1?comboCount+' HIT COMBO':'';$('ph').style.width=player.hp/MAX_HP*100+'%';$('eh').style.width=enemy?enemy.hp/MAX_HP*100+'%':'0%';$('cool').textContent=activeCharge()?(activeCharge().frames>=CHARGE_FRAMES?'¡Soltá para golpe fuerte!':'Cargando golpe…'):player.cool>0?'Recarga: '+Math.ceil(player.cool/60)+' s':(practice?practiceComboHint(player):'Especial listo');document.querySelector('[data-key=defend]').setAttribute('aria-pressed',String(player.blocking))}
function poseFor(a){if(a.attack>0){const t=1-a.attack/a.attackLength;return t<.22?1:t<.78?4:0}if(a.y>2)return 3;if(a.blocking)return 0;if(a.moving)return [1,0,2,0][Math.floor(a.walk/7)%4];return 0}
function drawSprite(im,row,col,x,y,size=330){SpriteAtlas.draw(ctx,im,row,col,x,y,size);attachDiveMaskToSprite(im,row,col,x,y,size)}

function drawBench(a){if(a.id!==2||a.attackType!=='special'||a.attack<=0)return;const t=1-a.attack/a.attackLength;if(t>.7)return;ctx.save();ctx.globalAlpha*=Math.min(1,(1-t/.7)*3);const x=a.benchX??clamp(a.x+a.dir*110,130,830);ctx.fillStyle='#cf9a31';ctx.strokeStyle='#513324';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-100,443,200,16,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#e4b63f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-70,459);ctx.lineTo(x-82,480);ctx.moveTo(x+70,459);ctx.lineTo(x+82,480);ctx.stroke();ctx.restore()}
function drawFighter(a,ghost=false){renderedFighter=a;renderedMaskScale=Math.hypot(ctx.getTransform().a,ctx.getTransform().b);const size=330,ground=463;if(!ghost)drawBench(a);ctx.save();ctx.fillStyle='#16072266';ctx.beginPath();ctx.ellipse(a.x,ground+1,Math.max(20,48-a.y*.12),10,0,0,Math.PI*2);ctx.fill();ctx.translate(a.x,ground-a.y+(a.moving?Math.sin(a.walk*.45)*2:Math.sin(frame*.055+a.id)*1.5));ctx.scale(a.dir,1);
if(a.id===2&&a.attackType==='special'&&a.attack>0&&phaseFor(a)===2)ctx.translate(0,-14);
if(ending&&a.hp<=0){ctx.rotate(-.9);ctx.globalAlpha*=.82}
if(a.moving&&a.y===0){ctx.rotate(Math.sin(a.walk*.32)*.016);ctx.translate(Math.sin(a.walk*.75)*2,0)}
if(a.y>0){ctx.rotate(-.022*Math.sign(a.vy||1));ctx.scale(1-.025*Math.min(1,a.y/100),1+.025*Math.min(1,a.y/100))}
if(a.attack>0&&a.attackType!=='special'&&!a.finisher){const t=1-a.attack/a.attackLength;const data=moveData(a,a.attackType),e=a.attackLength-a.attack,extension=e<data.start?-Math.sin(e/data.start*Math.PI)*4:e<=data.end?12:12*Math.max(0,1-(e-data.end)/9);ctx.translate(extension,0);ctx.rotate(-extension*.003)}
if(a.landSquash>0&&!a.crouching&&!a.knockdown)ctx.scale(1+a.landSquash*.075,1-a.landSquash*.075);
if(a.hitRecoil>0&&!a.knockdown)ctx.rotate(.10*a.hitRecoil);
if(a.stun>0&&!a.knockdown)ctx.rotate(-.09);if(a.guardMix>.02){
  // Guardia física: aprovechar los brazos reales del sprite, nunca dibujar extremidades sueltas.
  // La cadera queda anclada y el torso se repliega, inclina y baja progresivamente.
  const guard=a.guardMix, impact=Math.min(1,a.guardHit/14);
  const breathing=Math.sin(frame*.15+a.id)*1.3*guard;
  ctx.translate(-6*guard-8*impact,1.5*guard+breathing+3*impact);
  if(!a.crouching)ctx.transform(1,0,.13*guard,1-.095*guard,0,0);
  ctx.rotate(-.018*guard-.022*impact);
}if(a.invuln>0&&Math.floor(frame/3)%2)ctx.globalAlpha*=.6;
if(a.phoneVictory){drawPhoneVictory(a,size)}else if((a.attack>0&&a.attackType==='special')||a.legGone){const [sheet,row]=specialMap[a.id];let phase=a.attack>0&&a.attackType==='special'?phaseFor(a):4;if(a.id===1&&a.legGone&&phase===5)phase=4;drawSprite(specials[sheet],row,phase,0,0,size)}else{drawNormalAction(a,size)}ctx.restore();renderedFighter=null;
if(a.guardMix>.08&&a.guardHit<=0&&a.blocking&&a.guardMix<.92){
 ctx.save();
 ctx.translate(a.x+a.dir*56,253-a.y);
 ctx.scale(a.dir,1);
 const opacity=Math.sin(Math.PI*Math.min(1,a.guardMix))*0.48;
 ctx.globalAlpha=opacity;
 ctx.strokeStyle='#ffe6a2';ctx.lineWidth=3;ctx.lineCap='round';
 for(let i=0;i<3;i++){
   ctx.beginPath();ctx.moveTo(-22+i*9,-19-i*9);ctx.lineTo(-2+i*9,-36-i*9);ctx.stroke();
 }
 ctx.restore();
}
 if(a.id===6&&a.attackType==='special'&&a.attack>0){const t=1-a.attack/a.attackLength;if(t>.28&&t<.8){ctx.save();ctx.translate(a.x,320-a.y);ctx.scale(a.dir,1);ctx.strokeStyle='#ffe999aa';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(110,15,150,55,-.25,-1.3,.9);ctx.stroke();ctx.restore()}}

if(!ghost&&a===player&&activeCharge()){const h=activeCharge(),ratio=Math.min(1,h.frames/CHARGE_FRAMES);ctx.save();ctx.fillStyle='#190925';ctx.fillRect(a.x-43,100-a.y,86,7);ctx.fillStyle=ratio>=1?'#ffe43a':'#dc7cff';ctx.fillRect(a.x-43,100-a.y,86*ratio,7);ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.strokeStyle='#21072c';ctx.lineWidth=4;const label=ratio>=1?'¡SOLTÁ!':'CARGANDO';ctx.strokeText(label,a.x,92-a.y);ctx.fillText(label,a.x,92-a.y);ctx.restore();}
if(!ghost){ctx.save();ctx.textAlign='center';ctx.font='bold 19px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#21072c';ctx.fillStyle='white';ctx.strokeText(fighters[a.id][0],a.x,ground-size-9-a.y);ctx.fillText(fighters[a.id][0],a.x,ground-size-9-a.y);ctx.restore()}}
function drawProp(item,x,y,size,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const col=item%4,row=Math.floor(item/4);ctx.drawImage(props,col*props.width/4,row*props.height/4,props.width/4,props.height/4,-size/2,-size/2,size,size);ctx.restore()}
function drawProjectile(p){ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.dir,1);ctx.lineCap='round';if(p.finisherProjectile){drawThemedProjectile(p);ctx.restore();return;}if(p.kind>=0){ctx.strokeStyle=p.kind===6?'#fff1c0aa':'#ffffff88';ctx.lineWidth=3;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(-65-n*8,n*11-12);ctx.lineTo(-30,n*7-8);ctx.stroke()}drawProp(p.kind,0,0,p.kind===6?110:p.kind===10?108:p.kind===9?93:p.kind===14?60:82,p.age*p.spin)}else if(p.kind===-1){for(let i=0;i<21;i++){ctx.fillStyle=['#ff32d7','#19ccff','#ffeb30'][i%3];ctx.beginPath();ctx.ellipse(-i*3,Math.sin(i*2.399+p.age*.12)*30,7+i%5,4+i%3,i,0,Math.PI*2);ctx.fill()}}else if(p.kind===-2){ctx.strokeStyle='#fa70ff';ctx.shadowColor='#f73bff';ctx.shadowBlur=9;ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.globalAlpha=1-i*.15;ctx.beginPath();ctx.ellipse(-i*17,0,20+i*3,36+i*10,0,-1.3,1.3);ctx.stroke()}}ctx.restore()}
function drawImpact(e){const age=26-e.t,life=clamp(e.t/26,0,1),paint=e.kind===-1||e.kind===-9;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=life;const colors=e.blocked?['#aafcff','#fff6c9','#58d2ff']:e.kind===-6?['#bd8c5c','#794729','#3e251c']:paint?['#ff36dc','#21dfff','#ffed35']:['#fff8c9','#ffe638','#ff8f33'];ctx.lineJoin='miter';ctx.rotate(Math.sin(e.x)*.3);ctx.beginPath();for(let i=0;i<24;i++){const angle=i*Math.PI/12,r=(i%2?12:42)+(age*(i%2?.15:1.1));const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fillStyle=colors[1];ctx.strokeStyle='#3c1643';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.fillStyle=colors[0];ctx.beginPath();for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=i%2?7:27;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill();for(let i=0;i<10;i++){const angle=i*2.399,inner=38+age*2,outer=inner+12+(i%3)*6;ctx.strokeStyle=colors[i%3];ctx.lineWidth=2+i%3;ctx.beginPath();ctx.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);ctx.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);ctx.stroke()}if(e.kind===9&&age>5)drawProp(9,age*2,-age,30,age*.06);ctx.restore()}

function draw(){ctx.clearRect(0,0,960,540);ctx.save();if(shake>0&&!reducedMotion)ctx.translate(Math.sin(frame*3.1)*shake*.65,Math.cos(frame*2.7)*shake*.35);const g=ctx.createLinearGradient(0,350,0,540);g.addColorStop(0,'#11052800');g.addColorStop(1,'#10052465');ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
for(const t of trails){ctx.save();ctx.globalAlpha=t.life/20*.18;drawFighter(t.a,true);ctx.restore()}
for(const a of [player,enemy].filter(Boolean)){drawFighter(a);drawAdvantageStatus(a);}projectiles.forEach(drawProjectile);for(const e of effects)if(e.burst)drawImpact(e);ctx.restore();
ctx.save();ctx.textAlign='center';for(const e of effects){if(e.burst)continue;ctx.fillStyle=e.color;ctx.strokeStyle='#250734';ctx.lineWidth=5;ctx.font='italic bold 25px Arial';ctx.strokeText(e.text,e.x,e.y-(30-e.t));ctx.fillText(e.text,e.x,e.y-(30-e.t))}
if(announceTime>0&&(!introFrames||practice)){ctx.font='italic 900 32px Arial';ctx.strokeStyle='#250636';ctx.lineWidth=8;ctx.strokeText(announcement,480,72);ctx.fillStyle='#ffe529';ctx.fillText(announcement,480,72)}
if(exFlash>0){ctx.fillStyle='#8e2cff22';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#ffe83d99';ctx.lineWidth=2;for(let i=0;i<14;i++){const y=i*39;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(150+(i%4)*80,y-12);ctx.moveTo(960,y);ctx.lineTo(760-(i%4)*75,y+12);ctx.stroke()}}
if(introFrames>0){const text=introFrames>40?'BATALLA '+(battle+1):'¡A PELEAR!';ctx.fillStyle='#140326aa';ctx.fillRect(0,195,960,120);ctx.font='italic 900 62px Arial';ctx.lineWidth=9;ctx.strokeStyle='#431057';ctx.strokeText(text,480,275);ctx.fillStyle='#ffe333';ctx.fillText(text,480,275)}
if(ending&&![player,enemy].some(a=>a?.phoneVictory)){ctx.font='italic 900 86px Arial';ctx.strokeStyle='#3b0754';ctx.lineWidth=12;ctx.strokeText(matchFrames<=0?'TIME!':'K.O.',480,270);ctx.fillStyle='#ffe431';ctx.fillText(matchFrames<=0?'TIME!':'K.O.',480,270)}ctx.restore()}

function cancelSpeech(){audio.stopVoice();try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch(_){}}
function say(text){if(!soundEnabled)return false;const id=fighters.findIndex(f=>f[8]===text);return audio.playVoice(id>=0?id:12)}

function startTrexVictory(a,done){
 const token=battleToken;introFrames=0;a.attack=0;a.stun=0;a.y=0;a.vy=0;a.moving=false;a.legGone=false;a.blocking=false;a.guardMix=0;a.invuln=0;a.hitRecoil=0;a.phoneVictory=true;a.phoneStarted=performance.now();a.phoneFrame=0;sfx('phone');
 setTimeout(()=>{if(token!==battleToken||mode!=='game')return;audio.playVoice(12);if(typeof ONLINE!=='undefined'&&ONLINE.active&&ONLINE.role===0)ONLINE.events.push({voice:12});},1500);
 setTimeout(()=>{if(token===battleToken&&mode==='game')done();},3950);
}
function drawPhoneVictory(a,size){
 if(!(typeof ONLINE!=='undefined'&&ONLINE.active&&ONLINE.role===1)){const t=performance.now()-a.phoneStarted;a.phoneFrame=t<450?0:t<850?1:t<1200?2:t<1500?3:t<3450?4+Math.floor((t-1500)/85)%2:3;}
 const w=phoneArt.width/6,h=phoneArt.height,width=size*w/h;ctx.drawImage(phoneArt,a.phoneFrame*w,0,w,h,-width/2,-size,width,size);if(a.diveMask>0)drawDiveMaskShape(18,-273,0);
}
function finish(win){if(typeof ONLINE!=='undefined'&&ONLINE.active){onlineFinish(win);return;}cancelCharges();
 if(practice||ending||mode!=='game')return;
 ending=true;keys={};hitstop=14;shake=8;updateHud();
 const token=battleToken,final=win&&battle===10,isTrexWin=(win?player:enemy).id===1;
 sfx(win?'win':'lose');
 const healthBonus=Math.round(player.hp/MAX_HP*1000);
 if(win)score+=1500+healthBonus;
 const revealResult=()=>{
  if(token!==battleToken||mode!=='game')return;
  const badge=win?(final?'¡CAMPEÓN DEL PARIPÉ!':'¡VICTORIA!'):'¡REVANCHA!';
  const result=win?fighters[selected][0]+' derrotó a '+fighters[enemy.id][0]:fighters[enemy.id][0]+' gana este combate';
  $('overlayContent').innerHTML=`<h2>${badge}</h2><p>${result}</p><p class="result-score">${score.toLocaleString('es')} PTS · MEJOR COMBO ${bestCombo}</p>`;
  $('overlayButtons').innerHTML=win&&!final?'<button class="btn primary" onclick="nextBattle()">SIGUIENTE RIVAL ▶</button>':win?'<button class="btn primary" onclick="showSelect()">JUGAR OTRA VEZ</button>':'<button class="btn primary" onclick="retry()">REINTENTAR</button>';
  $('overlayButtons').innerHTML+='<button class="btn" onclick="goMenu()">MENÚ</button>';
  $('overlay').classList.remove('hidden');
 };
 if(isTrexWin)startTrexVictory(win?player:enemy,revealResult);else setTimeout(revealResult,1050);
}

function nextBattle(){battle++;showTower()}function retry(){newBattle()}
function loop(t){if(mode!=='game')return;if(typeof ONLINE!=='undefined'&&onlineTick(t))return;if(syncPortraitMode()){last=t;draw();animationId=requestAnimationFrame(loop);return}const dt=last?Math.min((t-last)/16.67,2):1;last=t;if(!ending){if(introFrames>0){introFrames=Math.max(0,introFrames-dt);frame+=dt;if(introFrames===0){keys={};clearActionBuffer();announceTime=0;sfx('fight')}}else if(hitstop>0)hitstop=Math.max(0,hitstop-dt);else update(dt)}draw();animationId=requestAnimationFrame(loop)}
function clearKeys(){if(typeof ONLINE!=='undefined')ONLINE.jumpTap=null;cancelCharges();holdButtons.clear();keys={};clearActionBuffer();last=0;const defend=document.querySelector('[data-key=defend]');if(defend)defend.setAttribute('aria-pressed','false');document.querySelectorAll('.ctl.pressed').forEach(b=>b.classList.remove('pressed'));resetJoystick()}
function captureLowChord(){if(keys.down)for(const hold of chargeInputs.values())hold.low=true;}
function latchOnlineJump(){if(typeof ONLINE!=='undefined'&&ONLINE.active&&ONLINE.role===1)ONLINE.jumpTap={escape:!!keys.defend};}
const holdButtons=new Map();
for(const b of document.querySelectorAll('[data-key]')){
 const key=b.dataset.key;b.addEventListener('contextmenu',e=>e.preventDefault());
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(mode!=='game')return;unlockAudio();
  b.classList.add('pressed');
  if(['punch','kick'].includes(key)){beginCharge(key,'pointer-'+e.pointerId);haptic(8)}else if(key==='special'){bufferAction(key);haptic(8)}
  else{if(key==='left'||key==='right')tapDirection(key);holdButtons.set(e.pointerId,key);keys[key]=true;if(key==='jump')latchOnlineJump();}
  try{b.setPointerCapture(e.pointerId)}catch{}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{
  e.preventDefault();b.classList.remove('pressed');releaseCharge('pointer-'+e.pointerId,type!=='pointerup');
  if(holdButtons.get(e.pointerId)===key){holdButtons.delete(e.pointerId);keys[key]=false}
 });
}
const mapping={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'down',KeyF:'grab',KeyJ:'punch',KeyK:'kick',KeyL:'special',Space:'special',ShiftLeft:'defend',ShiftRight:'defend'};
window.addEventListener('keydown',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['punch','kick'].includes(key)){if(!e.repeat)beginCharge(key,'key-'+e.code)}else if(key==='special'||key==='grab'){if(!e.repeat)bufferAction(key)}else{if(!e.repeat&&(key==='left'||key==='right'))tapDirection(key);keys[key]=true;if(key==='down')captureLowChord();if(key==='jump'&&!e.repeat)latchOnlineJump();}});
window.addEventListener('keyup',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['punch','kick'].includes(key))releaseCharge('key-'+e.code);if(['left','right','jump','down','defend'].includes(key))keys[key]=false});
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});


const actionMap=[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[0,3],[2,1],[1,3],[2,2],[2,3]];
function resetArcade(training){introFrames=training?0:105;matchFrames=99*60;comboCount=0;comboTimer=0;trails=[];trailClock=0;exFlash=0;clearActionBuffer();if(!training)sfx('round');else sfx('ready');audio.startMusic()}
function drawNormalAction(a,size){
 if(a.knockdown>0&&a.y<12){drawKnockdown(a);return;}
 if(a.finisher&&a.attack>0&&a.stun<=0){drawFinisher(a,size);return;}
 if(a.attackType==='grab'&&a.attack>0){drawCombatCell(grabArt,grabCells,a.id,size);return;}
 if(a.crouching&&a.stun<=0){
  if(a.attack>0&&a.attackType!=='special'&&!a.finisher){
   const e=a.attackLength-a.attack,d=moveData(a,a.attackType);
   if(e>=d.start-2&&e<=d.end+5){ctx.save();ctx.translate(a.attackType==='kick'?50:38,0);drawCombatCell(a.attackType==='kick'?lowKickArt:lowPunchArt,a.attackType==='kick'?lowKickCells:lowPunchCells,a.id,a.attackType==='kick'?230:240);ctx.restore();return;}
  }
  drawCombatCell(crouchArt,crouchCells,a.id,240);return;
 }
 let [sheet,row]=atlasMap[a.id],im=atlases[sheet],col=poseFor(a);const [as,ar]=actionMap[a.id];let ac=-1;
 if(a.stun>0)ac=5;else if(a.blocking||a.guardMix>.5||a.blockstun>0)ac=0;else if(a===player&&activeCharge()&&!a.attack)ac=activeCharge().type==='kick'?4:1;
 else if(a.attack>0){const elapsed=a.attackLength-a.attack,data=moveData(a,a.attackType);if(a.attackType==='punch')ac=elapsed<data.start?1:elapsed<=data.end?2:elapsed<data.end+6?3:-1;else if(a.attackType==='kick'){if(elapsed<data.start||elapsed>data.end&&elapsed<data.end+9)ac=4;else if(elapsed<=data.end)col=4;else col=0}}
 if(ac>=0){im=actionAtlases[as];row=ar;col=ac}drawSprite(im,row,col,0,0,size);
}
function captureTrails(dt){trailClock+=dt;for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);if(reducedMotion)return;if(trailClock>=3){trailClock=0;for(const a of [player,enemy].filter(Boolean)){if(a.finisher&&a.attack>0||a.comboFlash>0||a.escaping>0||a.dash>0||a.ex&&a.attackType==='special'&&a.attack>0||a.id===2&&a.attackType==='special'&&a.attack>0){trails.push({a:{...a},life:18});if(trails.length>12)trails.shift()}}}if($('bg'))$('bg').style.objectPosition=(50+(player.x-480)*.008)+'% center'}
function dashUnit(a,dir){if(!a||a.escaping>0||a===player&&activeCharge()||a.dashCool>0||a.attack>0||a.blockstun>0||a.stun>0||a.y>0||a.legGone)return;a.dash=10;a.dashCool=38;a.dashDir=movementDirection(a,dir);sfx('dash',{pan:a.x/480-1});effects.push({x:a.x,y:453,t:18,burst:true,kind:-3})}
function tapDirection(key){const now=performance.now();if(now-lastTap[key]<260){dashUnit(player,key==='left'?-1:1);lastTap[key]=-10000}else lastTap[key]=now}

refreshAudioButton();


/* Bloqueo de partida en vertical: solo en dispositivos táctiles compactos. */
const portraitMedia=matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 900px)');
let wasPortrait=false;
function syncPortraitMode(){
 const portrait=mode==='game'&&portraitMedia.matches;
 document.body.classList.toggle('mobile-portrait-playing',portrait);
 if(portrait&&!wasPortrait)clearKeys();
 if(!portrait&&wasPortrait)last=0;
 wasPortrait=portrait;
 return portrait;
}
window.addEventListener('orientationchange',syncPortraitMode);
window.addEventListener('resize',syncPortraitMode);
/* Joystick analógico para combate horizontal; el teclado conserva sus controles. */
let joystickPointer=null,joyLeft=false,joyRight=false;
function resetJoystick(){
 joyLeft=false;joyRight=false;joystickPointer=null;
 const knob=$('joystick-knob');if(knob)knob.style.transform='translate(0px,0px)';
}
function joystickMove(e){
 const stick=$('joystick');if(!stick||mode!=='game'||syncPortraitMode())return;
 const rect=stick.getBoundingClientRect();
 const radius=Math.min(rect.width,rect.height)*.32;
 let dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2);
 const distance=Math.hypot(dx,dy),factor=distance>radius?radius/distance:1;
 dx*=factor;dy*=factor;
 const knob=$('joystick-knob');if(knob)knob.style.transform=`translate(${dx}px,${dy}px)`;
 const left=dx<radius*-.32,right=dx>radius*.32;
 if(left&&!joyLeft)tapDirection('left');
 if(right&&!joyRight)tapDirection('right');
 joyLeft=left;joyRight=right;keys.left=left;keys.right=right;
 const previousJump=!!keys.jump;keys.jump=dy<-radius*.67;if(keys.jump&&!previousJump)latchOnlineJump();keys.down=dy>radius*.55;captureLowChord();
}
const joystick=$('joystick');
if(joystick){
 joystick.addEventListener('pointerdown',e=>{
  if(mode!=='game'||syncPortraitMode())return;
  e.preventDefault();joystickPointer=e.pointerId;joystickMove(e);
  try{joystick.setPointerCapture(e.pointerId)}catch(_){}
 });
 joystick.addEventListener('pointermove',e=>{if(joystickPointer===e.pointerId){e.preventDefault();joystickMove(e)}});
 const release=e=>{
  if(joystickPointer!==e.pointerId)return;
  e.preventDefault();keys.left=false;keys.right=false;keys.jump=false;keys.down=false;resetJoystick();
 };
 for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,release);
}
