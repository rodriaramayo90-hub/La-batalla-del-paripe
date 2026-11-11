
const fighters=[
['Alcahueta','Ciruja callejera','Ataque de Cirujeo',7,8,8,8,'#df395c','¡Alcahuetovich!'],
['T-Rex','Dinosaurio desarticulado','Pierna voladora',9,5,8,6,'#3e9b76','RAAAAAWR'],
['Coqui','Gimnasta acrobática','Flic Flac',7,8,5,9,'#e2a936','¡Burzaco papá!'],
['Lucas','Experto en sobras','Flan de Orujo',8,7,7,8,'#5d9fea','¡Flan de orujo!'],
['Dr. Tostador','Médico experimental','Golden Shower',8,7,7,8,'#ae70e0','¡Golden Shower!'],
['Dra. En Berga','Especialista en bolos fecales','Picada con Sobreprecio',7,8,7,8,'#ef6d89','¡Son 50 euros!'],
['La Drapie','Limpieza profunda','Limpieza Extrema',8,7,7,8,'#4fb7c7','¡Limpieza extrema!'],
['Flor Rubia','Padelera implacable','Paletazo',7,8,7,8,'#f7a84d','¡Para vos, Vero!'],
['Bites','Científico implacable','MIR',8,7,7,8,'#91b3ff','¡MIR!'],
['Malefica','Artista golpista','Ataque Artístico',6,9,8,9,'#a850e9','¡Ataque artístico!'],
['Lu','Gritos aturdidores','Grito Supersónico',6,9,8,9,'#df3e9d','¡Grito supersónico!'],
['Daf','Logística sanitaria','Respirador de Air Liquide',7,8,7,8,'#56b4b1','¡Respirador!']
];
'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function loadImage(src){const image=new Image();image.src=src;return image}
const atlases=['fighters-a.webp','fighters-b.webp','fighters-c.webp','costumes-v4.webp'].map(n=>loadImage('assets/'+n));
const specials=['a','b','c'].map(n=>loadImage('assets/specials-v4-'+n+'.webp'));
const props=loadImage('assets/props-v4.webp'),florPortrait=loadImage('assets/flor-portrait-v4.webp');
const actionAtlases=['a','b','c'].map(n=>loadImage('assets/actions-v7-'+n+'.webp'));const allImages=[...atlases,...specials,...actionAtlases,props,florPortrait];
let assetsLoaded=false;const assetReady=Promise.all(allImages.map(im=>im.decode())).then(()=>assetsLoaded=true);assetReady.catch(()=>{});
const atlasMap=[[3,0],[3,1],[1,1],[3,2],[0,3],[1,3],[2,0],[3,3],[2,1],[0,1],[2,2],[2,3]];
const specialMap=[[0,0],[0,1],[2,0],[0,2],[0,3],[1,0],[1,3],[2,2],[1,2],[2,1],[2,3],[1,1]];
const specialNames=['Cirujeo: bolsa y objetos','Pierna voladora','Flic Flac','Flan de Orujo','Golden Shower','Picada con sobreprecio','Limpieza extrema','Para vos, Vero','MIR','Ataque artístico','Grito supersónico','Respirador de Air Liquide'];
const specialPlans=[{length:90,times:[45,49,53,57,61,65],items:[0,1,2,3,4,5]},{length:82,times:[41],items:[6]},{length:88,times:[],items:[]},{length:76,times:[38],items:[7]},{length:76,times:[38],items:[8]},{length:80,times:[40],items:[9]},{length:76,times:[],items:[]},{length:72,times:[36],items:[14]},{length:88,times:[44,48,52,56],items:[11,12,13,11]},{length:76,times:[38,42,46],items:[-1,-1,-1]},{length:80,times:[40],items:[-2]},{length:80,times:[40],items:[10]}];
let selected=0,queue=[],battle=0,player,enemy,projectiles=[],effects=[],mode='menu',last=0,keys={},aiClock=0,frame=0,announcement='',announceTime=0,animationId=0,ending=false,battleToken=0,castSerial=0,starting=false;
let hitstop=0,shake=0;const queued={punch:0,kick:0,special:0};
const audio=new ArcadeAudio();let soundEnabled=!audio.muted;
function unlockAudio(){audio.unlock().then(()=>{if(mode==='game')audio.startMusic()}).catch(()=>{})}
function toggleAudio(){soundEnabled=!soundEnabled;audio.setMuted(!soundEnabled);const b=$('audio-toggle');if(b){b.textContent=soundEnabled?'SONIDO ON':'SONIDO OFF';b.setAttribute('aria-pressed',String(soundEnabled))}if(soundEnabled)unlockAudio()}
function toggleSound(){toggleAudio()}
function sfx(type,opts={}){audio.cue(({guard:'block',step:'land',ko:'win'})[type]||type,opts)}
function haptic(ms){try{if('vibrate'in navigator)navigator.vibrate(ms)}catch{}}
const collides=(a,b)=>a&&b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function hurtbox(a){return {left:a.x-43,right:a.x+43,top:463-a.y-258,bottom:463-a.y-15}}
function facingHitbox(a,type){const reach=fighters[a.id][5],kick=type==='kick';
const near=kick?38:32,far=(kick?173:139)+(reach-7)*9;
const x1=a.x+a.dir*near,x2=a.x+a.dir*far;
return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:463-a.y-(kick?179:236),bottom:463-a.y-(kick?66:149)}}
function specialHitbox(a){const far=a.id===2?211:300,from=32;
const x1=a.x+a.dir*from,x2=a.x+a.dir*far;
return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:463-a.y-277,bottom:463-a.y-55}}
function projectileHitbox(p){const dx=p.kind===-2?65:p.kind===6?55:43,dy=p.kind===-2?72:47;return{left:p.x-dx,right:p.x+dx,top:p.y-dy,bottom:p.y+dy}}
function bufferAction(key){queued[key]=16}
document.addEventListener('pointerdown',unlockAudio,{capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
const MAX_HP=220,DAMAGE_SCALE=.85;let practice=false,selectPractice=false,practiceStage=0;
let introFrames=0,matchFrames=99*60,comboTimer=0,comboCount=0,bestCombo=0,score=0,exFlash=0,trailClock=0;let trails=[];const lastTap={left:-10000,right:-10000};const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ctx=$('canvas').getContext('2d');
function portraitMarkup(i){if(i===7)return '<img src="assets/flor-portrait-v4.webp" alt="Flor Rubia">';if(i===9)return '<div class="corrected-portrait" role="img" aria-label="Malefica"></div>';return `<img src="assets/face${i}.jpg" alt="${fighters[i][0]}">`}
function show(id){battleToken++;keys={};Object.keys(queued).forEach(k=>queued[k]=0);cancelAnimationFrame(animationId);['menu','select','game'].forEach(s=>$(s).classList.toggle('hidden',s!==id));mode=id}
function goMenu(){cancelSpeech();audio.stopMusic();practice=false;$('game').classList.remove('practice');show('menu')}
function showSelect(forPractice=false){cancelSpeech();audio.stopMusic();sfx('select');selectPractice=forPractice;show('select');$('select-title').textContent=forPractice?'ELIGE PARA PRACTICAR':'ELIGE TU LUCHADOR';$('start').textContent=forPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE';renderRoster();document.querySelector('.roster-scroll').scrollTop=0}
function renderRoster(){$('roster').innerHTML=fighters.map((f,i)=>`<button type="button" class="fighter ${i===selected?'selected':''}" onclick="choose(${i})" aria-pressed="${i===selected}">${portraitMarkup(i)}<b>${f[0]}</b><small>${f[1]}</small></button>`).join('');const f=fighters[selected];const flavor=['Abre la bolsa y convierte lo que encuentra en una lluvia de objetos.','Se quita la pierna y la lanza. El paripé no conoce límites.','Enlaza acrobacias sobre el banco y remata con una patada aérea.','De la bolsa a tu cara: flan con una generosa dosis de orujo.','Agita, apunta y lanza su botella de líquido dorado.','Una picada contundente. El sobreprecio viene incluido.','Barre el escenario con una escoba de alcance devastador.','Arma la pala y remata una pelota directa al rival.','Libros, apuntes y jeringas en una avalancha de conocimiento.','Carga el pincel y dispara un estallido de pintura.','Inhala y desata una onda de sonido supersónica.','Abre el maletín y lanza mascarilla y tubo de oxígeno.'][selected];$('detail').innerHTML=`<div class="dossier-art">${portraitMarkup(selected)}</div><div class="dossier-copy"><span class="dossier-kicker">EXPEDIENTE / ${String(selected+1).padStart(2,'0')}</span><h2>${f[0]}</h2><p class="dossier-style">${f[1]}</p><div class="dossier-stats">${['FUERZA','VELOCIDAD','ALCANCE','ESPECIAL'].map((label,i)=>`<div class="stat-row"><span>${label}</span><span class="stat-track"><i class="stat-value" style="width:${f[i+3]*10}%"></i></span><b>${f[i+3]}</b></div>`).join('')}</div><div class="dossier-special"><small>ATAQUE ESPECIAL</small><strong>${specialNames[selected]}</strong><p>${flavor}</p></div></div>`}

function choose(i){sfx('select');selected=i;renderRoster()}
async function startCampaign(){if(starting)return;starting=true;const token=battleToken;$('start').disabled=true;$('start').textContent='CARGANDO LUCHADORES…';try{await assetReady;if(mode!=='select'||token!==battleToken)return;queue=fighters.map((_,i)=>i).filter(i=>i!==selected);for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}battle=0;score=0;bestCombo=0;sfx('confirm');audio.startMusic();practice=selectPractice;$('game').classList.toggle('practice',practice);show('game');if(practice)newPractice();else newBattle()}catch{$('detail').textContent='No se pudieron cargar las imágenes. Recargá para reintentar.'}finally{starting=false;$('start').disabled=false;$('start').textContent=selectPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE'}}
function entity(id,x,dir){return{id,x,y:0,vy:0,dir,hp:MAX_HP,meter:0,dash:0,dashCool:0,dashDir:1,ex:false,cool:0,attack:0,attackLength:0,attackType:'',hit:false,connected:false,shots:0,cast:0,stun:0,invuln:0,walk:0,moving:false,blocking:false,guardMix:0,guardHit:0,guardClock:0,pose:0,posePrevious:0,poseFade:1,landSquash:0,hitRecoil:0,legGone:false,castHits:new Set()}}
function newPractice(){practice=true;$('game').classList.add('practice');resetArcade(true);battleToken++;ending=false;keys={};player=entity(selected,480,1);enemy=null;projectiles=[];effects=[];hitstop=0;shake=0;announcement="¡PRACTICÁ A TU RITMO!";announceTime=110;$("overlay").classList.add("hidden");$("bg").src="assets/bg"+practiceStage+".jpg";$("pn").textContent=fighters[selected][0];$("round").textContent="PRÁCTICA";$("arena-label").textContent="Sin rival · Especial libre";updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function changeStage(){practiceStage=(practiceStage+1)%3;$("bg").src="assets/bg"+practiceStage+".jpg"}
function newBattle(){resetArcade(false);practice=false;$("game").classList.remove("practice");$("arena-label").textContent="Campeonato";battleToken++;ending=false;keys={};player=entity(selected,240,1);enemy=entity(queue[battle],720,-1);projectiles=[];effects=[];hitstop=0;shake=0;aiClock=0;announcement='¡A PELEAR!';announceTime=80;$('overlay').classList.add('hidden');$('bg').src='assets/bg'+battle%3+'.jpg';$('pn').textContent=fighters[selected][0];$('en').textContent=fighters[enemy.id][0];$('round').textContent=`BATALLA ${battle+1} / 11`;updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function hit(target,damage,push,kind=-3,impactY=target?280-target.y:280){
if(!target||practice||target.invuln>0||ending||target.hp<=0)return false;
const attacker=target===enemy?player:enemy,blocked=target.blocking&&target.dir===-Math.sign(push),wasCounter=target.attack>0&&!target.hit&&!blocked;
if(!blocked&&attacker===player){comboCount=comboTimer>0?comboCount+1:1;comboTimer=108;bestCombo=Math.max(bestCombo,comboCount);damage*=Math.max(.65,1-(comboCount-1)*.055);if(comboCount>1)sfx('combo',{count:comboCount});score+=Math.round(damage*10)*(comboCount>1?2:1)}
damage*=DAMAGE_SCALE*(wasCounter?1.12:1);target.meter=clamp(target.meter+(blocked?8:6),0,100);if(attacker)attacker.meter=clamp(attacker.meter+(blocked?5:12),0,100);
if(blocked){damage*=.18;push*=.15;target.invuln=10;target.guardHit=14;sfx('guard',{pan:target.x/480-1});hitstop=Math.max(hitstop,3);shake=Math.max(shake,2);effects.push({x:target.x+target.dir*42,y:255-target.y,t:28,text:'BLOCK',color:'#9efaff'})}
else{target.stun=kind===-3?18:23;target.invuln=kind===-3?12:22;target.hitRecoil=1;target.attack=0;target.hit=true;sfx('hit',{pan:target.x/480-1,intensity:kind===-3?1:1.4});hitstop=Math.max(hitstop,kind===-3?6:9);shake=Math.max(shake,kind===-3?5:8);if(target===player)haptic(22);if(wasCounter)effects.push({x:target.x,y:160-target.y,t:42,text:'COUNTER!',color:'#ff5d9f'})}
target.hp=clamp(target.hp-damage,0,MAX_HP);target.x=clamp(target.x+push,80,880);effects.push({x:target.x,y:impactY,t:26,kind,burst:true,blocked});if(target.hp<=0)finish(target===enemy);return true}

function strike(a,b,type){const cancel=a.attack>0&&a.attackType!=='special'&&type!==a.attackType&&a.connected&&a.attack<a.attackLength*.48;if((a.attack>0&&!cancel)||a.stun>0||a.blocking||ending||a.hp<=0)return false;if(type==='kick'&&a.legGone)return false;if(type==='special'&&(a.cool>0||a.legGone))return false;a.attackType=type;a.attackLength=type==='special'?specialPlans[a.id].length:type==='kick'?30:24;a.attack=a.attackLength;a.hit=false;a.connected=false;a.shots=0;sfx(type==='special'?'special':type);if(type==='special'){if(a===player&&a.id!==1)say(fighters[a.id][8]);a.ex=practice||a.meter>=100;if(a.ex){a.meter=0;exFlash=22;hitstop=Math.max(hitstop,7);announcement='EX · '+specialNames[a.id];sfx('ready')}a.cool=practice?a.attackLength:390;a.cast=++castSerial;announcement=a.ex?'EX · '+specialNames[a.id]:fighters[a.id][8];announceTime=85}return true}
function phaseFor(a){return clamp(Math.floor((1-a.attack/a.attackLength)*6),0,5)}
function spawn(a,item,index){sfx('release',{id:a.id,pan:a.x/480-1});const wave=item===-2;const handY=[213,205,220,211,228,217,225,230,214,230,198,215][a.id];projectiles.push({x:a.x+a.dir*(wave?55:130),y:handY-a.y+(a.id===0?(index%3-1)*12:0),dir:a.dir,owner:a,life:105,speed:a.id===1?10:wave?9:8.2+fighters[a.id][5]*.25,damage:(12+fighters[a.id][6]*1.7)*(a.ex?1.45:1),kind:item,cast:a.cast,age:0,spin:item===6?.025:item===7?.035:.085});if(a.id===1)a.legGone=true}
function resolveAttack(a,b,dt){if(!a||!a.attack||a.stun>0)return;const elapsed=a.attackLength-a.attack;if(a.attackType==='special'){const plan=specialPlans[a.id];while(a.shots<plan.times.length&&elapsed>=plan.times[a.shots]){spawn(a,plan.items[a.shots],a.shots);a.shots++}if(b&&(a.id===2||a.id===6)&&!a.hit&&elapsed>=(a.id===2?58:38)){if(b&&collides(specialHitbox(a),hurtbox(b))){a.hit=hit(b,(12+fighters[a.id][6]*1.7)*(a.ex?1.45:1),a.dir*50);}}return}if(a.hit||elapsed<a.attackLength*.36)return;a.hit=true;if(b&&collides(facingHitbox(a,a.attackType),hurtbox(b)))a.connected=hit(b,(a.attackType==='kick'?8:6)+fighters[a.id][3]*.8,a.dir*32)}
function update(dt){frame+=dt;if(comboTimer>0)comboTimer=Math.max(0,comboTimer-dt);else comboCount=0;exFlash=Math.max(0,exFlash-dt);if(!practice){matchFrames=Math.max(0,matchFrames-dt);if(!matchFrames){finish(player.hp>=enemy.hp);return}}for(const a of [player,enemy].filter(Boolean)){a.dashCool=Math.max(0,a.dashCool-dt);if(a.dash>0){a.x+=a.dashDir*12*dt;a.dash=Math.max(0,a.dash-dt)}a.cool=Math.max(0,a.cool-dt);a.attack=Math.max(0,a.attack-dt);a.stun=Math.max(0,a.stun-dt);a.invuln=Math.max(0,a.invuln-dt);const oldY=a.y;a.vy-=.75*dt;a.y+=a.vy*dt;if(a.y<0){a.y=0;a.vy=0;if(oldY>8){a.landSquash=1;shake=Math.max(shake,1.5);sfx('step')}}a.landSquash=Math.max(0,a.landSquash-.065*dt);a.hitRecoil=Math.max(0,a.hitRecoil-.075*dt);if(!a.attack&&enemy)a.dir=a===player?(enemy.x>player.x?1:-1):(player.x>enemy.x?1:-1);a.moving=false;a.blocking=false;if(a.id===2&&a.attackType==='special'&&a.attack>0&&a.stun<=0){const elapsed=a.attackLength-a.attack;if(elapsed>13&&elapsed<66)a.x+=a.dir*5.5*dt}if(a.legGone&&!projectiles.some(p=>p.owner===a&&p.kind===6&&p.life>0))a.legGone=false}
player.blocking=!!keys.defend&&player.stun<=0&&!player.attack&&player.y===0;
if(player.blocking){keys.punch=false;keys.kick=false;keys.special=false;keys.jump=false}else if(player.stun<=0&&(!player.attack||(player.hit&&player.attack<player.attackLength*.48&&player.attackType!=='special'))){const move=Number(!!keys.right)-Number(!!keys.left);if(!player.attack)player.x+=move*(player.legGone?1.8:2.3+fighters[player.id][4]*.35)*dt;player.moving=!!move;if(practice&&move)player.dir=move;if(keys.jump&&player.y===0&&!player.attack){player.vy=13;keys.jump=false;sfx('jump')}for(const type of ['punch','kick','special']){if(queued[type]>0&&strike(player,enemy,type))queued[type]=0}}
if(enemy&&enemy.stun<=0&&!enemy.attack){const distance=Math.abs(enemy.x-player.x);aiClock-=dt;
if(aiClock<=0){const threat=projectiles.some(p=>p.owner===player&&Math.abs(p.x-enemy.x)<260)||(player.attack>0&&distance<200);enemy.aiGuard=threat&&Math.random()<.48;enemy.aiRetreat=distance<120&&Math.random()<.28;
if(!enemy.aiGuard){if(player.y>50&&distance<175)strike(enemy,player,'kick');else if(enemy.cool<=0&&distance>200&&Math.random()<.5)strike(enemy,player,'special');else if(distance<170)strike(enemy,player,Math.random()<.5?'punch':'kick');if(Math.random()<.1&&enemy.y===0)enemy.vy=13;if(distance>340&&battle>1&&Math.random()<.18)dashUnit(enemy,enemy.dir)}aiClock=20+Math.random()*22}
enemy.blocking=!!enemy.aiGuard&&enemy.y===0;if(!enemy.blocking&&!enemy.attack){const move=distance>145?enemy.dir:enemy.aiRetreat?-enemy.dir:0;enemy.x+=move*(2+fighters[enemy.id][4]*.25)*dt;enemy.moving=!!move}}
for(const a of [player,enemy].filter(Boolean)){a.x=clamp(a.x,80,880);if(a.moving)a.walk+=dt;const goal=a.blocking?1:0;a.guardMix+=(goal-a.guardMix)*Math.min(1,dt*.24);a.guardHit=Math.max(0,a.guardHit-dt);if(a.blocking)a.guardClock+=dt;
 const desiredPose=poseFor(a);
 if(desiredPose!==a.pose){a.posePrevious=a.pose;a.pose=desiredPose;a.poseFade=0}
 a.poseFade=Math.min(1,a.poseFade+dt*.28)
 }for(const key of Object.keys(queued))queued[key]=Math.max(0,queued[key]-dt);shake=Math.max(0,shake-dt);if(enemy&&Math.abs(player.x-enemy.x)<65&&Math.abs(player.y-enemy.y)<110){const sign=player.x<=enemy.x?1:-1,overlap=65-Math.abs(player.x-enemy.x);player.x=clamp(player.x-sign*overlap/2,80,880);enemy.x=clamp(enemy.x+sign*overlap/2,80,880)}resolveAttack(player,enemy,dt);resolveAttack(enemy,player,dt);
for(const p of projectiles){p.x+=p.dir*p.speed*dt;p.life-=dt;p.age+=dt;const target=p.owner===player?enemy:player;if(!target)continue;const targetY=(p.kind===-2?210:255)-target.y;if(collides(projectileHitbox(p),hurtbox(target))){if(!target.castHits.has(p.cast)&&hit(target,p.damage,p.dir*40,p.kind,p.y))target.castHits.add(p.cast);p.life=0}}
projectiles=projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<1060);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);announceTime-=dt;captureTrails(dt);updateHud()}
function updateHud(){if($('timer'))$('timer').textContent=practice?'∞':Math.ceil(matchFrames/60);if($('p-meter'))$('p-meter').style.width=(practice?100:player.meter)+'%';if($('e-meter'))$('e-meter').style.width=(enemy?enemy.meter:0)+'%';if($('combo-counter'))$('combo-counter').textContent=comboCount>1?comboCount+' HIT COMBO':'';$('ph').style.width=player.hp/MAX_HP*100+'%';$('eh').style.width=enemy?enemy.hp/MAX_HP*100+'%':'0%';$('cool').textContent=player.cool>0?'Recarga: '+Math.ceil(player.cool/60)+' s':(practice?'Especial listo · Sin rival, sin límite de tiempo':'Especial listo');document.querySelector('[data-key=defend]').setAttribute('aria-pressed',String(player.blocking))}
function poseFor(a){if(a.attack>0){const t=1-a.attack/a.attackLength;return t<.22?1:t<.78?(a.attackType==='kick'?5:4):0}if(a.y>2)return 3;if(a.blocking)return 0;if(a.moving)return [1,0,2,0][Math.floor(a.walk/7)%4];return 0}
function drawSprite(im,row,col,x,y,size=330){ctx.drawImage(im,col*im.width/6,row*im.height/4,im.width/6,im.height/4,x-size/2,y-size,size,size)}
function drawBench(a){if(a.id!==2||a.attackType!=='special'||a.attack<=0)return;const t=1-a.attack/a.attackLength;if(t>.7)return;ctx.save();ctx.globalAlpha=Math.min(1,(1-t/.7)*3);const x=a.x-a.dir*40;ctx.fillStyle='#cf9a31';ctx.strokeStyle='#513324';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-100,443,200,16,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#e4b63f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-70,459);ctx.lineTo(x-82,480);ctx.moveTo(x+70,459);ctx.lineTo(x+82,480);ctx.stroke();ctx.restore()}
function drawFighter(a){const size=330,ground=463;drawBench(a);ctx.save();ctx.fillStyle='#16072266';ctx.beginPath();ctx.ellipse(a.x,ground+1,Math.max(20,48-a.y*.12),10,0,0,Math.PI*2);ctx.fill();ctx.translate(a.x,ground-a.y+(a.moving?Math.sin(a.walk*.45)*2:Math.sin(frame*.055+a.id)*1.5));ctx.scale(a.dir,1);
if(ending&&a.hp<=0){ctx.rotate(-.9);ctx.globalAlpha=.82}
if(a.moving&&a.y===0){ctx.rotate(Math.sin(a.walk*.32)*.016);ctx.translate(Math.sin(a.walk*.75)*2,0)}
if(a.y>0)ctx.rotate(-.022*Math.sign(a.vy||1));
if(a.attack>0&&a.attackType!=='special'){const t=1-a.attack/a.attackLength;ctx.translate(Math.sin(t*Math.PI)*9,0);ctx.rotate(Math.sin(t*Math.PI)*-.035)}
if(a.landSquash>0)ctx.scale(1+a.landSquash*.075,1-a.landSquash*.075);
if(a.hitRecoil>0)ctx.rotate(.10*a.hitRecoil);
if(a.stun>0)ctx.rotate(-.09);if(a.guardMix>.02){
  // Guardia física: aprovechar los brazos reales del sprite, nunca dibujar extremidades sueltas.
  // La cadera queda anclada y el torso se repliega, inclina y baja progresivamente.
  const guard=a.guardMix, impact=Math.min(1,a.guardHit/14);
  const breathing=Math.sin(frame*.15+a.id)*1.3*guard;
  ctx.translate(-6*guard-8*impact,1.5*guard+breathing+3*impact);
  ctx.transform(1,0,.13*guard,1-.095*guard,0,0);
  ctx.rotate(-.018*guard-.022*impact);
}if(a.invuln>0&&Math.floor(frame/3)%2)ctx.globalAlpha=.6;
if((a.attack>0&&a.attackType==='special')||a.legGone){const [sheet,row]=specialMap[a.id];let phase=a.attack>0&&a.attackType==='special'?phaseFor(a):4;if(a.id===1&&a.legGone&&phase===5)phase=4;drawSprite(specials[sheet],row,phase,0,0,size)}else{drawNormalAction(a,size)}ctx.restore();
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

ctx.save();ctx.textAlign='center';ctx.font='bold 19px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#21072c';ctx.fillStyle='white';ctx.strokeText(fighters[a.id][0],a.x,ground-size-9-a.y);ctx.fillText(fighters[a.id][0],a.x,ground-size-9-a.y);ctx.restore()}
function drawProp(item,x,y,size,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const col=item%4,row=Math.floor(item/4);ctx.drawImage(props,col*props.width/4,row*props.height/4,props.width/4,props.height/4,-size/2,-size/2,size,size);ctx.restore()}
function drawProjectile(p){ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.dir,1);ctx.lineCap='round';if(p.kind>=0){ctx.strokeStyle=p.kind===6?'#fff1c0aa':'#ffffff88';ctx.lineWidth=3;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(-65-n*8,n*11-12);ctx.lineTo(-30,n*7-8);ctx.stroke()}drawProp(p.kind,0,0,p.kind===6?110:p.kind===10?108:p.kind===9?93:p.kind===14?60:82,p.age*p.spin)}else if(p.kind===-1){for(let i=0;i<21;i++){ctx.fillStyle=['#ff32d7','#19ccff','#ffeb30'][i%3];ctx.beginPath();ctx.ellipse(-i*3,Math.sin(i*2.399+p.age*.12)*30,7+i%5,4+i%3,i,0,Math.PI*2);ctx.fill()}}else if(p.kind===-2){ctx.strokeStyle='#fa70ff';ctx.shadowColor='#f73bff';ctx.shadowBlur=9;ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.globalAlpha=1-i*.15;ctx.beginPath();ctx.ellipse(-i*17,0,20+i*3,36+i*10,0,-1.3,1.3);ctx.stroke()}}ctx.restore()}
function drawImpact(e){const age=26-e.t,life=clamp(e.t/26,0,1),paint=e.kind===-1;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=life;const colors=e.blocked?['#aafcff','#fff6c9','#58d2ff']:paint?['#ff36dc','#21dfff','#ffed35']:['#fff8c9','#ffe638','#ff8f33'];ctx.lineJoin='miter';ctx.rotate(Math.sin(e.x)*.3);ctx.beginPath();for(let i=0;i<24;i++){const angle=i*Math.PI/12,r=(i%2?12:42)+(age*(i%2?.15:1.1));const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fillStyle=colors[1];ctx.strokeStyle='#3c1643';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.fillStyle=colors[0];ctx.beginPath();for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=i%2?7:27;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill();for(let i=0;i<10;i++){const angle=i*2.399,inner=38+age*2,outer=inner+12+(i%3)*6;ctx.strokeStyle=colors[i%3];ctx.lineWidth=2+i%3;ctx.beginPath();ctx.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);ctx.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);ctx.stroke()}if(e.kind===9&&age>5)drawProp(9,age*2,-age,30,age*.06);ctx.restore()}

function draw(){ctx.clearRect(0,0,960,540);ctx.save();if(shake>0&&!reducedMotion)ctx.translate(Math.sin(frame*3.1)*shake*.65,Math.cos(frame*2.7)*shake*.35);const g=ctx.createLinearGradient(0,350,0,540);g.addColorStop(0,'#11052800');g.addColorStop(1,'#10052465');ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
for(const t of trails){ctx.save();ctx.globalAlpha=t.life/20*.18;drawFighter(t.a);ctx.restore()}
for(const a of [player,enemy].filter(Boolean))drawFighter(a);projectiles.forEach(drawProjectile);for(const e of effects)if(e.burst)drawImpact(e);ctx.restore();
ctx.save();ctx.textAlign='center';for(const e of effects){if(e.burst)continue;ctx.fillStyle=e.color;ctx.strokeStyle='#250734';ctx.lineWidth=5;ctx.font='italic bold 25px Arial';ctx.strokeText(e.text,e.x,e.y-(30-e.t));ctx.fillText(e.text,e.x,e.y-(30-e.t))}
if(announceTime>0&&(!introFrames||practice)){ctx.font='italic 900 32px Arial';ctx.strokeStyle='#250636';ctx.lineWidth=8;ctx.strokeText(announcement,480,72);ctx.fillStyle='#ffe529';ctx.fillText(announcement,480,72)}
if(exFlash>0){ctx.fillStyle='#8e2cff22';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#ffe83d99';ctx.lineWidth=2;for(let i=0;i<14;i++){const y=i*39;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(150+(i%4)*80,y-12);ctx.moveTo(960,y);ctx.lineTo(760-(i%4)*75,y+12);ctx.stroke()}}
if(introFrames>0){const text=introFrames>40?'BATALLA '+(battle+1):'¡A PELEAR!';ctx.fillStyle='#140326aa';ctx.fillRect(0,195,960,120);ctx.font='italic 900 62px Arial';ctx.lineWidth=9;ctx.strokeStyle='#431057';ctx.strokeText(text,480,275);ctx.fillStyle='#ffe333';ctx.fillText(text,480,275)}
if(ending){ctx.font='italic 900 86px Arial';ctx.strokeStyle='#3b0754';ctx.lineWidth=12;ctx.strokeText(matchFrames<=0?'TIME!':'K.O.',480,270);ctx.fillStyle='#ffe431';ctx.fillText(matchFrames<=0?'TIME!':'K.O.',480,270)}ctx.restore()}

function cancelSpeech(){try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch(_){}}
function say(text){
 if(!soundEnabled||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return false;
 try{
  const speech=window.speechSynthesis,utter=new window.SpeechSynthesisUtterance(text);
  utter.lang='es-AR';utter.rate=.94;utter.pitch=.82;utter.volume=.95;
  const voices=speech.getVoices?.()||[];
  utter.voice=voices.find(v=>/^es-AR/i.test(v.lang))||voices.find(v=>/^es/i.test(v.lang))||null;
  speech.cancel();speech.speak(utter);return true;
 }catch(_){return false}
}
function finish(win){
 if(practice||ending||mode!=='game')return;
 ending=true;keys={};hitstop=14;shake=8;updateHud();
 const token=battleToken,final=win&&battle===10,isTrexWin=win&&selected===1;
 sfx(win?'win':'lose');
 const healthBonus=Math.round(player.hp/MAX_HP*1000);
 if(win)score+=1500+healthBonus;
 setTimeout(()=>{
  if(token!==battleToken||mode!=='game')return;
  const badge=win?(final?'¡CAMPEÓN DEL PARIPÉ!':'¡VICTORIA!'):'¡REVANCHA!';
  const result=win?fighters[selected][0]+' derrotó a '+fighters[enemy.id][0]:fighters[enemy.id][0]+' gana este combate';
  const trexCall=isTrexWin?`<div class="trex-call" role="status" aria-live="polite">
   <div class="trex-phone" id="trex-phone" aria-hidden="true">📱</div>
   <div class="trex-call-copy"><small id="trex-call-status">📳 LLAMADA ENTRANTE...</small>
    <p id="trex-quote" hidden>«¿Calle derrota? Ni idea, maestro»</p></div></div>`:'';
  $('overlayContent').innerHTML=`<h2>${badge}</h2><p>${result}</p><p class="result-score">${score.toLocaleString('es')} PTS · MEJOR COMBO ${bestCombo}</p>${trexCall}`;
  $('overlayButtons').innerHTML=win&&!final?'<button class="btn primary" onclick="nextBattle()">SIGUIENTE RIVAL ▶</button>':win?'<button class="btn primary" onclick="showSelect()">JUGAR OTRA VEZ</button>':'<button class="btn primary" onclick="retry()">REINTENTAR</button>';
  $('overlayButtons').innerHTML+='<button class="btn" onclick="goMenu()">MENÚ</button>';
  $('overlay').classList.remove('hidden');
  if(isTrexWin){
   sfx('phone');
   setTimeout(()=>{
     if(token!==battleToken||mode!=='game'||!ending)return;
     const phone=$('trex-phone'),status=$('trex-call-status'),quote=$('trex-quote');
     if(phone)phone.classList.add('answered');
     if(status)status.textContent='📞 T-REX ATIENDE';
     if(quote)quote.hidden=false;
     say('¿Calle derrota? Ni idea, maestro');
   },1100);
  }
 },1050);
}
function nextBattle(){battle++;newBattle()}function retry(){newBattle()}
function loop(t){if(mode!=='game')return;const dt=last?Math.min((t-last)/16.67,2):1;last=t;if(!ending){if(introFrames>0){introFrames=Math.max(0,introFrames-dt);frame+=dt;if(introFrames===0){keys={};Object.keys(queued).forEach(k=>queued[k]=0);announceTime=0;sfx('fight')}}else if(hitstop>0)hitstop=Math.max(0,hitstop-dt);else update(dt)}draw();animationId=requestAnimationFrame(loop)}
function clearKeys(){keys={};Object.keys(queued).forEach(k=>queued[k]=0);last=0;document.querySelector('[data-key=defend]').setAttribute('aria-pressed','false');document.querySelectorAll('.ctl.pressed').forEach(b=>b.classList.remove('pressed'))}
const holdButtons=new Map();
for(const b of document.querySelectorAll('[data-key]')){
 const key=b.dataset.key;
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(mode!=='game')return;unlockAudio();
  b.classList.add('pressed');
  if(['punch','kick','special'].includes(key)){bufferAction(key);haptic(8)}
  else{if(key==='left'||key==='right')tapDirection(key);holdButtons.set(e.pointerId,key);keys[key]=true}
  try{b.setPointerCapture(e.pointerId)}catch{}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{
  e.preventDefault();b.classList.remove('pressed');
  if(holdButtons.get(e.pointerId)===key){holdButtons.delete(e.pointerId);keys[key]=false}
 });
}
const mapping={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyJ:'punch',KeyK:'kick',KeyL:'special',Space:'special',ShiftLeft:'defend',ShiftRight:'defend'};
window.addEventListener('keydown',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['punch','kick','special'].includes(key)){if(!e.repeat)bufferAction(key)}else{if(!e.repeat&&(key==='left'||key==='right'))tapDirection(key);keys[key]=true}});
window.addEventListener('keyup',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['left','right','jump','defend'].includes(key))keys[key]=false});
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});


