/* All durations use the simulation's 60 Hz clock. Effects never stack in strength.
   Resistance and wake-up invulnerability prevent repeated crowd-control locks. */
const SPECIAL_ADVANTAGES=[
 {rawDamage:31,guardStun:26,chip:.18,label:'Lluvia de objetos: presiona la guardia.'},
 {rawDamage:42,breakGuard:true,stun:40,label:'La pierna rompe la guardia y causa daño alto.'},
 {rawDamage:34,level:'overhead',launch:8,knockdown:42,label:'Ataque alto: lanza y derriba al rival.'},
 {rawDamage:32,slow:120,speed:.6,label:'El caramelo ralentiza el movimiento durante 2 s.'},
 {rawDamage:32,slow:150,speed:.65,label:'El líquido ralentiza el movimiento durante 2,5 s.'},
 {rawDamage:36,guardStun:27,chip:.22,label:'La picada presiona la guardia y causa daño parcial al bloquear.'},
 {rawDamage:34,knockdown:48,label:'La escoba derriba y abre espacio para reposicionarte.'},
 {rawDamage:38,label:'Remate de precisión: daño alto a distancia.'},
 {rawDamage:34,breakGuard:true,stun:38,label:'Los libros rompen la guardia.'},
 {rawDamage:30,slow:150,speed:.55,label:'La pintura ralentiza el movimiento durante 2,5 s.'},
 {rawDamage:29,stun:66,label:'El grito aturde hasta 1,1 s si conecta sin bloqueo.'},
 {rawDamage:30,push:110,guardStun:20,label:'La mascarilla empuja lejos y ayuda a salir del rincón.'}
];
const FINISHER_ADVANTAGES=[
 [{damage:1.9,guardStun:25,chip:.16,label:'Presiona la guardia y causa daño parcial al bloquear.'},{damage:1.8,knockdown:42,label:'Derriba al alcanzar los tobillos.'}],
 [{damage:2.1,knockdown:48,label:'Derriba con la onda de la pisada.'},{damage:2.4,breakGuard:true,stun:38,label:'Mordida que rompe la guardia.'}],
 [{damage:1.85,launch:7,label:'Lanza al rival hacia arriba.'},{damage:1.9,launch:10,knockdown:42,label:'Elevación alta y derribo al caer.'}],
 [{damage:2.35,push:80,label:'Daño alto y empuje con la pelota.'},{damage:1.85,knockdown:42,label:'Derriba con el caño por abajo.'}],
 [{damage:1.7,stun:54,label:'Aturde hasta 0,9 s si conecta sin bloqueo.'},{damage:1.9,guardStun:24,chip:.14,label:'Presiona la guardia con el estetoscopio.'}],
 [{damage:1.9,guardStun:28,chip:.22,label:'Tres facturas: presión y daño parcial al bloquear.'},{damage:2.1,breakGuard:true,label:'El maletín rompe la guardia.'}],
 [{damage:1.95,push:95,label:'Barre al rival lejos para ganar espacio.'},{damage:1.8,knockdown:48,label:'Derribo con la escoba a ras del suelo.'}],
 [{damage:2.5,label:'Daño alto con la pelota dorada.'},{damage:2.05,breakGuard:true,label:'El remate descendente rompe la guardia.'}],
 [{damage:2.2,breakGuard:true,label:'El libro rompe la guardia.'},{damage:1.9,guardStun:26,chip:.18,label:'Presiona con los expedientes y causa daño parcial al bloquear.'}],
 [{damage:1.85,slow:120,speed:.6,label:'Ralentiza el movimiento durante 2 s.'},{damage:1.8,knockdown:42,label:'La mancha estalla por debajo y derriba.'}],
 [{damage:1.65,stun:60,label:'Aturde hasta 1 s si conecta sin bloqueo.'},{damage:1.85,knockdown:42,label:'La onda de suelo derriba.'}],
 [{damage:1.8,slow:120,speed:.65,label:'El tubo frena el movimiento durante 2 s.'},{damage:2.1,push:110,label:'Empuje fuerte para separar al rival.'}]
];
function finisherAdvantage(a){return FINISHER_ADVANTAGES[a.id][a.finisherVariant===1?1:0];}
function specialDamage(a){return SPECIAL_ADVANTAGES[a.id].rawDamage*(a.ex?1.45:1);}
function movementMultiplier(a){return a.slow>0?a.slowSpeed||1:1;}
function clearAfflictions(a){a.slow=0;a.slowSpeed=1;a.daze=0;a.knockdown=0;}
function tickAfflictions(a,dt){for(const key of ['slow','daze','knockdown','controlResist'])a[key]=Math.max(0,(a[key]||0)-dt);if(!a.slow)a.slowSpeed=1;}
function advantageFeedback(target,label,color='#ffe56a'){effects.push({x:target.x,y:150-target.y,t:46,text:label,color});}
function applyAdvantage(target,attacker,p){
 if(!p||target.lastBlocked||target.hp<=0)return;
 if(p.slow){target.slow=Math.max(target.slow||0,p.slow);target.slowSpeed=Math.min(target.slowSpeed||1,p.speed);advantageFeedback(target,'¡RALENTIZADO!','#e799ff');}
 const canControl=!(target.controlResist>0);
 if(!canControl&&(p.stun||p.knockdown||p.launch))advantageFeedback(target,'RESISTE EL EFECTO','#a8d9ff');
 if(canControl&&(p.stun||p.knockdown||p.launch)){
  if(p.stun){target.stun=Math.max(target.stun,p.stun);target.daze=p.stun;target.invuln=Math.max(target.invuln,p.stun-18);advantageFeedback(target,'¡ATURDIDO!','#ffe174');}
  if(p.launch){target.vy=p.launch;advantageFeedback(target,'¡AL AIRE!','#a2f6ff');}
  if(p.knockdown){target.knockdown=p.knockdown;target.stun=Math.max(target.stun,p.knockdown);target.invuln=Math.max(target.invuln,p.knockdown-12);target.throwImmune=Math.max(target.throwImmune,p.knockdown+16);advantageFeedback(target,'¡DERRIBO!','#ffc376');}
  target.controlResist=180;
 }
 if(p.push>=80){target.knockback=attacker.dir*3;advantageFeedback(target,'¡FUERA!','#9bf5ff');}
}
function drawAdvantageStatus(a){
 if(!(a.slow>0||a.daze>0||a.knockdown>0))return;
 const label=a.daze>0?'ATURDIDO':a.knockdown>0?'DERRIBADO':'LENTO';
 ctx.save();ctx.textAlign='center';ctx.font='bold 12px Arial';const y=clamp(105-a.y,30,105);ctx.lineWidth=4;ctx.strokeStyle='#23072f';ctx.fillStyle=a.slow>0?'#ecaaff':'#ffe479';ctx.strokeText(label,a.x,y);ctx.fillText(label,a.x,y);
 if(a.daze>0){ctx.fillStyle='#ffe479';for(let n=0;n<3;n++){const q=frame*.1+n*Math.PI*2/3;ctx.beginPath();ctx.arc(a.x+Math.cos(q)*24,y-14+Math.sin(q)*5,3,0,Math.PI*2);ctx.fill();}}
 if(a.slow>0){ctx.fillStyle='#c656ee77';for(let n=0;n<3;n++){ctx.beginPath();ctx.ellipse(a.x-20+n*20,461-a.y,7,3,0,0,Math.PI*2);ctx.fill();}}ctx.restore();
}
function finisherDamageLabel(id,v){const last=COMBO_ROUTES[id][v][1][2],base=(last==='K'?8:6)+fighters[id][3]*.8;return Math.round(base*FINISHER_ADVANTAGES[id][v].damage*.89*DAMAGE_SCALE);}

