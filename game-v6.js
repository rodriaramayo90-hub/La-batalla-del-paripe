
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
const allImages=[...atlases,...specials,props,florPortrait];
let assetsLoaded=false;const assetReady=Promise.all(allImages.map(im=>im.decode())).then(()=>assetsLoaded=true);assetReady.catch(()=>{});
const atlasMap=[[3,0],[3,1],[1,1],[3,2],[0,3],[1,3],[2,0],[3,3],[2,1],[0,1],[2,2],[2,3]];
const specialMap=[[0,0],[0,1],[2,0],[0,2],[0,3],[1,0],[1,3],[2,2],[1,2],[2,1],[2,3],[1,1]];
const specialNames=['Cirujeo: bolsa y objetos','Pierna voladora','Flic Flac','Flan de Orujo','Golden Shower','Picada con sobreprecio','Limpieza extrema','Para vos, Vero','MIR','Ataque artístico','Grito supersónico','Respirador de Air Liquide'];
const specialPlans=[{length:90,times:[45,49,53,57,61,65],items:[0,1,2,3,4,5]},{length:82,times:[41],items:[6]},{length:88,times:[],items:[]},{length:76,times:[38],items:[7]},{length:76,times:[38],items:[8]},{length:80,times:[40],items:[9]},{length:76,times:[],items:[]},{length:72,times:[36],items:[14]},{length:88,times:[44,48,52,56],items:[11,12,13,11]},{length:76,times:[38,42,46],items:[-1,-1,-1]},{length:80,times:[40],items:[-2]},{length:80,times:[40],items:[10]}];
let selected=0,queue=[],battle=0,player,enemy,projectiles=[],effects=[],mode='menu',last=0,keys={},aiClock=0,frame=0,announcement='',announceTime=0,animationId=0,ending=false,battleToken=0,castSerial=0,starting=false;
let hitstop=0,shake=0,soundEnabled=true,audioContext=null;const queued={punch:0,kick:0,special:0};
function unlockAudio(){if(!soundEnabled)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioContext??=new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{})}catch{}}
function toggleSound(){soundEnabled=!soundEnabled;const b=$('sound-toggle');if(b){b.textContent=soundEnabled?'🔊 Sonido':'🔇 Silencio';b.setAttribute('aria-pressed',String(soundEnabled))}if(soundEnabled){unlockAudio();sfx('guard')}}
function sfx(type){if(!soundEnabled||!audioContext)return;try{
const settings={punch:[165,85,.085,'square'],kick:[115,54,.15,'sawtooth'],hit:[96,49,.14,'triangle'],guard:[680,340,.095,'triangle'],special:[520,100,.22,'sawtooth'],jump:[290,490,.11,'sine'],ko:[210,75,.39,'sawtooth'],step:[90,64,.04,'sine']};
const [from,to,duration,wave]=settings[type]||settings.punch;
const t=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
osc.type=wave;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(Math.max(25,to),t+duration);
gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(type==='hit'?.07:type==='special'?.055:.035,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+duration+.018);
}catch{}}
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
function bufferAction(key){queued[key]=11}
document.addEventListener('pointerdown',unlockAudio,{capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
const MAX_HP=220,DAMAGE_SCALE=.85;let practice=false,selectPractice=false,practiceStage=0;
const ctx=$('canvas').getContext('2d');
function portraitMarkup(i){if(i===7)return '<img src="assets/flor-portrait-v4.webp" alt="Flor Rubia">';if(i===9)return '<div class="corrected-portrait" role="img" aria-label="Malefica"></div>';return `<img src="assets/face${i}.jpg" alt="${fighters[i][0]}">`}
function show(id){battleToken++;keys={};Object.keys(queued).forEach(k=>queued[k]=0);cancelAnimationFrame(animationId);['menu','select','game'].forEach(s=>$(s).classList.toggle('hidden',s!==id));mode=id}
function goMenu(){practice=false;$('game').classList.remove('practice');show('menu')}
function showSelect(forPractice=false){selectPractice=forPractice;show('select');$('select-title').textContent=forPractice?'ELIGE PARA PRACTICAR':'ELIGE TU LUCHADOR';$('start').textContent=forPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE';renderRoster();document.querySelector('.roster-scroll').scrollTop=0}
function renderRoster(){$('roster').innerHTML=fighters.map((f,i)=>`<button type="button" class="fighter ${i===selected?'selected':''}" onclick="choose(${i})" aria-pressed="${i===selected}">${portraitMarkup(i)}<b>${f[0]}</b><small>${f[1]}</small></button>`).join('');const f=fighters[selected];$('detail').innerHTML=`<b>${f[0]}</b> · ${f[1]}<br>💪 ${f[3]}/10 · ⚡ ${f[4]}/10 · 🎯 ${f[5]}/10 · ✨ ${f[6]}/10<br><b>Especial:</b> ${specialNames[selected]}`}
function choose(i){selected=i;renderRoster()}
async function startCampaign(){if(starting)return;starting=true;const token=battleToken;$('start').disabled=true;$('start').textContent='CARGANDO LUCHADORES…';try{await assetReady;if(mode!=='select'||token!==battleToken)return;queue=fighters.map((_,i)=>i).filter(i=>i!==selected);for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}battle=0;practice=selectPractice;$('game').classList.toggle('practice',practice);show('game');if(practice)newPractice();else newBattle()}catch{$('detail').textContent='No se pudieron cargar las imágenes. Recargá para reintentar.'}finally{starting=false;$('start').disabled=false;$('start').textContent=selectPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE'}}
function entity(id,x,dir){return{id,x,y:0,vy:0,dir,hp:MAX_HP,cool:0,attack:0,attackLength:0,attackType:'',hit:false,shots:0,cast:0,stun:0,invuln:0,walk:0,moving:false,blocking:false,guardMix:0,guardHit:0,guardClock:0,pose:0,posePrevious:0,poseFade:1,landSquash:0,hitRecoil:0,legGone:false,castHits:new Set()}}
function newPractice(){battleToken++;ending=false;keys={};player=entity(selected,480,1);enemy=null;projectiles=[];effects=[];hitstop=0;shake=0;announcement="¡PRACTICÁ A TU RITMO!";announceTime=110;$("overlay").classList.add("hidden");$("bg").src="assets/bg"+practiceStage+".jpg";$("pn").textContent=fighters[selected][0];$("round").textContent="PRÁCTICA";$("arena-label").textContent="Sin rival · Especial libre";updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function changeStage(){practiceStage=(practiceStage+1)%3;$("bg").src="assets/bg"+practiceStage+".jpg"}
function newBattle(){practice=false;$("game").classList.remove("practice");$("arena-label").textContent="Campeonato";battleToken++;ending=false;keys={};player=entity(selected,240,1);enemy=entity(queue[battle],720,-1);projectiles=[];effects=[];hitstop=0;shake=0;aiClock=0;announcement='¡A PELEAR!';announceTime=80;$('overlay').classList.add('hidden');$('bg').src='assets/bg'+battle%3+'.jpg';$('pn').textContent=fighters[selected][0];$('en').textContent=fighters[enemy.id][0];$('round').textContent=`BATALLA ${battle+1} / 11`;updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function hit(target,damage,push,kind=-3,impactY=280-target.y){if(!target||practice||target.invuln>0||ending||target.hp<=0)return false;damage*=DAMAGE_SCALE;const blocked=target.blocking&&target.dir===-Math.sign(push);if(blocked){damage*=.2;push*=.18;target.invuln=12;target.guardHit=14;sfx('guard');hitstop=Math.max(hitstop,3);shake=Math.max(shake,2);if(target===player)haptic(12);effects.push({x:target.x+target.dir*42,y:300-target.y,t:28,text:'DEFENSA',color:'#9efaff'})}else{target.stun=17;target.invuln=22;target.hitRecoil=1;sfx('hit');hitstop=Math.max(hitstop,5);shake=Math.max(shake,6);if(target===player)haptic(25);effects.push({x:target.x,y:285-target.y,t:30,text:'-'+Math.round(damage),color:'#ffec34'})}target.hp=clamp(target.hp-damage,0,MAX_HP);target.x=clamp(target.x+push,80,880);effects.push({x:target.x,y:impactY,t:22,kind,burst:true,blocked});if(target.hp<=0)finish(target===enemy);return true}
function strike(a,b,type){if(a.attack>0||a.stun>0||a.blocking||ending||a.hp<=0)return false;if(type==='kick'&&a.legGone)return false;if(type==='special'&&(a.cool>0||a.legGone))return false;a.attackType=type;a.attackLength=type==='special'?specialPlans[a.id].length:type==='kick'?30:24;a.attack=a.attackLength;a.hit=false;a.shots=0;sfx(type==='special'?'special':type);if(type==='special'){a.cool=practice?a.attackLength:390;a.cast=++castSerial;announcement=fighters[a.id][8];announceTime=85}return true}
function phaseFor(a){return clamp(Math.floor((1-a.attack/a.attackLength)*6),0,5)}
function spawn(a,item,index){const wave=item===-2;const handY=[213,205,220,211,228,217,225,230,214,230,198,215][a.id];projectiles.push({x:a.x+a.dir*(wave?55:130),y:handY-a.y+(a.id===0?(index%3-1)*12:0),dir:a.dir,owner:a,life:105,speed:a.id===1?10:wave?9:8.2+fighters[a.id][5]*.25,damage:12+fighters[a.id][6]*1.7,kind:item,cast:a.cast,age:0,spin:item===6?.025:item===7?.035:.085});if(a.id===1)a.legGone=true}
function resolveAttack(a,b,dt){if(!a||!a.attack||a.stun>0)return;const elapsed=a.attackLength-a.attack;if(a.attackType==='special'){const plan=specialPlans[a.id];while(a.shots<plan.times.length&&elapsed>=plan.times[a.shots]){spawn(a,plan.items[a.shots],a.shots);a.shots++}if(b&&(a.id===2||a.id===6)&&!a.hit&&elapsed>=(a.id===2?58:38)){if(b&&collides(specialHitbox(a),hurtbox(b))){a.hit=hit(b,12+fighters[a.id][6]*1.7,a.dir*50);}}return}if(a.hit||elapsed<a.attackLength*.36)return;a.hit=true;if(b&&collides(facingHitbox(a,a.attackType),hurtbox(b)))hit(b,(a.attackType==='kick'?8:6)+fighters[a.id][3]*.8,a.dir*32)}
function update(dt){frame+=dt;for(const a of [player,enemy].filter(Boolean)){a.cool=Math.max(0,a.cool-dt);a.attack=Math.max(0,a.attack-dt);a.stun=Math.max(0,a.stun-dt);a.invuln=Math.max(0,a.invuln-dt);const oldY=a.y;a.vy-=.75*dt;a.y+=a.vy*dt;if(a.y<0){a.y=0;a.vy=0;if(oldY>8){a.landSquash=1;shake=Math.max(shake,1.5);sfx('step')}}a.landSquash=Math.max(0,a.landSquash-.065*dt);a.hitRecoil=Math.max(0,a.hitRecoil-.075*dt);if(!a.attack&&enemy)a.dir=a===player?(enemy.x>player.x?1:-1):(player.x>enemy.x?1:-1);a.moving=false;a.blocking=false;if(a.id===2&&a.attackType==='special'&&a.attack>0&&a.stun<=0){const elapsed=a.attackLength-a.attack;if(elapsed>13&&elapsed<66)a.x+=a.dir*5.5*dt}if(a.legGone&&!projectiles.some(p=>p.owner===a&&p.kind===6&&p.life>0))a.legGone=false}
player.blocking=!!keys.defend&&player.stun<=0&&!player.attack&&player.y===0;
if(player.blocking){keys.punch=false;keys.kick=false;keys.special=false;keys.jump=false}else if(player.stun<=0&&!player.attack){const move=Number(!!keys.right)-Number(!!keys.left);player.x+=move*(player.legGone?1.8:2.3+fighters[player.id][4]*.35)*dt;player.moving=!!move;if(practice&&move)player.dir=move;if(keys.jump&&player.y===0){player.vy=13;keys.jump=false;sfx('jump')}for(const type of ['punch','kick','special']){if(queued[type]>0&&strike(player,enemy,type))queued[type]=0}}
if(enemy&&enemy.stun<=0&&!enemy.attack){const distance=Math.abs(enemy.x-player.x);enemy.blocking=enemy.y===0&&((player.attack>0&&distance<230)||(projectiles.some(p=>p.owner===player&&Math.abs(p.x-enemy.x)<170)))&&Math.sin(frame*.037)>.45;if(!enemy.blocking){if(distance>135){enemy.x+=enemy.dir*(enemy.legGone?1.4:1.8+fighters[enemy.id][4]*.26)*dt;enemy.moving=true}aiClock-=dt;if(aiClock<=0){if(enemy.cool<=0&&Math.random()<.38)strike(enemy,player,'special');else if(distance<160)strike(enemy,player,Math.random()<.55?'punch':'kick');if(Math.random()<.12&&enemy.y===0)enemy.vy=12;aiClock=26+Math.random()*28}}}
for(const a of [player,enemy].filter(Boolean)){a.x=clamp(a.x,80,880);if(a.moving)a.walk+=dt;const goal=a.blocking?1:0;a.guardMix+=(goal-a.guardMix)*Math.min(1,dt*.24);a.guardHit=Math.max(0,a.guardHit-dt);if(a.blocking)a.guardClock+=dt;
 const desiredPose=poseFor(a);
 if(desiredPose!==a.pose){a.posePrevious=a.pose;a.pose=desiredPose;a.poseFade=0}
 a.poseFade=Math.min(1,a.poseFade+dt*.28)
 }for(const key of Object.keys(queued))queued[key]=Math.max(0,queued[key]-dt);shake=Math.max(0,shake-dt);resolveAttack(player,enemy,dt);resolveAttack(enemy,player,dt);
for(const p of projectiles){p.x+=p.dir*p.speed*dt;p.life-=dt;p.age+=dt;const target=p.owner===player?enemy:player;if(!target)continue;const targetY=(p.kind===-2?210:255)-target.y;if(collides(projectileHitbox(p),hurtbox(target))){if(!target.castHits.has(p.cast)&&hit(target,p.damage,p.dir*40,p.kind,p.y))target.castHits.add(p.cast);p.life=0}}
projectiles=projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<1060);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);announceTime-=dt;updateHud()}
function updateHud(){$('ph').style.width=player.hp/MAX_HP*100+'%';$('eh').style.width=enemy?enemy.hp/MAX_HP*100+'%':'0%';$('cool').textContent=player.cool>0?'Recarga: '+Math.ceil(player.cool/60)+' s':(practice?'Especial listo · Sin rival, sin límite de tiempo':'Especial listo');document.querySelector('[data-key=defend]').setAttribute('aria-pressed',String(player.blocking))}
function poseFor(a){if(a.attack>0){const t=1-a.attack/a.attackLength;return t<.22?1:t<.78?(a.attackType==='kick'?5:4):0}if(a.y>2)return 3;if(a.blocking)return 0;if(a.moving)return [1,0,2,0][Math.floor(a.walk/7)%4];return 0}
function drawSprite(im,row,col,x,y,size=330){ctx.drawImage(im,col*im.width/6,row*im.height/4,im.width/6,im.height/4,x-size/2,y-size,size,size)}
function drawBench(a){if(a.id!==2||a.attackType!=='special'||a.attack<=0)return;const t=1-a.attack/a.attackLength;if(t>.7)return;ctx.save();ctx.globalAlpha=Math.min(1,(1-t/.7)*3);const x=a.x-a.dir*40;ctx.fillStyle='#cf9a31';ctx.strokeStyle='#513324';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-100,443,200,16,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#e4b63f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-70,459);ctx.lineTo(x-82,480);ctx.moveTo(x+70,459);ctx.lineTo(x+82,480);ctx.stroke();ctx.restore()}
function drawFighter(a){const size=330,ground=463;drawBench(a);ctx.save();ctx.fillStyle='#16072266';ctx.beginPath();ctx.ellipse(a.x,ground+1,Math.max(20,48-a.y*.12),10,0,0,Math.PI*2);ctx.fill();ctx.translate(a.x,ground-a.y+(a.moving?Math.sin(a.walk*.45)*2:Math.sin(frame*.055+a.id)*1.5));ctx.scale(a.dir,1);
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
if((a.attack>0&&a.attackType==='special')||a.legGone){const [sheet,row]=specialMap[a.id];let phase=a.attack>0&&a.attackType==='special'?phaseFor(a):4;if(a.id===1&&a.legGone&&phase===5)phase=4;drawSprite(specials[sheet],row,phase,0,0,size)}else{const [sheet,row]=atlasMap[a.id];if(a.poseFade<.99&&a.guardMix<.12){ctx.save();ctx.globalAlpha*=(1-a.poseFade)*.30;drawSprite(atlases[sheet],row,a.posePrevious,0,0,size);ctx.restore()}
 drawSprite(atlases[sheet],row,a.guardMix>.12?0:a.pose,0,0,size)}ctx.restore();
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
function drawImpact(e){ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=e.t/22;if(e.blocked){
 const spread=22-e.t;ctx.lineCap='round';
 for(let i=0;i<8;i++){const angle=-1.3+i*.37;const inner=13+spread*.5,outer=35+spread*2.1;
 ctx.strokeStyle=i%2?'#fff6d2':'#ffcb56';ctx.lineWidth=i%3===0?6:3;
 ctx.beginPath();ctx.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);ctx.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);ctx.stroke()}
 ctx.fillStyle='#fff7d7';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(14,0);ctx.lineTo(0,19);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();
 }else{const spread=(22-e.t)*2.6;const colors=e.kind===7||e.kind===8?['#ffdc36','#d89421']:e.kind===9?['#f8879b','#fff0d7']:e.kind===-1?['#ff32d7','#19ccff','#ffeb30']:['#fff8a5','#ffe32d'];for(let i=0;i<10;i++){const angle=i*2.399;ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.ellipse(Math.cos(angle)*spread,Math.sin(angle)*spread,5+i%3,3+i%3,angle,0,Math.PI*2);ctx.fill()}if(e.kind===9){drawProp(9,spread*.4,-spread*.4,36,spread*.03)}}ctx.restore()}
function draw(){ctx.clearRect(0,0,960,540);ctx.save();if(shake>0)ctx.translate(Math.sin(frame*6.4)*shake*.7,Math.cos(frame*4.7)*shake*.45);ctx.fillStyle='#15072320';ctx.fillRect(0,467,960,73);for(const a of [player,enemy].filter(Boolean))drawFighter(a);projectiles.forEach(drawProjectile);for(const e of effects)if(e.burst)drawImpact(e);ctx.save();ctx.textAlign='center';for(const e of effects){if(e.burst)continue;ctx.fillStyle=e.color;ctx.strokeStyle='#2a043a';ctx.lineWidth=4;ctx.font=e.text==='DEFENSA'?'bold 22px Arial':'bold 30px Arial';ctx.strokeText(e.text,e.x,e.y-(30-e.t)*2);ctx.fillText(e.text,e.x,e.y-(30-e.t)*2)}if(announceTime>0){ctx.font='italic bold 32px Arial';ctx.strokeStyle='#250636';ctx.lineWidth=7;ctx.strokeText(announcement,480,65);ctx.fillStyle='#ffe529';ctx.fillText(announcement,480,65)}ctx.restore();ctx.restore()}
function finish(win){if(practice||ending||mode!=='game')return;ending=true;keys={};sfx(win?'ko':'hit');updateHud();const token=battleToken,isTrex=win&&selected===1,final=win&&battle===10;$('overlayContent').innerHTML=win?`<h2>${final?'🏆 ¡CAMPEÓN DEL PARIPÉ!':'🏆 ¡VICTORIA!'}</h2><p>${fighters[selected][0]} derrotó a ${fighters[enemy.id][0]}</p>`:`<h2>💥 ¡DERROTA!</h2><p>${fighters[enemy.id][0]} ganó este combate</p>`;if(isTrex)$('overlayContent').innerHTML+='<div class="phone">📱</div><p id="trexline">📳 ¡Está sonando el celular!</p>';$('overlayButtons').innerHTML='';$('overlay').classList.remove('hidden');if(isTrex)setTimeout(()=>{if(token!==battleToken)return;$('trexline').textContent='📞 ¿Calle Derrota? Ni idea, maestro.';say('¿Calle derrota? Ni idea maestro.')},1100);setTimeout(()=>{if(token!==battleToken||mode!=='game')return;$('overlayButtons').innerHTML=win&&!final?'<button class="btn primary" onclick="nextBattle()">SIGUIENTE RIVAL ▶</button>':win?'<button class="btn primary" onclick="showSelect()">JUGAR OTRA VEZ</button>':'<button class="btn primary" onclick="retry()">REINTENTAR BATALLA</button>';$('overlayButtons').innerHTML+='<button class="btn" onclick="goMenu()">MENÚ</button>'},isTrex?2800:0)}
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='es-AR';speechSynthesis.speak(u)}catch{}}
function nextBattle(){battle++;newBattle()}function retry(){newBattle()}
function loop(t){if(mode!=='game')return;const dt=last?Math.min((t-last)/16.67,2):1;last=t;if(!ending){if(hitstop>0){hitstop=Math.max(0,hitstop-dt)}else update(dt)}draw();animationId=requestAnimationFrame(loop)}
function clearKeys(){keys={};Object.keys(queued).forEach(k=>queued[k]=0);last=0;document.querySelector('[data-key=defend]').setAttribute('aria-pressed','false');document.querySelectorAll('.ctl.pressed').forEach(b=>b.classList.remove('pressed'))}
const holdButtons=new Map();
for(const b of document.querySelectorAll('[data-key]')){
 const key=b.dataset.key;
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(mode!=='game')return;unlockAudio();
  b.classList.add('pressed');
  if(['punch','kick','special'].includes(key)){bufferAction(key);haptic(8)}
  else{holdButtons.set(e.pointerId,key);keys[key]=true}
  try{b.setPointerCapture(e.pointerId)}catch{}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{
  e.preventDefault();b.classList.remove('pressed');
  if(holdButtons.get(e.pointerId)===key){holdButtons.delete(e.pointerId);keys[key]=false}
 });
}
const mapping={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyJ:'punch',KeyK:'kick',KeyL:'special',Space:'special',ShiftLeft:'defend',ShiftRight:'defend'};
window.addEventListener('keydown',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['punch','kick','special'].includes(key)){if(!e.repeat)bufferAction(key)}else keys[key]=true});
window.addEventListener('keyup',e=>{const key=mapping[e.code];if(mode!=='game'||!key)return;e.preventDefault();if(['left','right','jump','defend'].includes(key))keys[key]=false});
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