const actionMap=[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[0,3],[2,1],[1,3],[2,2],[2,3]];
function resetArcade(training){introFrames=training?0:105;matchFrames=99*60;comboCount=0;comboTimer=0;trails=[];trailClock=0;exFlash=0;Object.keys(queued).forEach(k=>queued[k]=0);if(!training)sfx('round');else sfx('ready');audio.startMusic()}
function drawNormalAction(a,size){let [sheet,row]=atlasMap[a.id],im=atlases[sheet],col=poseFor(a);const [as,ar]=actionMap[a.id];let ac=-1;if(a.stun>0)ac=5;else if(a.blocking||a.guardMix>.5)ac=0;else if(a.attack>0){const t=1-a.attack/a.attackLength;if(a.attackType==='punch')ac=t<.22?1:t<.58?2:t<.86?3:-1;else if(a.attackType==='kick'){if(t<.3||t>.76&&t<.92)ac=4;else if(t<.76)col=5;else col=0}}if(ac>=0){im=actionAtlases[as];row=ar;col=ac}drawSprite(im,row,col,0,0,size)}
function captureTrails(dt){trailClock+=dt;for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);if(reducedMotion)return;if(trailClock>=3){trailClock=0;for(const a of [player,enemy].filter(Boolean)){if(a.dash>0||a.ex&&a.attackType==='special'&&a.attack>0||a.id===2&&a.attackType==='special'&&a.attack>0){trails.push({a:{...a},life:18});if(trails.length>12)trails.shift()}}}if($('bg'))$('bg').style.objectPosition=(50+(player.x-480)*.008)+'% center'}
function dashUnit(a,dir){if(!a||a.dashCool>0||a.attack>0||a.stun>0||a.y>0||a.legGone)return;a.dash=10;a.dashCool=38;a.dashDir=dir;sfx('dash',{pan:a.x/480-1});effects.push({x:a.x,y:453,t:18,burst:true,kind:-3})}
function tapDirection(key){const now=performance.now();if(now-lastTap[key]<260){dashUnit(player,key==='left'?-1:1);lastTap[key]=-10000}else lastTap[key]=now}

const audioToggle=$("audio-toggle");if(audioToggle){audioToggle.textContent=soundEnabled?"SONIDO ON":"SONIDO OFF";audioToggle.setAttribute("aria-pressed",String(soundEnabled))}
