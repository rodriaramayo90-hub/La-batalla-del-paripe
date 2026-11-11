/* Bounded three-hit routes. P = punch, K = kick, L = crouching kick. */
const COMBO_ROUTES=[
 [['Reciclaje express','PPK'],['Barrido de barrio','LKP']],
 [['Pisada jurásica','PKK'],['Colmillo corto','LPP']],
 [['Cadena acrobática','PKP'],['Suelo y cielo','LPK']],
 [['Toque y definición','PPK'],['Caño de barrio','KLP']],
 [['Dosis de impacto','KPP'],['Consulta urgente','PLK']],
 [['Recargo triple','PPK'],['Guardia de urgencias','LKP']],
 [['Turno de limpieza','KPK'],['Barrido de guardia','LLP']],
 [['Punto de oro','PKP'],['Dejada y remate','KLP']],
 [['Evidencia contundente','PPK'],['Revisión sistemática','KLP']],
 [['Trazo continuo','PKP'],['Mancha sorpresa','LLK']],
 [['Crescendo','PPK'],['Eco rasante','LPK']],
 [['Circuito cerrado','KPP'],['Cambio de turno','LLK']]
];
const COMBO_STYLE=[{damage:1.12,push:50},{damage:1.35,push:70},{damage:1.12,push:25,lift:4},{damage:1.18,push:45},{damage:1.2,push:35},{damage:1.22,push:30},{damage:1.15,push:65},{damage:1.18,push:55},{damage:1.25,push:35},{damage:1.15,push:25},{damage:1.12,push:75},{damage:1.18,push:40}];
function moveToken(a,type,low=a.crouching){return type==='punch'?'P':type==='kick'?(low&&a.y===0?'L':'K'):'S'}
function attackLevel(a){return a.level||'mid'}
function guardCovers(a,level){return a.blocking&&(level==='mid'||level==='high'||level==='low'&&a.crouching||level==='overhead'&&!a.crouching)}
function routePrefix(a,token){return (a.hitAge>0?a.hitTrail:'')+token}
function recordCombo(a,b){
 if(a.attackType==='grab'||a.attackType==='special'){a.hitTrail='';return;}
 a.hitTrail=(a.chainDepth>0?a.hitTrail:'')+a.moveToken;a.hitAge=70;
 const route=COMBO_ROUTES[a.id].find(r=>r[1]===a.hitTrail);
 if(route){announcement=route[0].toUpperCase();announceTime=65;a.comboFlash=30;if(!practice){hitstop=Math.max(hitstop,9);shake=Math.max(shake,7);}if(!practice){b.vy=finisherProfile(a).lift||0;b.knockback=a.dir*2.5;} effects.push({x:b.x,y:150-b.y,t:55,text:route[0].toUpperCase(),color:'#ffe43a'});sfx('combo',{count:3});a.routeCompleted=route[0];}
}
function breakGrab(a,b){for(const unit of [a,b]){unit.attack=0;unit.stun=0;unit.blockstun=0;unit.grabCool=65;unit.throwImmune=65;unit.invuln=16;unit.knockback=unit===a?-a.dir*3:a.dir*3;unit.hitTrail='';}effects.push({x:(a.x+b.x)/2,y:235,t:42,text:'¡ZAFADA!',color:'#9cf7ff'});sfx('guard');return true;}
function beginGrab(a,b){
 if(!a||a.hp<=0||ending||a.y>0||a.vy>0||a.escaping>0)return false;
 if(b&&b.attackType==='grab'&&b.attack>0&&b.attackLength-b.attack<=12&&Math.abs(a.x-b.x)<100&&a.stun<=0)return breakGrab(a,b);
 if(a.attack>0||a.stun>0||a.blockstun>0||a.grabCool>0)return false;
 if(a===player)cancelCharges();a.blocking=false;a.crouching=false;a.power=false;a.attackType='grab';a.attackLength=38;a.attack=38;a.hit=false;a.connected=false;a.grabCool=72;a.hitTrail='';a.chainDepth=0;sfx('punch');return true;
}
function resolveGrab(a,b){
 if(a.hit||a.attackLength-a.attack<9)return;a.hit=true;
 if(!b||b.y>10||b.escaping>0||b.stun>0||b.throwImmune>0||Math.abs(a.x-b.x)>88||Math.sign(b.x-a.x)!==a.dir)return;
 if(hit(b,17,a.dir*75,-4)){b.throwImmune=100;b.stun=30;b.vy=5;b.hitTrail='';a.connected=true;effects.push({x:b.x,y:210,t:35,text:'¡AGARRE!',color:'#ffbc65'});}
}
function posture(a,down){if(!a||a.stun>0||a.blockstun>0)return;if(a.attack>0){if(a.y>0)a.crouching=false;return;}a.crouching=!!down&&a.y===0&&!a.escaping&&a.attack<=0;}
function combatSheet(im){const cells=[];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;for(let id=0;id<12;id++){const x0=Math.round((id%4)*c.width/4),x1=Math.round((id%4+1)*c.width/4),y0=Math.round(Math.floor(id/4)*c.height/3),y1=Math.round((Math.floor(id/4)+1)*c.height/3);let l=x1,r=x0,t=y1,b=y0;for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++)if(d[(py*c.width+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py)}cells.push({x:l,y:t,w:r-l+1,h:b-t+1});}c.width=c.height=0;return cells;}
let crouchCells,grabCells,lowPunchCells,lowKickCells;
function drawCombatCell(im,cells,id,height){if(!cells)return;const a=cells[id],w=a.w/a.h*height;ctx.drawImage(im,a.x,a.y,a.w,a.h,-w/2,-height,w,height);}
function comboLabel(seq){return seq.split('').map(c=>c==='P'?'J':c==='L'?'↓ + K':'K').join(' → ')}
function combatInstructions(){return '<p class="combat-guide">↓: agacharse · 🛡 + ↓: defensa baja · Salto + patada: ataque alto · F o 🛡 + piña: agarrar / zafarse · J: piña · K: patada · ↓ + K: patada baja</p>';}

