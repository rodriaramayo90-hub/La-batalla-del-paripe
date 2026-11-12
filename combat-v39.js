/* Bounded three-hit routes. P = punch, K = kick, L = crouching kick. */
const COMBO_ROUTES=[
 [['Psicología inversa','PPK'],['Taller de arte','LKP']],
 [['Máscara de Buceo','PKK'],['Colmillo corto','LPP']],
 [['Cadena acrobática','PKP'],['Propietaria','LPK']],
 [['Basic Fit','PPK'],['Home office','KLP']],
 [['Café de especialidad','KPP'],['Consulta urgente','PLK']],
 [['Recargo triple','PPK'],['Bolo fecal','LKP']],
 [['Turno de limpieza','KPK'],['Hoy tengo fútbol','LLP']],
 [['Punto de oro','PKP'],['Coche de empresa','KLP']],
 [['Evidencia contundente','PPK'],['Ataque IA','KLP']],
 [['Trazo continuo','PKP'],['Atención al cliente','LLK']],
 [['Crescendo','PPK'],['Eco rasante','LPK']],
 [['Sustancia ilegal','KPP'],['Cambio de turno','LLK']]
];
function moveToken(a,type,low=a.crouching){return type==='punch'?'P':type==='kick'?(low&&a.y===0?'L':'K'):'S'}
function attackLevel(a){return a.level||'mid'}
function guardCovers(a,level){return a.blocking&&(level==='mid'||level==='high'||level==='low'&&a.crouching||level==='overhead'&&!a.crouching)}
function routePrefix(a,token){return (a.moveAge>0?a.moveTrail||'':'')+token}
function recordCombo(a,b){
 if(a.attackType==='grab'||a.attackType==='special'){a.hitTrail='';return;}
 a.hitTrail=(a.chainDepth>0?a.hitTrail:'')+a.moveToken;a.hitAge=70;
 const route=a.finisher?COMBO_ROUTES[a.id][a.finisherVariant]:null;
 if(route){announcement=route[0].toUpperCase();announceTime=65;a.comboFlash=30;if(!practice){hitstop=Math.max(hitstop,9);shake=Math.max(shake,7);}effects.push({x:b.x,y:150-b.y,t:55,text:route[0].toUpperCase(),color:'#ffe43a'});sfx('combo',{count:3});a.routeCompleted=route[0];}
}
function breakGrab(a,b){for(const unit of [a,b]){unit.attack=0;unit.stun=0;unit.blockstun=0;unit.grabCool=65;unit.throwImmune=65;unit.invuln=16;unit.knockback=unit===a?-a.dir*3:a.dir*3;unit.hitTrail='';unit.moveTrail='';unit.moveAge=0;}effects.push({x:(a.x+b.x)/2,y:235,t:42,text:'¡ZAFADA!',color:'#9cf7ff'});sfx('guard');return true;}
function beginGrab(a,b){
 if(!a||a.hp<=0||ending||a.y>0||a.vy>0||a.escaping>0)return false;
 if(b&&b.attackType==='grab'&&b.attack>0&&b.attackLength-b.attack<=12&&Math.abs(a.x-b.x)<100&&a.stun<=0)return breakGrab(a,b);
 if(a.attack>0||a.stun>0||a.blockstun>0||a.grabCool>0)return false;
 if(a===player)cancelCharges();a.blocking=false;a.crouching=false;a.power=false;a.attackType='grab';a.attackLength=38;a.attack=38;a.hit=false;a.connected=false;a.grabCool=72;a.hitTrail='';a.moveTrail='';a.moveAge=0;a.chainDepth=0;sfx('punch');return true;
}
function resolveGrab(a,b){
 if(a.hit||a.attackLength-a.attack<9)return;a.hit=true;
 if(!b||b.y>10||b.escaping>0||b.stun>0||b.throwImmune>0||Math.abs(a.x-b.x)>88||Math.sign(b.x-a.x)!==a.dir)return;
 if(hit(b,17,a.dir*75,-4)){b.throwImmune=100;b.stun=30;b.vy=5;b.hitTrail='';a.connected=true;effects.push({x:b.x,y:210,t:35,text:'¡AGARRE!',color:'#ffbc65'});}
}
function posture(a,down){if(!a||a.stun>0||a.blockstun>0)return;if(a.attack>0){if(a.y>0)a.crouching=false;return;}a.crouching=!!down&&a.y===0&&!a.escaping&&a.attack<=0;}
function combatSheet(im){const cells=[];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;for(let id=0;id<12;id++){const x0=Math.round((id%4)*c.width/4),x1=Math.round((id%4+1)*c.width/4),y0=Math.round(Math.floor(id/4)*c.height/3),y1=Math.round((Math.floor(id/4)+1)*c.height/3);let l=x1,r=x0,t=y1,b=y0;for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++)if(d[(py*c.width+px)*4+3]>32){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py)}cells.push({x:l,y:t,w:r-l+1,h:b-t+1});}c.width=c.height=0;return cells;}
let crouchCells,grabCells,lowPunchCells,lowKickCells;
function drawCombatCell(im,cells,id,height){if(!cells)return;const a=cells[id],w=a.w/a.h*height;ctx.drawImage(im,a.x,a.y,a.w,a.h,-w/2,-height,w,height);attachDiveMaskToCell(im);}
function comboLabel(seq){return seq.split('').map(c=>c==='P'?'J':c==='L'?'↓ + K':'K').join(' → ')}
function combatInstructions(){return '<p class="combat-guide">↓: agacharse · 🛡 + ↓: defensa baja · Salto + patada: ataque alto · F o 🛡 + piña: agarrar / zafarse · J: piña · K: patada · ↓ + K: patada baja</p>';}

