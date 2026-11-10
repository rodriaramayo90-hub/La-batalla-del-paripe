
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
const MAX_HP=220,DAMAGE_SCALE=.85;let practice=false,selectPractice=false,practiceStage=0;
const ctx=$('canvas').getContext('2d');
function portraitMarkup(i){if(i===7)return '<img src="assets/flor-portrait-v4.webp" alt="Flor Rubia">';if(i===9)return '<div class="corrected-portrait" role="img" aria-label="Malefica"></div>';return `<img src="assets/face${i}.jpg" alt="${fighters[i][0]}">`}
function show(id){battleToken++;keys={};cancelAnimationFrame(animationId);['menu','select','game'].forEach(s=>$(s).classList.toggle('hidden',s!==id));mode=id}
function goMenu(){practice=false;$('game').classList.remove('practice');show('menu')}
function showSelect(forPractice=false){selectPractice=forPractice;show('select');$('select-title').textContent=forPractice?'ELIGE PARA PRACTICAR':'ELIGE TU LUCHADOR';$('start').textContent=forPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE';renderRoster();document.querySelector('.roster-scroll').scrollTop=0}
function renderRoster(){$('roster').innerHTML=fighters.map((f,i)=>`<button type="button" class="fighter ${i===selected?'selected':''}" onclick="choose(${i})" aria-pressed="${i===selected}">${portraitMarkup(i)}<b>${f[0]}</b><small>${f[1]}</small></button>`).join('');const f=fighters[selected];$('detail').innerHTML=`<b>${f[0]}</b> · ${f[1]}<br>💪 ${f[3]}/10 · ⚡ ${f[4]}/10 · 🎯 ${f[5]}/10 · ✨ ${f[6]}/10<br><b>Especial:</b> ${specialNames[selected]}`}
function choose(i){selected=i;renderRoster()}
async function startCampaign(){if(starting)return;starting=true;const token=battleToken;$('start').disabled=true;$('start').textContent='CARGANDO LUCHADORES…';try{await assetReady;if(mode!=='select'||token!==battleToken)return;queue=fighters.map((_,i)=>i).filter(i=>i!==selected);for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}battle=0;practice=selectPractice;$('game').classList.toggle('practice',practice);show('game');if(practice)newPractice();else newBattle()}catch{$('detail').textContent='No se pudieron cargar las imágenes. Recargá para reintentar.'}finally{starting=false;$('start').disabled=false;$('start').textContent=selectPractice?'🥋 ENTRAR A PRÁCTICA':'⚡ COMENZAR COMBATE'}}
function entity(id,x,dir){return{id,x,y:0,vy:0,dir,hp:MAX_HP,cool:0,attack:0,attackLength:0,attackType:'',hit:false,shots:0,cast:0,stun:0,invuln:0,walk:0,moving:false,blocking:false,guardMix:0,guardHit:0,guardClock:0,legGone:false,castHits:new Set()}}
function newPractice(){battleToken++;ending=false;keys={};player=entity(selected,480,1);enemy=null;projectiles=[];effects=[];announcement="¡PRACTICÁ A TU RITMO!";announceTime=110;$("overlay").classList.add("hidden");$("bg").src="assets/bg"+practiceStage+".jpg";$("pn").textContent=fighters[selected][0];$("round").textContent="PRÁCTICA";$("arena-label").textContent="Sin rival · Especial libre";updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function changeStage(){practiceStage=(practiceStage+1)%3;$("bg").src="assets/bg"+practiceStage+".jpg"}
function newBattle(){practice=false;$("game").classList.remove("practice");$("arena-label").textContent="Campeonato";battleToken++;ending=false;keys={};player=entity(selected,240,1);enemy=entity(queue[battle],720,-1);projectiles=[];effects=[];aiClock=0;announcement='¡A PELEAR!';announceTime=80;$('overlay').classList.add('hidden');$('bg').src='assets/bg'+battle%3+'.jpg';$('pn').textContent=fighters[selected][0];$('en').textContent=fighters[enemy.id][0];$('round').textContent=`BATALLA ${battle+1} / 11`;updateHud();last=0;cancelAnimationFrame(animationId);animationId=requestAnimationFrame(loop)}
function hit(target,damage,push,kind=-3,impactY=280-target.y){if(!target||practice||target.invuln>0||ending||target.hp<=0)return false;damage*=DAMAGE_SCALE;const blocked=target.blocking&&target.dir===-Math.sign(push);if(blocked){damage*=.2;push*=.18;target.invuln=12;target.guardHit=14;effects.push({x:target.x+target.dir*42,y:300-target.y,t:28,text:'DEFENSA',color:'#9efaff'})}else{target.stun=17;target.invuln=22;effects.push({x:target.x,y:285-target.y,t:30,text:'-'+Math.round(damage),color:'#ffec34'})}target.hp=clamp(target.hp-damage,0,MAX_HP);target.x=clamp(target.x+push,80,880);effects.push({x:target.x,y:impactY,t:22,kind,burst:true,blocked});if(target.hp<=0)finish(target===enemy);return true}
function strike(a,b,type){if(a.attack>0||a.stun>0||a.blocking||ending||a.hp<=0)return false;if(type==='kick'&&a.legGone)return false;if(type==='special'&&(a.cool>0||a.legGone))return false;a.attackType=type;a.attackLength=type==='special'?specialPlans[a.id].length:type==='kick'?30:24;a.attack=a.attackLength;a.hit=false;a.shots=0;if(type==='special'){a.cool=practice?a.attackLength:390;a.cast=++castSerial;announcement=fighters[a.id][8];announceTime=85}return true}
function phaseFor(a){return clamp(Math.floor((1-a.attack/a.attackLength)*6),0,5)}
function spawn(a,item,index){const wave=item===-2;const handY=[213,205,220,211,228,217,225,230,214,230,198,215][a.id];projectiles.push({x:a.x+a.dir*(wave?55:130),y:handY-a.y+(a.id===0?(index%3-1)*12:0),dir:a.dir,owner:a,life:105,speed:a.id===1?10:wave?9:8.2+fighters[a.id][5]*.25,damage:12+fighters[a.id][6]*1.7,kind:item,cast:a.cast,age:0,spin:item===6?.025:item===7?.035:.085});if(a.id===1)a.legGone=true}
function resolveAttack(a,b,dt){if(!a||!a.attack||a.stun>0)return;const elapsed=a.attackLength-a.attack;if(a.attackType==='special'){const plan=specialPlans[a.id];while(a.shots<plan.times.length&&elapsed>=plan.times[a.shots]){spawn(a,plan.items[a.shots],a.shots);a.shots++}if(b&&(a.id===2||a.id===6)&&!a.hit&&elapsed>=(a.id===2?58:38)){const range=a.id===2?190:285;if(b&&Math.abs(a.x-b.x)<range&&Math.abs(a.y-b.y)<120){a.hit=hit(b,12+fighters[a.id][6]*1.7,a.dir*50);}}return}if(a.hit||elapsed<a.attackLength*.36)return;a.hit=true;const range=a.attackType==='kick'?165:140;if(b&&Math.abs(a.x-b.x)<range&&Math.abs(a.y-b.y)<100)hit(b,(a.attackType==='kick'?8:6)+fighters[a.id][3]*.8,a.dir*32)}
function update(dt){frame+=dt;for(const a of [player,enemy].filter(Boolean)){a.cool=Math.max(0,a.cool-dt);a.attack=Math.max(0,a.attack-dt);a.stun=Math.max(0,a.stun-dt);a.invuln=Math.max(0,a.invuln-dt);a.vy-=.75*dt;a.y+=a.vy*dt;if(a.y<0){a.y=0;a.vy=0}if(!a.attack&&enemy)a.dir=a===player?(enemy.x>player.x?1:-1):(player.x>enemy.x?1:-1);a.moving=false;a.blocking=false;if(a.id===2&&a.attackType==='special'&&a.attack>0&&a.stun<=0){const elapsed=a.attackLength-a.attack;if(elapsed>13&&elapsed<66)a.x+=a.dir*5.5*dt}if(a.legGone&&!projectiles.some(p=>p.owner===a&&p.kind===6&&p.life>0))a.legGone=false}
player.blocking=!!keys.defend&&player.stun<=0&&!player.attack&&player.y===0;
if(player.blocking){keys.punch=false;keys.kick=false;keys.special=false;keys.jump=false}else if(player.stun<=0&&!player.attack){const move=Number(!!keys.right)-Number(!!keys.left);player.x+=move*(player.legGone?1.8:2.3+fighters[player.id][4]*.35)*dt;player.moving=!!move;if(practice&&move)player.dir=move;if(keys.jump&&player.y===0){player.vy=13;keys.jump=false}for(const type of ['punch','kick','special'])if(keys[type]){strike(player,enemy,type);keys[type]=false}}
if(enemy&&enemy.stun<=0&&!enemy.attack){const distance=Math.abs(enemy.x-player.x);enemy.blocking=enemy.y===0&&((player.attack>0&&distance<230)||(projectiles.some(p=>p.owner===player&&Math.abs(p.x-enemy.x)<170)))&&Math.sin(frame*.037)>.45;if(!enemy.blocking){if(distance>135){enemy.x+=enemy.dir*(enemy.legGone?1.4:1.8+fighters[enemy.id][4]*.26)*dt;enemy.moving=true}aiClock-=dt;if(aiClock<=0){if(enemy.cool<=0&&Math.random()<.38)strike(enemy,player,'special');else if(distance<160)strike(enemy,player,Math.random()<.55?'punch':'kick');if(Math.random()<.12&&enemy.y===0)enemy.vy=12;aiClock=26+Math.random()*28}}}
for(const a of [player,enemy].filter(Boolean)){a.x=clamp(a.x,80,880);if(a.moving)a.walk+=dt;const goal=a.blocking?1:0;a.guardMix+=(goal-a.guardMix)*Math.min(1,dt*.24);a.guardHit=Math.max(0,a.guardHit-dt);if(a.blocking)a.guardClock+=dt}resolveAttack(player,enemy,dt);resolveAttack(enemy,player,dt);
for(const p of projectiles){p.x+=p.dir*p.speed*dt;p.life-=dt;p.age+=dt;const target=p.owner===player?enemy:player;if(!target)continue;const targetY=(p.kind===-2?210:255)-target.y;if(Math.abs(p.x-target.x)<(p.kind===-2?70:46)&&Math.abs(p.y-targetY)<105){if(!target.castHits.has(p.cast)&&hit(target,p.damage,p.dir*40,p.kind,p.y))target.castHits.add(p.cast);p.life=0}}
projectiles=projectiles.filter(p=>p.life>0&&p.x>-100&&p.x<1060);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);announceTime-=dt;updateHud()}
function updateHud(){$('ph').style.width=player.hp/MAX_HP*100+'%';$('eh').style.width=enemy?enemy.hp/MAX_HP*100+'%':'0%';$('cool').textContent=player.cool>0?'Recarga: '+Math.ceil(player.cool/60)+' s':(practice?'Especial listo · Sin rival, sin límite de tiempo':'Especial listo');document.querySelector('[data-key=defend]').setAttribute('aria-pressed',String(player.blocking))}
function poseFor(a){if(a.attack>0){const t=1-a.attack/a.attackLength;return t<.22?1:t<.78?(a.attackType==='kick'?5:4):0}if(a.y>2)return 3;if(a.moving)return [1,0,2,0][Math.floor(a.walk/7)%4];return 0}
function drawSprite(im,row,col,x,y,size=330){ctx.drawImage(im,col*im.width/6,row*im.height/4,im.width/6,im.height/4,x-size/2,y-size,size,size)}
function drawBench(a){if(a.id!==2||a.attackType!=='special'||a.attack<=0)return;const t=1-a.attack/a.attackLength;if(t>.7)return;ctx.save();ctx.globalAlpha=Math.min(1,(1-t/.7)*3);const x=a.x-a.dir*40;ctx.fillStyle='#cf9a31';ctx.strokeStyle='#513324';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x-100,443,200,16,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#e4b63f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-70,459);ctx.lineTo(x-82,480);ctx.moveTo(x+70,459);ctx.lineTo(x+82,480);ctx.stroke();ctx.restore()}
function drawGuardArms(a){
 const g=a.guardMix;if(g<=.02)return;
 const hit=Math.min(1,a.guardHit/14),lift=(1-g)*43;
 const clothing=['#b83d58','#f4f4f2','#26333c','#9ac8ee','#eaeef2','#e9edf0','#367ca8','#202b36','#d9e8fa','#363443','#293f51','#1c2b38'][a.id];
 ctx.save();ctx.globalAlpha*=Math.min(1,g*1.7);
 ctx.translate(-hit*7,Math.sin(a.guardClock*.15)*g*1.7+hit*5);
 ctx.lineCap='round';ctx.lineJoin='round';
 const arm=(pts)=>{
  ctx.beginPath();ctx.moveTo(pts[0],pts[1]);ctx.lineTo(pts[2],pts[3]);ctx.lineTo(pts[4],pts[5]);
  ctx.strokeStyle='#251528';ctx.lineWidth=29;ctx.stroke();
  ctx.strokeStyle=clothing;ctx.lineWidth=21;ctx.stroke();
  ctx.strokeStyle='#ffffff4d';ctx.lineWidth=4;ctx.stroke();
 };
 const fist=(x,y)=>{
  ctx.fillStyle='#edb68f';ctx.strokeStyle='#332033';ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(x,y,13,15,-.22,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#ac6a5d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-6,y+1);ctx.lineTo(x+6,y-2);ctx.stroke();
 };
 const by=-92+lift+hit*12,fy=-105+lift+hit*15;
 arm([-35,-29,-4,-49,25,by]);fist(25,by);
 arm([35,-27,62,-50,39,fy]);fist(39,fy);
 if(hit>.07){
  ctx.strokeStyle='#fff1b8';ctx.lineWidth=4;ctx.globalAlpha*=hit;
  for(let i=0;i<4;i++){const y=-99+i*18;ctx.beginPath();ctx.moveTo(62,y);ctx.lineTo(84+i%2*8,y-9+i*3);ctx.stroke()}
 }
 ctx.restore();
}
function drawFighter(a){const size=330,ground=463;drawBench(a);ctx.save();ctx.fillStyle='#16072266';ctx.beginPath();ctx.ellipse(a.x,ground+1,Math.max(20,48-a.y*.12),10,0,0,Math.PI*2);ctx.fill();ctx.translate(a.x,ground-a.y+(a.moving?Math.sin(a.walk*.45)*2:Math.sin(frame*.055+a.id)*1.5));ctx.scale(a.dir,1);if(a.stun>0)ctx.rotate(-.09);if(a.guardMix>.02){ctx.translate(-11*a.guardMix-a.guardHit*.38,8*a.guardMix+a.guardHit*.18);ctx.rotate(-.06*a.guardMix)}if(a.invuln>0&&Math.floor(frame/3)%2)ctx.globalAlpha=.6;
if((a.attack>0&&a.attackType==='special')||a.legGone){const [sheet,row]=specialMap[a.id];let phase=a.attack>0&&a.attackType==='special'?phaseFor(a):4;if(a.id===1&&a.legGone&&phase===5)phase=4;drawSprite(specials[sheet],row,phase,0,0,size)}else{const [sheet,row]=atlasMap[a.id];drawSprite(atlases[sheet],row,a.guardMix>.12?0:poseFor(a),0,0,size);drawGuardArms(a)}ctx.restore();
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
function draw(){ctx.clearRect(0,0,960,540);ctx.fillStyle='#15072320';ctx.fillRect(0,467,960,73);for(const a of [player,enemy].filter(Boolean))drawFighter(a);projectiles.forEach(drawProjectile);for(const e of effects)if(e.burst)drawImpact(e);ctx.save();ctx.textAlign='center';for(const e of effects){if(e.burst)continue;ctx.fillStyle=e.color;ctx.strokeStyle='#2a043a';ctx.lineWidth=4;ctx.font=e.text==='DEFENSA'?'bold 22px Arial':'bold 30px Arial';ctx.strokeText(e.text,e.x,e.y-(30-e.t)*2);ctx.fillText(e.text,e.x,e.y-(30-e.t)*2)}if(announceTime>0){ctx.font='italic bold 32px Arial';ctx.strokeStyle='#250636';ctx.lineWidth=7;ctx.strokeText(announcement,480,65);ctx.fillStyle='#ffe529';ctx.fillText(announcement,480,65)}ctx.restore()}
function finish(win){if(practice||ending||mode!=='game')return;ending=true;keys={};updateHud();const token=battleToken,isTrex=win&&selected===1,final=win&&battle===10;$('overlayContent').innerHTML=win?`<h2>${final?'🏆 ¡CAMPEÓN DEL PARIPÉ!':'🏆 ¡VICTORIA!'}</h2><p>${fighters[selected][0]} derrotó a ${fighters[enemy.id][0]}</p>`:`<h2>💥 ¡DERROTA!</h2><p>${fighters[enemy.id][0]} ganó este combate</p>`;if(isTrex)$('overlayContent').innerHTML+='<div class="phone">📱</div><p id="trexline">📳 ¡Está sonando el celular!</p>';$('overlayButtons').innerHTML='';$('overlay').classList.remove('hidden');if(isTrex)setTimeout(()=>{if(token!==battleToken)return;$('trexline').textContent='📞 ¿Calle Derrota? Ni idea, maestro.';say('¿Calle derrota? Ni idea maestro.')},1100);setTimeout(()=>{if(token!==battleToken||mode!=='game')return;$('overlayButtons').innerHTML=win&&!final?'<button class="btn primary" onclick="nextBattle()">SIGUIENTE RIVAL ▶</button>':win?'<button class="btn primary" onclick="showSelect()">JUGAR OTRA VEZ</button>':'<button class="btn primary" onclick="retry()">REINTENTAR BATALLA</button>';$('overlayButtons').innerHTML+='<button class="btn" onclick="goMenu()">MENÚ</button>'},isTrex?2800:0)}
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='es-AR';speechSynthesis.speak(u)}catch{}}
function nextBattle(){battle++;newBattle()}function retry(){newBattle()}
function loop(t){if(mode!=='game')return;const dt=last?Math.min((t-last)/16.67,2):1;last=t;if(!ending)update(dt);draw();animationId=requestAnimationFrame(loop)}
function clearKeys(){keys={};last=0;document.querySelector('[data-key=defend]').setAttribute('aria-pressed','false')}
for(const b of document.querySelectorAll('[data-key]')){const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='game')return;keys[key]=true;if(e.pointerId!=null)b.setPointerCapture(e.pointerId)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{e.preventDefault();if(['left','right','jump','defend'].includes(key))keys[key]=false})}
const mapping={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyJ:'punch',KeyK:'kick',KeyL:'special',Space:'special',ShiftLeft:'defend',ShiftRight:'defend'};
window.addEventListener('keydown',e=>{if(mode==='game'&&mapping[e.code]){e.preventDefault();if(e.repeat&&mapping[e.code]==='special')return;keys[mapping[e.code]]=true}});window.addEventListener('keyup',e=>{if(mode==='game'&&mapping[e.code]){e.preventDefault();if(['left','right','jump','defend'].includes(mapping[e.code]))keys[mapping[e.code]]=false}});window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',clearKeys);