// Preserve repeated taps and the stance at the instant each button is released.
const inputQueue=[];
function clearActionBuffer(){inputQueue.length=0;for(const key of Object.keys(queued)){queued[key]=0;queuedPower[key]=false;}}
function consumeInput(a,b,actions){const next=actions[0];if(!next)return false;if(strike(a,b,next.type,!!next.power,next.low??a.crouching)){actions.shift();return true;}return false;}
function ageInputBuffer(dt){for(const action of inputQueue)action.ttl-=dt;while(inputQueue.length&&inputQueue[0].ttl<=0)inputQueue.shift();for(const key of Object.keys(queued))queued[key]=inputQueue.some(x=>x.type===key)?1:0;}
function practiceComboHint(a){if(a.hitAge>0&&a.routeCompleted&&a.hitTrail.length===3)return '¡'+a.routeCompleted+'! · SECUENCIA COMPLETADA';const progress=a.hitAge>0?a.hitTrail:'';const routes=COMBO_ROUTES[a.id].filter(r=>!progress||r[1].startsWith(progress));return (progress?'Secuencia: '+comboLabel(progress)+' · Seguís con: ':'Practicá: ')+(routes.length?routes:COMBO_ROUTES[a.id]).map(r=>comboLabel(progress?r[1].slice(progress.length):r[1])).join(' / ');}