// Preserve repeated taps and the stance at the instant each button is released.
const inputQueue=[];
function clearActionBuffer(){inputQueue.length=0;for(const key of Object.keys(queued)){queued[key]=0;queuedPower[key]=false;}}
function consumeInput(a,b,actions){const next=actions[0];if(!next)return false;if(strike(a,b,next.type,!!next.power,next.low??a.crouching)){actions.shift();return true;}return false;}
function ageInputBuffer(dt){for(const action of inputQueue)action.ttl-=dt;while(inputQueue.length&&inputQueue[0].ttl<=0)inputQueue.shift();for(const key of Object.keys(queued))queued[key]=inputQueue.some(x=>x.type===key)?1:0;}
function practiceComboHint(a){if(a.moveAge>0&&a.routePerformed&&a.moveTrail.length===3)return '¡'+a.routePerformed+'! · '+finisherAdvantage(a).label;const progress=a.moveAge>0?a.moveTrail:'';const routes=COMBO_ROUTES[a.id].filter(r=>!progress||r[1].startsWith(progress));return (progress?'Secuencia: '+comboLabel(progress)+' · Seguís con: ':'Practicá: ')+(routes.length?routes:COMBO_ROUTES[a.id]).map(r=>comboLabel(progress?r[1].slice(progress.length):r[1])).join(' / ');}
function comboMoveToken(a,type,low){const token=moveToken(a,type,low),prefix=a.moveAge>0?a.moveTrail||'':'';return type==='kick'&&prefix.length===2&&COMBO_ROUTES[a.id].some(r=>r[1]===prefix+'K')?'K':token;}
function routeCanContinue(a,type,low){return !a.power&&['punch','kick'].includes(type)&&a.moveAge>0&&(a.moveTrail||'').length>0&&a.moveTrail.length<3&&a.chainDepth<2&&COMBO_ROUTES[a.id].some(r=>r[1].startsWith(routePrefix(a,comboMoveToken(a,type,low))));}
function commitComboMove(a,type,chained){
 if(!['punch','kick'].includes(type)){a.moveTrail='';a.moveAge=0;a.routePerformed='';return;}
 if(!chained){a.routeCompleted='';a.routePerformed='';}
 a.moveTrail=(chained?a.moveTrail:'')+a.moveToken;a.moveAge=a.finisher?90:48;
 if(a.finisher){a.routePerformed=COMBO_ROUTES[a.id][a.finisherVariant][0];announcement=a.routePerformed.toUpperCase();announceTime=75;}
}