// Measure the existing pain poses once, then place a rigidly rotated body on the
// floor using its real alpha bounds. No limb scaling and no clipping at walls.
const KNOCKDOWN_BOUNDS=[];
function prepareKnockdownBounds(){const c=document.createElement('canvas');c.width=c.height=700;const x=c.getContext('2d',{willReadFrequently:true});for(let id=0;id<12;id++){x.clearRect(0,0,700,700);const [sheet,row]=actionMap[id];SpriteAtlas.draw(x,actionAtlases[sheet],row,5,350,600,330);const d=x.getImageData(0,0,700,700).data;let l=700,r=0,t=700,b=0;for(let y=0;y<700;y++)for(let px=0;px<700;px++)if(d[(y*700+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,y);b=Math.max(b,y);}KNOCKDOWN_BOUNDS[id]={left:l-350,right:r-350,top:t-600,bottom:b-600};}c.width=c.height=0;}
function drawKnockdown(a){const b=KNOCKDOWN_BOUNDS[a.id];if(!b)return;const sign=(a.x>480?-1:1)*a.dir,min=sign>0?-b.bottom:b.top,max=sign>0?-b.top:b.bottom,center=(min+max)/2,half=(max-min)/2,worldCenter=clamp(a.x,half+12,948-half),localCenter=(worldCenter-a.x)*a.dir,bottom=sign>0?b.right:-b.left;ctx.save();ctx.translate(localCenter-center,-bottom);ctx.rotate(sign*Math.PI/2);const [sheet,row]=actionMap[a.id];drawSprite(actionAtlases[sheet],row,5,0,0,330);ctx.restore();}
