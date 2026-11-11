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
 a.hitTrail=(a.chainDepth>0?a.hitTrail:'')+a.moveToken;a.hitAge=48;
 const route=COMBO_ROUTES[a.id].find(r=>r[1]===a.hitTrail);
 if(route){if(COMBO_STYLE[a.id].lift)b.vy=COMBO_STYLE[a.id].lift;effects.push({x:b.x,y:150-b.y,t:55,text:route[0].toUpperCase(),color:'#ffe43a'});sfx('combo',{count:3});a.routeCompleted=route[0];}
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
let crouchCells,grabCells;
function drawCombatCell(im,cells,id,height){if(!cells)return;const a=cells[id],w=a.w/a.h*height;ctx.drawImage(im,a.x,a.y,a.w,a.h,-w/2,-height,w,height);}
function comboLabel(seq){return seq.split('').map(c=>c==='P'?'J':c==='L'?'↓ + K':'K').join(' → ')}
function combatInstructions(){return '<p class="combat-guide">↓: agacharse · 🛡 + ↓: defensa baja · Salto + patada: ataque alto · F o 🛡 + piña: agarrar / zafarse · J: piña · K: patada · ↓ + K: patada baja</p>';}