// Each route has three newly authored poses: load, contact, recovery.
const FINISHER_ART_MAP=[[0,0],[0,1],[1,0],[4,0],[1,1],[1,2],[2,0],[3,0],[4,1],[3,1],[2,2],[3,2]];
const FINISHER_PROFILES=[
 [{style:'reversePsychology',level:'mid',hop:0,advance:18,lift:0,description:'Señala al rival y le invierte temporalmente izquierda y derecha.'},{style:'artWorkshop',projectileKind:-9,level:'mid',hop:0,advance:18,lift:0,description:'Lanza un pequeño pintor animado con pincel y paleta.'}],
 [{style:'diveMask',level:'mid',hop:0,advance:0,lift:0,description:'Se coloca la máscara de buceo y recibe menos daño mientras la lleva puesta.'},{style:'bite',level:'mid',hop:0,advance:30,lift:0,description:'Se abalanza rugiendo y proyecta unas mandíbulas de T-Rex que muerden.'}],
 [{style:'cartwheel',level:'overhead',hop:0,advance:32,lift:4,description:'Enlaza apoyo de manos, rueda lateral y aterrizaje ofensivo.'},{style:'doorKey',projectileKind:-7,level:'mid',hop:0,advance:15,lift:0,description:'Lanza una llave de puerta metálica que cruza la arena.'}],
 [{style:'basicFit',level:'mid',hop:0,advance:26,lift:0,description:'Blande la mochila gris y naranja de Basic Fit y golpea con ella.'},{style:'homeOffice',level:'overhead',hop:0,advance:26,lift:0,description:'Levanta un ordenador portátil y lo descarga sobre el rival.'}],
 [{style:'coffee',level:'mid',hop:0,advance:24,lift:0,description:'Inclina la taza y echa café hirviendo sobre el rival.'},{style:'consult',level:'mid',hop:0,advance:26,lift:0,description:'Despliega el estetoscopio y lo hace restallar frente al rival.'}],
 [{style:'receipts',level:'mid',hop:0,advance:24,lift:0,description:'Despliega y lanza tres facturas de recargo de una vez.'},{style:'mousse',projectileKind:-6,level:'mid',hop:0,advance:15,lift:0,description:'Arroja una bola marrón pastosa, con textura de mousse de chocolate.'}],
 [{style:'broom',level:'mid',hop:0,advance:28,lift:0,description:'Da una pasada amplia de escoba y levanta una nube de polvo.'},{style:'footballMatch',projectileKind:-8,level:'low',hop:0,advance:20,lift:0,description:'Arma la pierna y dispara una pelota de fútbol contra el rival.'}],
 [{style:'golden',level:'mid',hop:0,advance:26,lift:1,description:'Arma un golpe de pala y dispara una pelota dorada.'},{style:'companyCar',level:'mid',hop:0,advance:26,lift:0,description:'Sujeta un volante de coche con ambas manos y golpea de frente.'}],
 [{style:'evidence',level:'mid',hop:0,advance:24,lift:0,description:'Presenta la evidencia con un golpe de su grueso libro médico.'},{style:'aiArm',level:'mid',hop:0,advance:26,lift:0,description:'Extiende un brazo robótico y golpea con el puño mecánico.'}],
 [{style:'ribbon',level:'mid',hop:0,advance:26,lift:0,description:'Traza una línea de pintura continua con el pincel.'},{style:'rotaryPhone',level:'mid',hop:0,advance:25,lift:0,description:'Golpea con un teléfono antiguo de disco, base y auricular incluidos.'}],
 [{style:'crescendo',level:'mid',hop:0,advance:20,lift:0,description:'Toma aire y grita con ondas cada vez más grandes.'},{style:'groundEcho',level:'low',hop:0,advance:18,lift:0,description:'Se agacha y dirige el grito en ecos que recorren el suelo.'}],
 [{style:'leafCigar',level:'mid',hop:0,advance:24,lift:0,description:'Golpea con un cigarro casero enrollado en hojas verdes.'},{style:'handover',level:'mid',hop:0,advance:26,lift:0,description:'Cambia el maletín de mano y lo entrega de golpe hacia el rival.'}]
];
function finisherProfile(a){return FINISHER_PROFILES[a.id][a.finisherVariant===1?1:0];}
function finisherData(a){const p=finisherProfile(a);return {total:56,start:17,end:24,stun:32,push:26,level:p.level};}
function finisherPose(a){const e=a.attackLength-a.attack;return e<13?0:e<33?1:2;}
function finisherRise(a){if(!a.finisher||a.attack<=0||a.stun>0)return 0;const e=a.attackLength-a.attack;return finisherProfile(a).hop*Math.sin(Math.PI*clamp((e-7)/18,0,1));}
function finisherStep(a){if(!a.finisher||a.attack<=0||a.stun>0)return;const e=a.attackLength-a.attack,p=finisherProfile(a),t=clamp((e-7)/15,0,1),advance=p.advance*(t*t*(3-2*t));a.x+=(advance-(a.finisherAdvance||0))*a.dir;a.finisherAdvance=advance;if(e>=14&&!a.finisherSound){a.finisherSound=true;sfx('release',{id:a.id,pan:a.x/480-1});}}
function finisherHitbox(a){const p=finisherProfile(a),low=p.level==='low';const x1=a.x+a.dir*25,x2=a.x+a.dir*195;return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:(low?366:p.style==='sky'?150:210)-a.y,bottom:(low?453:420)-a.y};}
function drawFinisher(a,size){
 const [sheet,row,base]=finisherRenderCell(a),col=base+finisherPose(a);
 ctx.save();ctx.translate(0,-finisherRise(a));drawSprite(finisherAtlases[sheet],row,col,0,0,size*1.04);ctx.restore();
 drawFinisherTheme(a,a.attackLength-a.attack);
}

