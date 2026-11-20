/* Coqui: 12 bespoke full-body renovation animation sprites.
   Individually rendered vector artwork. No normal fighter pose or action cell reused.
   Outfit and proportions match the playable purple-clad blonde Coqui. */
(function(){
'use strict';
const WIDTH=600,HEIGHT=440,ox=245,base=409;
const poses=[
 {name:'guardia_obra',step:0,L:[-62,-173,-32,-159],R:[58,-172,55,-158]},
 {name:'saca_rodillo',step:1,L:[-58,-169,0,-157],R:[68,-180,91,-174]},
 {name:'pinta_horizontal',step:2,L:[-32,-190,55,-182],R:[55,-200,106,-201]},
 {name:'pinta_alto',step:3,L:[-21,-260,78,-290],R:[50,-257,107,-291]},
 {name:'saca_lijadora',step:4,L:[-48,-171,18,-153],R:[72,-167,94,-155]},
 {name:'lijado_1',step:5,L:[-12,-183,101,-184],R:[64,-194,110,-190]},
 {name:'lijado_polvo',step:6,L:[-11,-182,102,-181],R:[68,-187,116,-175]},
 {name:'agarra_perfil',step:7,L:[-38,-153,50,-96],R:[57,-133,123,-97],kneel:true},
 {name:'perfil_preparado',step:8,L:[-44,-185,62,-197],R:[63,-185,95,-185]},
 {name:'perfil_arriba',step:9,L:[-25,-280,73,-304],R:[59,-265,134,-305]},
 {name:'perfil_golpe',step:10,L:[-19,-200,112,-188],R:[67,-200,161,-180],lunge:true},
 {name:'fin_obra',step:11,L:[-54,-172,-18,-147],R:[64,-169,100,-146]}
];
function path(c,coords){c.beginPath();c.moveTo(coords[0],coords[1]);for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);}
function limb(c,coords,fill,outline='#36203f',width=22){
 c.lineCap='round';c.lineJoin='round';path(c,coords);c.strokeStyle=outline;c.lineWidth=width+6;c.stroke();
 path(c,coords);c.strokeStyle=fill;c.lineWidth=width;c.stroke();
}
function stroke(c,coords,color,width){path(c,coords);c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ell(c,x,y,rx,ry,fill,outline,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);
 c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=3.5;c.stroke();}c.restore();
}
function shoe(c,x,y,reverse=false){
 c.save();c.translate(x,y);if(reverse)c.scale(-1,1);
 c.fillStyle='#f4eefc';c.strokeStyle='#36283d';c.lineWidth=3;
 c.beginPath();c.moveTo(-23,-18);c.quadraticCurveTo(3,-26,13,-12);
 c.quadraticCurveTo(31,-8,36,-1);c.quadraticCurveTo(38,8,23,8);
 c.lineTo(-20,7);c.quadraticCurveTo(-29,-1,-23,-18);c.fill();c.stroke();
 stroke(c,[-23,5,31,5],'#ae65c7',4);stroke(c,[-4,-11,9,-10],'#9163a2',3);
 stroke(c,[-7,-5,12,-4],'#9163a2',3);c.restore();
}
function legs(c,p,t){
 const kneel=!!p.kneel, lunge=!!p.lunge,wide=2*Math.sin(t*.18);
 const leftK=kneel?[-57,-57]:lunge?[-91,-84]:[-59,-86];
 const leftF=kneel?[-80,-4]:lunge?[-132,-6]:[-74-wide,-6];
 const rightK=kneel?[54,-31]:lunge?[86,-75]:[51,-89];
 const rightF=kneel?[106,-4]:lunge?[133,-4]:[70+wide,-6];
 limb(c,[-21,-137,...leftK,...leftF],'#692a91','#361a4f',35);
 limb(c,[20,-137,...rightK,...rightF],'#7b319e','#361a4f',36);
 // Signature white stripes along both purple leggings.
 stroke(c,[-33,-136,leftK[0]-10,leftK[1],leftF[0]-10,leftF[1]+1],'#f7eafd',5.5);
 stroke(c,[-26,-136,leftK[0]-2,leftK[1],leftF[0]-2,leftF[1]+1],'#f7eafd',3);
 stroke(c,[28,-137,rightK[0]+8,rightK[1],rightF[0]+6,rightF[1]+1],'#f7eafd',5.5);
 stroke(c,[23,-137,rightK[0]+1,rightK[1],rightF[0]+1,rightF[1]+1],'#f7eafd',3);
 shoe(c,...leftF,true);shoe(c,...rightF,false);
}
function torso(c,t,p){
 c.save();c.translate(0,p.kneel?23:0);if(p.lunge)c.rotate(-.07);
 c.fillStyle='#d7a070';c.strokeStyle='#57333f';c.lineWidth=3.5;
 c.beginPath();c.moveTo(-32,-215);c.bezierCurveTo(-46,-197,-29,-151,-22,-134);
 c.quadraticCurveTo(4,-126,26,-137);c.lineTo(33,-216);
 c.quadraticCurveTo(0,-240,-32,-215);c.fill();c.stroke();
 // Waistline and rib shading, sports bra in saturated violet.
 c.fillStyle='#7d2aa4';c.beginPath();c.moveTo(-35,-226);c.bezierCurveTo(-45,-202,-40,-178,-31,-176);
 c.quadraticCurveTo(4,-171,35,-175);c.quadraticCurveTo(41,-194,29,-230);
 c.lineTo(3,-236);c.closePath();c.fill();c.strokeStyle='#411b55';c.lineWidth=4;c.stroke();
 stroke(c,[-24,-182,26,-182],'#a666d8',4);
 stroke(c,[-14,-211,-5,-195,15,-198,21,-222],'#cf8bec',3);
 c.restore();
}
function hair(c,t){
 const sway=Math.sin(t*.68)*5;
 c.fillStyle='#d39635';c.strokeStyle='#6b3f2c';c.lineWidth=4;
 c.beginPath();c.moveTo(-6,-289);c.bezierCurveTo(-26,-322,-70,-313,-76+sway,-278);
 c.bezierCurveTo(-88+sway,-255,-65+sway,-234,-105+sway,-221);
 c.bezierCurveTo(-91+sway,-201,-64+sway,-216,-59,-239);
 c.bezierCurveTo(-30,-227,-39,-261,-7,-259);c.closePath();c.fill();c.stroke();
 for(let i=0;i<5;i++){
  const x=-57-i*6+sway*.3;
  stroke(c,[x,-293,x-6,-268,x+2,-248,x-11,-228+i*3],
    i%2?'#ffe395':'#eab75a',2.7);
 }
 // Ponytail flick: varies on sanding and profile impact.
 if(t===6||t===10)stroke(c,[-18,-301,-65,-319,-91-sway,-301],'#efc15c',9);
}
function head(c,t){
 hair(c,t);
 // Neck and ears
 ell(c,3,-238,13,20,'#d8a079','#653b3b',.06);
 ell(c,4,-273,35,40,'#edbb8c','#583745',-.14);
 // Forehead hair sweep + locks
 c.fillStyle='#e7af4d';c.strokeStyle='#7a4d31';c.lineWidth=3;
 c.beginPath();c.moveTo(-28,-278);c.bezierCurveTo(-41,-303,-5,-323,21,-302);
 c.quadraticCurveTo(37,-296,39,-277);c.quadraticCurveTo(19,-285,11,-304);
 c.quadraticCurveTo(-1,-285,-28,-278);c.fill();c.stroke();
 stroke(c,[-21,-294,2,-314,22,-296],'#ffe6a0',4);
 ell(c,21,-276,3.8,2.8,'#263341');stroke(c,[14,-287,24,-287],'#6a3b3b',3);
 stroke(c,[28,-268,39,-263,29,-257],'#88504d',2.5);
 // Expression changes during the sander/profile strike.
 if(t===6||t===9||t===10){stroke(c,[11,-253,26,-249,37,-252],'#70383e',3);}
 else stroke(c,[13,-252,27,-250,34,-253],'#98464d',2);
 ell(c,-24,-266,6.5,8.5,'#e4aa7d','#794e52');
}
function hands(c,x,y){ell(c,x,y,11,10,'#f0b98d','#653d48');stroke(c,[x-11,y+14,x+10,y+14],'#e6e5f4',8);}
function arms(c,p){
 // Left arm is behind the chest; right arm remains clearly visible.
 const L=p.L,R=p.R;
 limb(c,[-30,-214,L[0],L[1],L[2],L[3]],'#dca379','#734359',20);
 limb(c,[34,-213,R[0],R[1],R[2],R[3]],'#efb58d','#734359',22);
 // Sleeveless athletic outfit, small white wrist wraps.
 ell(c,-31,-218,15,17,'#8e3ca8','#46205e',-.2);
 ell(c,35,-218,16,17,'#883bb0','#46205e',.2);
 hands(c,L[2],L[3]);hands(c,R[2],R[3]);
}
function roller(c,x,y,angle){
 c.save();c.translate(x,y);c.rotate(angle);
 stroke(c,[0,7,2,-22,36,-22,36,-39],'#22384d',10);
 stroke(c,[0,7,2,-22,36,-22,36,-39],'#dce7ec',5);
 stroke(c,[0,8,0,35],'#e75843',13);
 c.fillStyle='#fffdf8';c.strokeStyle='#657282';c.lineWidth=3.5;
 c.beginPath();c.roundRect(16,-77,135,43,14);c.fill();c.stroke();
 for(let j=0;j<7;j++)stroke(c,[22+j*18,-47,27+j*18,-38],'#dfd8e4',2);
 c.restore();
}
function sander(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='#edcc91';c.strokeStyle='#483941';c.lineWidth=3;
 c.beginPath();c.roundRect(-44,-6,112,18,5);c.fill();c.stroke();
 c.fillStyle='#d7a329';c.beginPath();c.roundRect(-28,-55,94,56,13);c.fill();c.stroke();
 c.fillStyle='#2b2c35';c.beginPath();c.roundRect(-21,-71,65,18,8);c.fill();c.stroke();
 c.fillStyle='#ffe66a';c.beginPath();c.roundRect(-24,-48,48,12,4);c.fill();
 c.restore();
}
function metal(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a);
 c.fillStyle='#a6b3c8';c.strokeStyle='#334253';c.lineWidth=5;
 c.beginPath();c.moveTo(-160,-24);c.lineTo(160,-24);c.lineTo(175,-13);
 c.lineTo(175,12);c.lineTo(148,12);c.lineTo(148,-2);c.lineTo(-137,-2);
 c.lineTo(-137,15);c.lineTo(-162,15);c.closePath();c.fill();c.stroke();
 stroke(c,[-145,-20,156,-20],'#ecf8ff',5);
 for(let j=0;j<6;j++)ell(c,-115+j*52,-12,3.7,3.1,'#495b69');
 c.restore();
}
function fx(c,t){
 if(t===3){
  c.save();c.translate(180,-280);c.fillStyle='#faffff';c.strokeStyle='#9cbfc6';c.lineWidth=2;
  c.beginPath();c.ellipse(0,0,65,23,-.3,0,7);c.fill();c.stroke();
  for(let j=0;j<9;j++){const a=j*.7;stroke(c,[Math.cos(a)*20,Math.sin(a)*6,Math.cos(a)*(60+j%3*17),Math.sin(a)*(30+j%2*20)],'#fffefa',7);}
  c.restore();
 }
 if(t===6){
  c.save();c.translate(185,-165);
  for(let j=0;j<17;j++){
   const a=j*2.39,d=15+(j%5)*20;
   ell(c,Math.cos(a)*d,Math.sin(a)*d*.64,8+j%3*5,8+j%4*3,j%2?'#eed6ae':'#bca17e','#8f745c');
  }c.restore();
 }
 if(t===10){
  c.save();c.translate(240,-190);c.fillStyle='#ffdf4e';c.strokeStyle='#8c3c28';c.lineWidth=5;
  c.beginPath();for(let j=0;j<20;j++){const a=j*Math.PI/10,r=j%2?21:75;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(!j)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();c.stroke();c.restore();
 }
}
function tools(c,t,p){
 if(t===1)roller(c,p.R[2]+10,p.R[3]-20,-.5);
 if(t===2)roller(c,p.R[2]-3,p.R[3]-22,-.1);
 if(t===3)roller(c,p.R[2]-15,p.R[3]+10,-.45);
 if(t===4||t===5||t===6)sander(c,p.R[2]+20,p.R[3]+13,t===4?.5:t===6?-.15:0);
 if(t===7)metal(c,96,-63,0);
 if(t===8)metal(c,113,-197,-1.15);
 if(t===9)metal(c,91,-314,-.1);
 if(t===10)metal(c,163,-185,-.02);
 if(t===11)metal(c,132,-139,Math.PI/2);
}
function makeSprite(t){
 const ca=document.createElement('canvas');ca.width=WIDTH;ca.height=HEIGHT;
 const c=ca.getContext('2d'),p=poses[t];
 c.translate(ox,base);c.lineJoin='round';c.lineCap='round';
 c.save();c.globalAlpha=.23;ell(c,8,2,88,8,'#151723');c.restore();
 legs(c,p,t);
 // Hair and face must sit behind the striking arm, preserving visible eyes.
 torso(c,t,p);head(c,t);arms(c,p);
 tools(c,t,p);fx(c,t);
 return ca;
}
function build(){return poses.map((_,i)=>makeSprite(i));}
window.COQUI_REFORMAS_POSES={build,names:poses.map(p=>p.name),frameWidth:WIDTH,frameHeight:HEIGHT,version:2};
})();