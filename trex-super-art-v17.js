/* T-Rex super form: original canvas character art, 60 fps animation. */
(function(){
'use strict';
const INK='#203126',SKIN='#86a34c',LIGHT='#b8c878',DARK='#526f39',VEST='#0e95ba';
function path(c,paint,stroke,fn,width=3){
 c.beginPath();fn();c.fillStyle=paint;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}
}
function oval(c,x,y,rx,ry,paint,stroke=INK,width=3,angle=0){
 c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=paint;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,color,width,pts){
 c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
 c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();
}
function claw(c,x,y,flip=1){
 c.save();c.translate(x,y);c.scale(flip,1);
 for(let i=0;i<3;i++)path(c,'#f5e8ac',INK,()=>{const xx=i*10;c.moveTo(xx,-1);c.lineTo(xx+7,-12);c.quadraticCurveTo(xx+10,-13,xx+9,-7);c.lineTo(xx+7,3);c.closePath()},1.7);
 c.restore();
}
function leg(c,x,y,lift,front){
 c.save();c.translate(x,y);c.rotate(lift*.12);
 oval(c,0,-39,29,48,front?SKIN:DARK,INK,3,-.2);
 path(c,front?'#709341':'#4a6537',INK,()=>{
  c.moveTo(-15,-12);c.quadraticCurveTo(-30,14,-15,38);c.lineTo(15,41);
  c.quadraticCurveTo(21,19,16,0);c.closePath();
 });
 path(c,front?'#a8bb63':'#668345',INK,()=>{
  c.moveTo(-20,32);c.quadraticCurveTo(0,28,25,33);c.quadraticCurveTo(48,40,49,50);
  c.quadraticCurveTo(27,57,-25,53);c.closePath();
 });
 for(let i=0;i<3;i++)path(c,'#f5e5b2',INK,()=>{
  const tx=20+i*12;c.moveTo(tx,47);c.lineTo(tx+10,49);c.lineTo(tx+3,55);c.closePath();
 },1.5);
 c.restore();
}
function draw(c,a,time,ghost){
 const morph=a.trexMorph>0;
 const fade=morph?Math.min(1,1-a.trexMorph/30):1;
 const punch=a.attack>0&&a.attackType==='punch';
 const kick=a.attack>0&&a.attackType==='kick';
 const bite=a.attack>0&&a.attackType==='trexBite';
 const hurt=a.stun>0;
 const defending=a.blocking||a.guardMix>.65;
 const attacking=punch||kick||bite;
 const phase=a.attackLength?1-a.attack/a.attackLength:0;
 const burst=attacking?Math.sin(Math.PI*Math.min(1,phase*1.35)):0;
 const bob=Math.sin(time*.11)*2+(a.moving?Math.sin(a.walk*.5)*4:0);
 const tail=kick?Math.sin(Math.PI*phase)*.4:Math.sin(time*.055)*.10;
 const biteOpen=bite?Math.max(.2,Math.sin(Math.PI*phase))*1: morph?.8:.23+Math.sin(time*.1)*.03;
 c.save();
 c.globalAlpha*=fade;
 if(!ghost){
  oval(c,a.x,464-a.y,83,13,'#130b2270',null);
 }
 c.translate(a.x,463-a.y+bob);
 c.scale(a.dir,1);
 if(hurt)c.rotate(-.075);
 if(a.y>0)c.rotate(-.03);
 if(defending)c.translate(-9,7);
 // Animated electric transformation aura; no detached body parts.
 if(!ghost){
  c.save();c.globalAlpha*=.65;
  for(let i=0;i<3;i++){
   c.strokeStyle=i===0?'#2eeeff':i===1?'#e8f742':'#f47a24';
   c.lineWidth=3.4-i*.7;c.beginPath();
   const wobble=Math.sin(time*.14+i*2)*8;
   c.ellipse(-2+wobble,-145,115+i*9,142+i*5,Math.sin(time*.02+i)*.13,0,Math.PI*2);
   c.stroke();
  }
  c.restore();
 }
 // Tail (behind body) swings and remains attached to the hips.
 c.save();c.translate(-34,-124);c.rotate(tail);
 path(c,DARK,INK,()=>{
  c.moveTo(18,-37);c.bezierCurveTo(-42,-63,-112,-70,-177,-48);
  c.bezierCurveTo(-153,-31,-131,-9,-104,3);
  c.bezierCurveTo(-70,23,-25,19,26,26);c.closePath();
 },4);
 path(c,'#c2c979',null,()=>{
  c.moveTo(-165,-43);c.bezierCurveTo(-111,-39,-68,-4,-18,8);
  c.lineTo(13,21);c.bezierCurveTo(-55,23,-127,0,-165,-43);c.closePath();
 });
 for(let i=0;i<7;i++)path(c,'#344d31',INK,()=>{
  const x=-154+i*22,y=-48-i*1.6;
  c.moveTo(x,y+5);c.lineTo(x+9,y-8-i*.3);c.lineTo(x+18,y+7);c.closePath();
 },1.5);
 c.restore();
 // Rear hind leg.
 leg(c,-31,-36,a.moving?Math.sin(a.walk*.34)*2:0,false);
 // Huge torso, shaded belly and bright turquoise vest.
 path(c,SKIN,INK,()=>{
  c.moveTo(-81,-165);c.bezierCurveTo(-83,-216,-15,-242,49,-214);
  c.bezierCurveTo(91,-186,88,-121,45,-91);
  c.bezierCurveTo(1,-61,-71,-88,-81,-165);c.closePath();
 },5);
 oval(c,24,-146,47,59,'#c9c88c',null,0,-.14);
 path(c,VEST,INK,()=>{
  c.moveTo(-63,-199);c.quadraticCurveTo(-11,-236,41,-210);
  c.lineTo(25,-165);c.quadraticCurveTo(-22,-174,-55,-153);
  c.closePath();
 },3);
 line(c,'#063e61',13,[[-42,-210],[-18,-173],[24,-157]]);
 line(c,'#57e0e5',5,[[-39,-208],[-15,-175],[21,-161]]);
 oval(c,-21,-191,9,9,'#ffdc31','#133a51',2);
 line(c,'#2d5837',3,[[39,-156],[54,-147],[43,-133]]);
 // Front hind leg and stomp/kick.
 c.save();c.translate(30,-39);
 if(kick){c.translate(burst*25,-burst*12);c.rotate(-burst*.36);}
 leg(c,0,0,0,true);
 c.restore();
 // Small but fierce forearm, attached to shoulder.
 c.save();c.translate(42,-180);
 c.rotate(defending?-.8:punch?-burst*.65:.12+Math.sin(time*.08)*.04);
 path(c,DARK,INK,()=>{
  c.moveTo(-13,-11);c.quadraticCurveTo(9,-24,24,-10);
  c.quadraticCurveTo(40,6,32,24);c.lineTo(15,30);
  c.quadraticCurveTo(3,10,-13,-11);c.closePath();
 },3);
 oval(c,30,25,14,12,SKIN,INK,2);
 claw(c,29,27);
 c.restore();
 // Neck.
 path(c,SKIN,INK,()=>{
  c.moveTo(16,-198);c.bezierCurveTo(30,-239,48,-266,75,-273);
  c.lineTo(112,-241);c.bezierCurveTo(99,-215,87,-187,58,-175);c.closePath();
 },4);
 // Head and snout, with original fighter's blue sunglasses.
 const headThrust=bite?burst*25:punch?burst*7:0;
 c.save();c.translate(headThrust,hurt?8:0);
 path(c,LIGHT,INK,()=>{
  c.moveTo(49,-272);c.bezierCurveTo(65,-299,106,-300,129,-284);
  c.bezierCurveTo(148,-274,162,-259,163,-249);
  c.bezierCurveTo(162,-230,132,-227,111,-235);
  c.bezierCurveTo(83,-218,58,-226,45,-245);c.closePath();
 },4);
 oval(c,136,-260,5.8,4.1,'#32452d',null);
 // Moving jaw and triangular teeth.
 c.save();c.translate(78,-240);c.rotate(biteOpen*.19);
 path(c,'#57733e',INK,()=>{
  c.moveTo(0,0);c.quadraticCurveTo(34,12,86,-2);
  c.quadraticCurveTo(71,24,35,23);c.quadraticCurveTo(6,21,0,0);c.closePath();
 },3);
 path(c,'#802f45',null,()=>{
  c.moveTo(19,6);c.quadraticCurveTo(47,17,73,7);c.lineTo(62,15);c.quadraticCurveTo(31,19,19,6);
 });
 for(let i=0;i<5;i++)path(c,'#fff2cf',INK,()=>{
  const x=24+i*10;c.moveTo(x,0);c.lineTo(x+4,9);c.lineTo(x+8,0);c.closePath();
 },1);
 c.restore();
 for(let i=0;i<5;i++)path(c,'#f6f0d6',INK,()=>{
  const x=98+i*11;c.moveTo(x,-241);c.lineTo(x+4,-231);c.lineTo(x+8,-240);c.closePath();
 },1);
 // Sunglasses are a permanent identity detail throughout all animation frames.
 path(c,'#14273e','#061d28',()=>{
  c.moveTo(63,-273);c.quadraticCurveTo(78,-285,94,-276);c.lineTo(97,-260);
  c.quadraticCurveTo(82,-249,66,-262);c.closePath();
 },2);
 path(c,'#14273e','#061d28',()=>{
  c.moveTo(99,-277);c.quadraticCurveTo(115,-282,128,-272);c.lineTo(128,-258);
  c.quadraticCurveTo(114,-252,101,-263);c.closePath();
 },2);
 line(c,'#28aee3',3,[[65,-272],[78,-278],[93,-270]]);
 line(c,'#28aee3',3,[[100,-274],[114,-277],[126,-267]]);
 line(c,'#0b2132',4,[[94,-273],[102,-272]]);
 for(let i=0;i<6;i++)oval(c,61+i*12,-240+Math.sin(i*1.5)*5,2.3,1.6,'#365b37',null);
 c.restore();
 // Heavy claw and bite impact trails.
 if(attacking&&burst>.05&&!ghost){
  c.save();c.globalAlpha*=burst;
  c.strokeStyle=bite?'#fdf04a':'#ffad26';c.lineWidth=bite?9:7;c.lineCap='round';
  c.beginPath();c.arc(100+headThrust,-175,bite?115:95,-.8,.58);c.stroke();
  c.strokeStyle='#fff5c4';c.lineWidth=3;c.beginPath();c.arc(104+headThrust,-175,bite?105:85,-.78,.5);c.stroke();
  c.restore();
 }
 // Scales and glints.
 for(let i=0;i<8;i++)oval(c,-52+(i%4)*24,-134+Math.floor(i/4)*21,3.8,2.5,'#496c38',null);
 c.restore();
 if(!ghost){
  c.save();c.textAlign='center';c.font='italic 900 17px system-ui';c.lineWidth=4;c.strokeStyle='#1b0c2e';c.fillStyle='#ffe940';
  c.strokeText('🦖 T-REX',a.x,102-a.y);c.fillText('🦖 T-REX',a.x,102-a.y);c.restore();
 }
}
window.TrexSuperArt={draw};
})();