// Each route has three newly authored poses: load, contact, recovery.
const FINISHER_ART_MAP=[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[3,0],[2,1],[3,1],[2,2],[3,2]];
const FINISHER_PROFILES=[
 [{style:'spin',hop:12,advance:24,lift:2},{style:'rise',hop:0,advance:24,lift:4}],
 [{style:'stomp',hop:38,advance:28,lift:4},{style:'rise',hop:12,advance:26,lift:7}],
 [{style:'tumble',hop:18,advance:32,lift:3},{style:'flight',hop:42,advance:34,lift:6}],
 [{style:'volley',hop:18,advance:30,lift:3},{style:'elbow',hop:0,advance:28,lift:2}],
 [{style:'palm',hop:0,advance:24,lift:0},{style:'knee',hop:28,advance:30,lift:5}],
 [{style:'spin',hop:12,advance:24,lift:2},{style:'rise',hop:8,advance:24,lift:5}],
 [{style:'thrust',hop:0,advance:26,lift:0},{style:'elbow',hop:0,advance:24,lift:3}],
 [{style:'racket',hop:0,advance:28,lift:2},{style:'rise',hop:12,advance:28,lift:5}],
 [{style:'book',hop:0,advance:24,lift:0},{style:'elbow',hop:8,advance:26,lift:4}],
 [{style:'paint',hop:0,advance:30,lift:0},{style:'spin',hop:18,advance:26,lift:3}],
 [{style:'sonic',hop:0,advance:24,lift:0},{style:'knee',hop:30,advance:30,lift:5}],
 [{style:'palm',hop:0,advance:24,lift:0},{style:'spin',hop:16,advance:28,lift:3}]
];
function finisherProfile(a){return FINISHER_PROFILES[a.id][a.finisherVariant===1?1:0];}
function finisherData(a){const p=finisherProfile(a);return {total:56,start:17,end:24,stun:32,push:26,level:['stomp','flight','volley','spin'].includes(p.style)?'overhead':'mid'};}
function finisherPose(a){const e=a.attackLength-a.attack;return e<13?0:e<33?1:2;}
function finisherRise(a){if(!a.finisher||a.attack<=0||a.stun>0)return 0;const e=a.attackLength-a.attack;return finisherProfile(a).hop*Math.sin(Math.PI*clamp((e-7)/31,0,1));}
function finisherStep(a){if(!a.finisher||a.attack<=0||a.stun>0)return;const e=a.attackLength-a.attack,p=finisherProfile(a),t=clamp((e-7)/15,0,1),advance=p.advance*(t*t*(3-2*t));a.x+=(advance-(a.finisherAdvance||0))*a.dir;a.finisherAdvance=advance;if(e>=14&&!a.finisherSound){a.finisherSound=true;sfx('release',{id:a.id,pan:a.x/480-1});}}
function finisherHitbox(a){const p=finisherProfile(a),rise=p.style==='rise'||p.style==='elbow',far=['thrust','racket','paint','flight','volley','spin'].includes(p.style)?195:160;const x1=a.x+a.dir*25,x2=a.x+a.dir*far;return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:(rise?165:235)-a.y,bottom:(rise?355:420)-a.y};}
function drawFinisher(a,size){
 const [sheet,row]=FINISHER_ART_MAP[a.id],col=(a.finisherVariant===1?3:0)+finisherPose(a),e=a.attackLength-a.attack;
 ctx.save();ctx.translate(0,-finisherRise(a));
 // Whole-body key poses; never stretch, shear, cut off or replace limbs.
 drawSprite(finisherAtlases[sheet],row,col,0,0,size*1.04);ctx.restore();
 if(reducedMotion)return;
 const p=finisherProfile(a),t=clamp((e-12)/20,0,1);if(e<12||e>32)return;
 ctx.save();ctx.globalAlpha*=Math.sin(t*Math.PI)*.8;ctx.strokeStyle=fighters[a.id][7];ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=8;ctx.lineWidth=6;ctx.lineCap='round';
 const rise=p.style==='rise'||p.style==='elbow';
 for(let n=0;n<3;n++){
  ctx.beginPath();
  if(rise){ctx.moveTo(22+n*8,-95);ctx.quadraticCurveTo(150+n*8,-140,108+n*8,-300);}
  else if(['palm','thrust','sonic','book','paint'].includes(p.style)){ctx.moveTo(40,-155-n*13);ctx.lineTo(180+n*12,-167-n*13);}
  else{ctx.ellipse(44,-155,120+n*10,70+n*7,-.3,-1.5,1.2);}
  ctx.stroke();
 }
 ctx.restore();
}