// Objects are drawn in the fighter's local coordinates, so they mirror with the
// body. The travel reaches the saved contact position during the active frames.
function finisherContact(a){return clamp(((a.finisherImpactX??a.x+a.dir*155)-a.x)*a.dir,65,210);}
function drawFootball(x,y,r=22,spin=0,gold=false){ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.fillStyle=gold?'#ffe244':'#fff9de';ctx.strokeStyle=gold?'#a66a10':'#192039';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=gold?'#b88614':'#202737';for(let n=0;n<6;n++){const angle=n*Math.PI/3,px=n?Math.cos(angle)*r*.72:0,py=n?Math.sin(angle)*r*.72:0;ctx.beginPath();for(let k=0;k<5;k++){const q=k*Math.PI*2/5;ctx.lineTo(px+Math.cos(q)*r*.23,py+Math.sin(q)*r*.23);}ctx.closePath();ctx.fill();}ctx.restore();}
function drawPaper(x,y,angle=0,label='€',color='#fff4cf'){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.strokeStyle='#3b254a';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-18,-25,36,50,3);ctx.fill();ctx.stroke();ctx.fillStyle='#692b79';ctx.font='bold 19px Arial';ctx.textAlign='center';ctx.fillText(label,0,-3);ctx.lineWidth=1.5;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(-11,6+n*5);ctx.lineTo(10,6+n*5);ctx.stroke();}ctx.restore();}
function drawDust(reach,t,low=false){ctx.save();ctx.fillStyle='#efd4a5';for(let n=0;n<10;n++){ctx.globalAlpha=(1-t)*.55;const x=reach*(n/10)+t*25,y=(low?-9:-48)-Math.sin(n*3.2)*12-t*25;ctx.beginPath();ctx.ellipse(x,y,6+n%4+t*7,4+n%3+t*5,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawSoundWaves(reach,t,ground=false){ctx.save();ctx.strokeStyle='#f18cff';ctx.fillStyle='#ffe778';ctx.lineWidth=4;const count=ground?4:5;for(let n=0;n<count;n++){const q=clamp(t*1.6-n*.14,0,1);if(!q)continue;const x=35+(reach+45)*q,y=ground?-27:-225;ctx.globalAlpha=(1-q*.6);ctx.beginPath();ctx.ellipse(x,y,ground?12:14+q*12,ground?22:27+q*75,0,-1.35,1.35);ctx.stroke();if(!ground&&n%2===0){ctx.font='bold '+(20+q*14)+'px serif';ctx.fillText('♪',x-7,y-30-q*55);}}if(ground){ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(35,-125);ctx.quadraticCurveTo(65,-30,reach+25,-22);ctx.stroke();}ctx.restore();}
function drawFinisherTheme(a,e){
 const p=finisherProfile(a),style=p.style,r=finisherContact(a),t=clamp((e-11)/6,0,1),tail=clamp((e-17)/23,0,1);if(e<9||e>40)return;
 ctx.save();ctx.globalAlpha*=Math.min(1,(e-8)/4)*(1-tail*.8);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle=fighters[a.id][7];ctx.fillStyle=fighters[a.id][7];
 if(['diveMask','doorKey','mousse','coffee','leafCigar','footballMatch','rotaryPhone','companyCar','reversePsychology','artWorkshop'].includes(style)){drawThemedFinisherEffect(a,e,r,t,tail);ctx.restore();return;}
 switch(style){
 case 'recycle':for(let n=0;n<3;n++){const u=clamp(t-n*.12,0,1);drawProp(n===2?5:n,45+(r-45)*u,-175-Math.sin(u*Math.PI)*45+(n-1)*26,45,e*.11+n);}break;
 case 'trashSweep':for(let n=0;n<5;n++)drawProp([0,1,3,5,0][n],40+(r-30)*t+n*7,-15-Math.sin(t*Math.PI)*(12+n*5),26,e*.1+n);drawDust(r,t,true);break;
 case 'jurassic':if(e>=15){ctx.save();ctx.translate(r*.65,-5);ctx.scale(1,clamp((e-14)/3,0,1));ctx.fillStyle='#ffd53b';ctx.strokeStyle='#825326';ctx.beginPath();ctx.ellipse(0,0,25,13,0,0,Math.PI*2);ctx.fill();for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(n*19,-5);ctx.lineTo(n*22-9,-45-Math.abs(n)*4);ctx.lineTo(n*22+10,-15);ctx.closePath();ctx.fill();}ctx.lineWidth=3;for(let n=0;n<5;n++){ctx.beginPath();ctx.moveTo(Math.cos(n*1.7)*25,0);ctx.lineTo(Math.cos(n*1.7)*(45+tail*65),Math.sin(n*1.7)*14);ctx.stroke();}ctx.restore();drawDust(r,tail,true);}break;
 case 'bite':{const frame=e<16?0:e<19?1:2,w=biteArt.width/3,h=biteArt.height;ctx.globalAlpha*=.82;const x=85+r*.48*t;ctx.drawImage(biteArt,frame*w,0,w,h,x-90,-315,180,180);break;}
 case 'cartwheel':if(e<31){ctx.strokeStyle='#ffe86b';ctx.lineWidth=3;for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(15,-100,82+n*10,-2.6+t*.6,-.3+t*.6);ctx.stroke();}}break;
 case 'sky':ctx.strokeStyle='#ffd64b';for(let n=0;n<4;n++){ctx.beginPath();ctx.moveTo(-30+n*22,-10);ctx.lineTo(-30+n*22,-70-t*200);ctx.stroke();}break;
 case 'basicFit':ctx.strokeStyle='#ff9a32';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(65,-160,75,35,-.25,-1.4,.9);ctx.stroke();break;
 case 'homeOffice':ctx.strokeStyle='#a9d7f1';for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(45+n*18,-295);ctx.lineTo(95+n*18,-175);ctx.stroke();}break;
 case 'aiArm':ctx.strokeStyle='#6ee8ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(40,-215);ctx.lineTo(55,-205);ctx.lineTo(67,-215);ctx.lineTo(79,-205);ctx.lineTo(r,-215);ctx.stroke();ctx.fillStyle='#d8fbff';for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(r+8+n*6,-207+Math.sin(e+n)*7,2.5,0,Math.PI*2);ctx.fill();}break;
 case 'football':drawFootball(55+(r-55)*t,-21-Math.sin(t*Math.PI)*100-t*100,21,e*.22);break;
 case 'nutmeg':drawFootball(40+(r+40)*t,-20,20,e*.3);ctx.strokeStyle='#fff0ad';for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(40+(r-40)*t-n*13,-8);ctx.lineTo(5+(r-40)*t-n*13,-8);ctx.stroke();}break;
 case 'dose':ctx.fillStyle='#51d4f5';for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(100+(r-100)*t+n*6,-175+Math.sin(e*.5+n)*8,3+n%2,0,Math.PI*2);ctx.fill();}break;
 case 'consult':ctx.strokeStyle='#9eeefa';ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(r,-180,18+n*7,-1.1,1.1);ctx.stroke();}break;
 case 'receipts':for(let n=0;n<3;n++)drawPaper(50+(r-40)*t+(n-1)*10,-195+(n-1)*35,Math.sin(e*.13+n)*.4,'€');break;
 case 'triage':ctx.strokeStyle='#ffedef';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(45,-190);ctx.lineTo(70,-190);ctx.lineTo(80,-225);ctx.lineTo(94,-155);ctx.lineTo(108,-205);ctx.lineTo(119,-190);ctx.lineTo(r+10,-190);ctx.stroke();break;
 case 'broom':drawDust(r,clamp((e-12)/25,0,1));ctx.strokeStyle='#fff0a3';ctx.beginPath();ctx.ellipse(48,-130,105,42,-.2,-1.2,1.1);ctx.stroke();break;
 case 'broomLow':drawDust(r,clamp((e-12)/25,0,1),true);ctx.strokeStyle='#fff0a3';ctx.beginPath();ctx.moveTo(45,-12);ctx.quadraticCurveTo(r,-28,r+30,-6);ctx.stroke();break;
 case 'golden':drawFootball(60+(r-60)*t,-190-Math.sin(t*Math.PI)*20,19,e*.2,true);ctx.strokeStyle='#ffe259';for(let n=0;n<5;n++){const x=40+(r-40)*t-n*10;ctx.beginPath();ctx.moveTo(x,-190);ctx.lineTo(x-8,-190+Math.sin(n)*7);ctx.stroke();}break;
 case 'dropSmash':{const u=clamp((e-9)/6,0,1),v=clamp((e-14)/3,0,1),x=e<14?55+u*40:95+(r-95)*v,y=e<14?-65-Math.sin(u*Math.PI)*50:-300+v*115;drawFootball(x,y,18,e*.15,true);ctx.strokeStyle='#fff3af';if(e>=14){ctx.beginPath();ctx.moveTo(95,-300);ctx.lineTo(x,y);ctx.stroke();}break;}
 case 'evidence':ctx.fillStyle='#ffdf5b';for(let n=0;n<5;n++){const q=n*Math.PI*2/5;ctx.beginPath();ctx.moveTo(r+Math.cos(q)*24,-190+Math.sin(q)*24);ctx.lineTo(r+Math.cos(q)*42,-190+Math.sin(q)*42);ctx.stroke();}drawPaper(r-20,-140-tail*35,.4,'✓');break;
 case 'review':for(let n=0;n<3;n++)drawPaper(65+(r-55)*t,-180+(n-1)*35,(n-1)*.25,'✓',['#fff1a9','#e9b9ff','#bcf2ce'][n]);break;
 case 'ribbon':ctx.lineWidth=7;for(let n=0;n<3;n++){ctx.strokeStyle=['#ff41cd','#17d1ef','#ffe63f'][n];ctx.beginPath();ctx.moveTo(80,-180+n*7);ctx.bezierCurveTo(100,-235+n*7,r-20,-125+n*7,r+10,-195+n*7);ctx.stroke();}break;
 case 'paintTrap':{ctx.fillStyle='#da3feb';ctx.beginPath();ctx.ellipse(50+(r-50)*t,-5,20+t*25,7,0,0,Math.PI*2);ctx.fill();if(e>=16){for(let n=0;n<13;n++){ctx.fillStyle=['#f13ad2','#12ccf0','#f9e92f'][n%3];const q=(n+1)*2.399;ctx.beginPath();ctx.ellipse(r+Math.cos(q)*30*tail,-12-(1-tail)*100*Math.abs(Math.sin(q)),6,12,q,0,Math.PI*2);ctx.fill();}}break;}
 case 'crescendo':drawSoundWaves(r,clamp((e-10)/24,0,1),false);break;
 case 'groundEcho':drawSoundWaves(r,clamp((e-10)/24,0,1),true);drawDust(r,tail,true);break;
 case 'closedLoop':ctx.strokeStyle='#6ceaff';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(65+(r-60)*t,-180,24+t*8,44,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#d1faff';for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(r-20-n*12,-170-n*8);ctx.lineTo(r-35-n*12,-170-n*8);ctx.stroke();}break;
 case 'handover':ctx.strokeStyle='#8ae6fa';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-50,-95);ctx.bezierCurveTo(0,-180,60,-190,r,-165);ctx.stroke();ctx.beginPath();ctx.moveTo(r-12,-180);ctx.lineTo(r,-165);ctx.lineTo(r-18,-158);ctx.stroke();break;
 }
 ctx.restore();
}
