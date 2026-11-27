/* Shared cinematic defense. All physical devices reach this controller through
 * the SAME humanInput() mapping as normal combat. Never read raw keys or pad
 * indices here: that used to break PS4 L1, Joy-Cons, and local player two.
 */
(function(){
'use strict';
const D={current:null,pressed:new Set(),held:new Map()};
const VALID=new Set(['defend','punch','kick','special','jump']);
const SEQUENCES={
 coqui:[127,215,304],
 malefica:[178,217,256],
 flor:[188,229,269],
 alca:[126,184]
};
function defenderSlot(){
 const d=D.current;
 if(!d||!d.b)return -1;
 if(d.b===player)return 0;
 if(typeof LOCAL!=='undefined'&&LOCAL.active&&d.b===enemy)return 1;
 return -1; // No player-controlled defender (CPU/practice).
}
/* The action is already normalized by local-v52.js/gamepads-v44.js.
 * Maintain per-action physical holds, so a held L1/Shift/touch cannot count
 * again until released, even if an alternate device is also held.
 */
function input(slot,action,isDown,source){
 if((slot!==0&&slot!==1)||!VALID.has(action))return;
 const id=typeof source==='string'&&source?source:'unknown';
 const key=slot+':'+action;
 let set=D.held.get(key);
 if(!set){set=new Set();D.held.set(key,set);}
 if(isDown){
  if(set.has(id))return;
  const first=set.size===0;
  set.add(id);
  if(first&&defenderSlot()===slot)D.pressed.add(action);
 }else{
  set.delete(id);
  if(!set.size)D.held.delete(key);
 }
}
function clearInput(){D.pressed.clear();D.held.clear();}
function start(type,a,b){
 D.current={type,a,b,t:0,success:0,step:0,errors:0,marks:new Set(),
  done:false,failedMarks:new Set(),
  seq:type==='flor'?['punch','kick','special']:['punch','kick','special','jump']};
 // Do NOT clear physical holds: pressing defense before the super starts is
 // not a new successful block; the player must release and press again.
 D.pressed.clear();
}
function tick(type,t){
 const d=D.current;
 if(!d||d.type!==type)return;
 d.t=t;
 const keys=D.pressed;
 if(defenderSlot()<0){keys.clear();return;}
 if(type==='coqui'||type==='malefica'){
  const threshold=type==='coqui'?9:8;
  for(const [i,at] of SEQUENCES[type].entries()){
   if(!d.marks.has(i)&&Math.abs(t-at)<=threshold&&keys.has('defend')){
    d.marks.add(i);d.success++;
   }
  }
 }
 // Swiss passport control: three SEPARATE timed action checks.
 // Pressing all three together or a wrong key fails the current checkpoint.
 // A held button never advances a second checkpoint (input() debounces it).
 if(type==='flor'){
  const sequence=SEQUENCES.flor;
  for(let i=0;i<sequence.length;i++){
   const at=sequence[i];
   if(d.marks.has(i)||d.failedMarks.has(i))continue;
   if(Math.abs(t-at)>12||keys.size===0)continue;
   if(keys.size===1&&keys.has(d.seq[i])){
    d.marks.add(i);d.success++;
   }else{
    d.failedMarks.add(i);d.errors++;
   }
  }
 }
 if(type==='alca')for(const [i,at] of SEQUENCES.alca.entries()){
  if(!d.marks.has(i)&&t>=at-13&&t<=at+5&&keys.has('defend')){
   d.marks.add(i);d.success++;
  }
 }
 if(type==='berga'&&t>=250&&t<=276&&!d.done&&keys.has('defend')){
  d.done=true;d.success=Math.abs(t-270)<=5?2:1;
 }
 if(type==='trex'&&t>=157&&t<=174&&!d.done&&keys.has('defend')){
  d.done=true;d.success=Math.abs(t-169)<=5?2:1;
 }
 if(type==='drapie'&&t>=80&&t<=244&&d.step<4){
  if(keys.has(d.seq[d.step]))d.step++;
  else if([...keys].some(k=>d.seq.includes(k)))d.errors++;
 }
 keys.clear();
}
function result(type){
 const d=D.current;
 if(!d||d.type!==type)return 'fail';
 if(type==='coqui'||type==='malefica')
  return d.success===3?'perfect':d.success>=1?'partial':'fail';
 if(type==='flor')
  return d.success===3&&d.errors===0?'perfect':d.success>=1?'partial':'fail';
 if(type==='berga'||type==='trex')
  return d.success===2?'perfect':d.success===1?'partial':'fail';
 if(type==='alca')
  return d.success===2?'perfect':d.success===1?'partial':'fail';
 return d.step===4&&d.errors===0?'perfect':d.step>=2?'partial':'fail';
}
function multiplier(type){return {perfect:0,partial:.5,fail:1}[result(type)];}
function notice(type){
 const d=D.current;
 if(!d||d.type!==type||d.announced)return;
 d.announced=true;
 const r=result(type);
 if(r==='perfect'){
  announcement='¡Te cabió! Defensa perfecta';announceTime=0;
  effects.push({x:d.b?.x||480,y:160,t:90,text:'¡Te cabió! Defensa perfecta',color:'#a3ffd2'});
 }else if(r==='partial'){
  announcement='¡DEFENSA PARCIAL!';announceTime=0;
 }
}
function draw(type,c,t){
 const d=D.current;
 if(!d||d.type!==type||defenderSlot()<0)return;
 let msg='',progress='';
 if(type==='malefica'&&t>=155&&t<284){
  msg='🛡 DEFENDÉ CADA ONDA DE RISA (3 VECES)';
  progress=[0,1,2].map(i=>d.marks.has(i)?'✓':'○').join('    ');
 }else if(type==='coqui'&&t>=105&&t<316){
  msg='🛡 DEFENDÉ: PINTURA, POLVO Y PERFIL (3 VECES)';
  progress=[0,1,2].map(i=>d.marks.has(i)?'✓':'○').join('    ');
 }else if(type==='flor'&&t>=159&&t<288){
  const codes=['□','△','○'],names=['GOLPE','PATADA','ESPECIAL'];
  const times=SEQUENCES.flor;
  let active=times.findIndex((at,i)=>t>=at-22&&t<=at+12
   &&!d.marks.has(i)&&!d.failedMarks.has(i));
  if(active<0)active=times.findIndex((at,i)=>t<at-22
   &&!d.marks.has(i)&&!d.failedMarks.has(i));
  msg=active>=0
   ?'PASAPORTE '+(active+1)+'/3: '+codes[active]+'  '+names[active]
   :'CONTROL DE PASAPORTE COMPLETADO';
  progress=codes.map((code,i)=>
    d.marks.has(i)?'✓ '+code:d.failedMarks.has(i)?'✕ '+code:
    code+' '+(t>=times[i]-12&&t<=times[i]+12?'¡YA!':'○')
  ).join('      ');
 }else if(type==='berga'&&t>=225&&t<277){
  msg='🛡 ¡DEFENDÉ JUSTO ANTES DEL ATROPELLO!';
  progress=d.success?'✓':'';
 }else if(type==='trex'&&t>=128&&t<175){
  msg='🛡 DEFENDÉ EN EL DESTELLO';
  progress=d.success?'✓':'';
 }else if(type==='alca'&&t>=95&&t<195){
  msg='🛡 BLOQUEÁ A ZORRINO Y KIPA';
  progress=d.success+'/2';
 }else if(type==='drapie'&&t>=65&&t<260){
  msg='PULSÁ EN ORDEN: □   △   ○   ×';
  progress=d.step+'/4';
 }
 if(!msg)return;
 c.save();
 c.fillStyle='#080d27ef';c.fillRect(90,362,780,82);
 c.strokeStyle='#ffe89c';c.lineWidth=3;c.strokeRect(90,362,780,82);
 c.textAlign='center';c.font='900 26px system-ui';c.fillStyle='#fff0a1';
 c.fillText(msg,480,396);
 c.fillStyle='#a3ffd2';c.font='bold 22px system-ui';c.fillText(progress,480,428);
 c.restore();
}
function end(type){if(D.current?.type===type){D.current=null;D.pressed.clear();}}
window.SUPER_DEFENSE={start,input,clearInput,tick,result,multiplier,notice,draw,end};
})();