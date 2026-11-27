/* Flor Rubia — ¡DETENIDA EN ZÚRICH! / V1 illustrated sprite and backdrop kit.
 * No generated people, imported faces or external runtime dependencies:
 * airport elements and police pose sprites are painted once onto canvases.
 * Flor and the real opponent remain their ORIGINAL in-game SpriteAtlas art.
 */
(function(){
'use strict';
const police=new Map();
let terminal=null;
const PI=Math.PI,TAU=PI*2;
const cut=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=cut(v);return v*v*(3-2*v)};
function rect(c,x,y,w,h,fill,stroke=null,r=0,lw=2){
 c.beginPath();if(r)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);
 c.fillStyle=fill;c.fill();
 if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill,stroke=null,lw=2){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();
 if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}
}
function line(c,points,color,w=3){
 c.beginPath();c.moveTo(points[0],points[1]);
 for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
 c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.stroke();
}
function label(c,txt,x,y,size,color='#fff',align='center',outline=null){
 c.save();c.textAlign=align;c.textBaseline='middle';
 c.font='900 '+size+'px system-ui,Arial,sans-serif';
 if(outline){c.strokeStyle=outline;c.lineWidth=Math.max(2,size*.18);c.strokeText(txt,x,y);}
 c.fillStyle=color;c.fillText(txt,x,y);c.restore();
}
function cross(c,x,y,w){
 rect(c,x,y,w,w,'#df1937');
 rect(c,x+w*.39,y+w*.16,w*.22,w*.68,'#fff');
 rect(c,x+w*.16,y+w*.39,w*.68,w*.22,'#fff');
}
function terminalBackground(c){
 const sky=c.createLinearGradient(0,0,0,425);
 sky.addColorStop(0,'#192a52');sky.addColorStop(.52,'#739ab9');sky.addColorStop(1,'#daeff1');
 c.fillStyle=sky;c.fillRect(0,0,960,540);
 // Through the panoramic glass: Swiss mountains, runway and control tower.
 rect(c,28,111,904,285,'#90afc5','#132746',12,7);
 const outside=c.createLinearGradient(0,115,0,397);
 outside.addColorStop(0,'#80b7d6');outside.addColorStop(.55,'#c7e4f0');outside.addColorStop(1,'#c8dce2');
 rect(c,36,118,888,274,outside);
 for(let i=0;i<8;i++){
  const x=i*149-90,h=95+(i%3)*26;
  c.beginPath();c.moveTo(x,363);c.lineTo(x+103,363-h);
  c.lineTo(x+202,363);c.closePath();c.fillStyle=i%2?'#b9d1da':'#9db9ca';c.fill();
  c.beginPath();c.moveTo(x+103,363-h);c.lineTo(x+74,363-h+32);
  c.lineTo(x+113,363-h+23);c.lineTo(x+123,363-h+47);
  c.lineTo(x+141,363-h+44);c.closePath();c.fillStyle='#f7faff';c.fill();
 }
 rect(c,36,346,888,47,'#8e9ca4');
 for(let i=0;i<19;i++){rect(c,42+i*50,375,26,3,'#f3fcff');}
 rect(c,676,185,10,162,'#5f7c92');rect(c,659,182,45,13,'#6a8da4');
 rect(c,685,148,6,36,'#455d71');ellipse(c,688,153,13,3,'#455d71');
 rect(c,27,105,14,300,'#213d55');rect(c,328,105,12,300,'#24435d');
 rect(c,637,105,12,300,'#24435d');rect(c,923,105,11,300,'#24435d');
 rect(c,28,104,906,15,'#293a52');
 // Architectural interior / overhead light panels.
 rect(c,0,0,960,116,'#1b243d');
 for(let i=0;i<7;i++){
  rect(c,28+i*146,12,102,18,'#627e94','#a7d7e2',3,2);
  rect(c,45+i*146,13,69,6,'#efffff');
 }
 // Airport wayfinding board.
 rect(c,35,49,492,77,'#0c182e','#d4e5e9',6,3);
 cross(c,48,62,47);
 label(c,'ZÜRICH  AIRPORT',111,79,25,'#f5fbff','left');
 label(c,'FLUGHAFEN  •  AIRPORT  •  AEROPUERTO',111,107,11,'#acc4d7','left');
 rect(c,548,50,373,74,'#12324c','#8ed8de',5,2);
 label(c,'SECURITY  /  SICHERHEIT',729,78,18,'#f4fcff');
 label(c,'PASSPORT CONTROL  →',733,104,13,'#81e5e6');
 // Waxy terminal floor and reflected glass.
 const ground=c.createLinearGradient(0,404,0,540);
 ground.addColorStop(0,'#859ca9');ground.addColorStop(.35,'#c7d4da');ground.addColorStop(1,'#6b8190');
 rect(c,0,403,960,137,ground);
 for(let y=417;y<=520;y+=28)line(c,[0,y,960,y],'#edf7fc46',1.8);
 for(let x=28;x<960;x+=113)line(c,[x,404,x+(x-480)*.12,540],'#e9f7fe25',1.3);
 // Boarding queues + stainless steel railing.
 for(let i=0;i<4;i++){
  const x=89+i*165;
  rect(c,x,365,8,90,'#32465b');ellipse(c,x+4,367,11,6,'#ecffff');
  ellipse(c,x+4,451,16,6,'#1b2f48');
 }
 for(let i=0;i<3;i++)line(c,[93+i*165,375,250+i*165,375],'#b6334e',7);
 rect(c,805,196,110,101,'#17263e','#b7d7e0',6,3);
 label(c,'GATE  07',861,223,21,'#fff');
 label(c,'ZRH',861,256,26,'#fcebb4');
 label(c,'12:48',861,283,15,'#9bced7');
}
function background(c,t){
 if(!terminal){
  terminal=document.createElement('canvas');terminal.width=960;terminal.height=540;
  terminalBackground(terminal.getContext('2d'));
 }
 c.drawImage(terminal,0,0);
 // Aircraft moves slowly behind airport glass, with glints on the windows.
 const x=900-((t*1.12)%1160),y=254+Math.sin(t*.026)*8;
 c.save();c.translate(x,y);
 line(c,[-62,0,67,0],'#ecf6ff',7);
 line(c,[-12,-2,31,-31,47,-31],'#f6fbff',6);
 line(c,[1,0,33,24,46,24],'#f6fbff',5);
 line(c,[-48,0,-58,-17],'#f8fbff',4);
 ellipse(c,67,0,8,3,'#e6f4f9');c.restore();
 c.save();c.globalAlpha=.10+.04*Math.sin(t*.033);
 line(c,[45,122,282,391],'#ffffff',26);
 line(c,[341,122,602,393],'#fff',18);
 c.restore();
}
function stamp(c,txt,x,y,rot=0,scale=1){
 c.save();c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
 rect(c,-170,-44,340,86,'#ffffff08','#d62d49',8,8);
 rect(c,-157,-34,314,66,'#ffffff08','#d62d49',2,2);
 label(c,txt,0,0,txt.length>24?15:txt.length>18?18:22,'#d72f50');
 c.restore();
}
function luggage(c,x,y,scale=1,open=false){
 c.save();c.translate(x,y);c.scale(scale,scale);
 ellipse(c,3,7,93,15,'#08172a59');
 rect(c,-74,-100,147,103,'#b82e5a','#541c48',18,7);
 rect(c,-65,-92,128,84,'#e94d78','#ffbd97',13,2);
 rect(c,-7,-107,13,110,'#72203c');rect(c,-53,-54,104,7,'#f79db1');
 rect(c,-34,-128,66,33,'#492443','#ffcaaf',10,7);
 rect(c,-86,-4,25,11,'#26374c');rect(c,58,-4,25,11,'#26374c');
 for(let i=0;i<4;i++)ellipse(c,-55+i*32,-25,2,2,'#fff9d1');
 cross(c,21,-86,29);
 if(open){
  c.save();c.translate(-70,-93);c.rotate(-.43);
  rect(c,-10,-20,159,23,'#ffb0ac','#4d203f',6,4);
  rect(c,3,-15,137,8,'#762d53');c.restore();
 }
 c.restore();
}
function confiscated(c,t){
 const items=[
  {x:445,y:278,icon:'✿',color:'#f9a2c9',small:'PERFUME'},
  {x:531,y:251,icon:'♨',color:'#a7a5ed',small:'SECADOR'},
  {x:592,y:314,icon:'F',color:'#7a4b35',small:'FERNET'},
  {x:668,y:272,icon:'◕',color:'#f4d45d',small:'QUESO'},
 ];
 for(let i=0;i<items.length;i++){
  const p=cut((t-84-i*9)/18);if(!p)continue;
  const ob=items[i],y=ob.y-(1-ease(p))*100;
  c.save();c.globalAlpha=p;c.translate(ob.x,y);c.rotate(Math.sin(t*.04+i)*.04);
  ellipse(c,0,4,36,8,'#18284244');
  rect(c,-29,-52,58,56,ob.color,'#252d50',7,4);
  label(c,ob.icon,0,-28,28,'#fff7e2');
  rect(c,-33,0,66,23,'#193550','#92cbd3',4,2);
  label(c,ob.small,0,12,9,'#fff');
  c.restore();
 }
}
function conveyor(c,t){
 // Conveyor runs behind the arrest and launches the suspect's suitcase.
 rect(c,396,416,564,49,'#2c4154','#0c1a2c',5,6);
 rect(c,405,420,548,25,'#263648','#b0c7d0',3,2);
 for(let x=410;x<958;x+=35){
  let q=406+((x+t*2)%545);
  rect(c,q,424,6,18,'#778ea0');
 }
 for(let x=420;x<960;x+=78){
  rect(c,x,466,15,51,'#334b5c');ellipse(c,x+8,511,14,5,'#182942');
 }
 line(c,[408,421,959,421],'#d2dee1',5);
 rect(c,413,455,545,9,'#68899b');
}
function scanner(c,t){
 rect(c,558,286,216,139,'#3f657f','#152a47',11,8);
 rect(c,568,296,197,123,'#a5bfcd','#e5f7ff',5,4);
 rect(c,588,304,154,108,'#152c49','#374e6d',9,4);
 rect(c,606,317,119,85,'#081a32');
 const beam=c.createLinearGradient(606,317,725,405);
 beam.addColorStop(0,'#27b9db32');beam.addColorStop(.5,'#63f7ef59');
 beam.addColorStop(1,'#24badd14');
 rect(c,606,317,119,85,beam);
 for(let i=0;i<7;i++)line(c,[610,328+i*11,718,328+i*11],'#55b6da25',1.3);
 rect(c,559,285,214,21,'#102941','#d1e8f4',5,3);
 label(c,'X-RAY  /  KONTROLLE',665,293,13,'#e9fff7');
 if(t>305){
  c.save();c.globalAlpha=.2+.2*Math.sin(t*.16);
  rect(c,622,316,68,85,'#e2f5ff');
  c.restore();
 }
}
function officerShape(c,pose=0){
 const idle=pose===0,point=pose===1,inspect=pose===2,escort=pose===3,stampPose=pose===4;
 c.save();c.translate(130,340);
 // Boots, legs and realistic anchored body proportions.
 ellipse(c,0,0,65,11,'#11203866');
 for(const [x,shift] of [[-31,0],[22,pose===3?10:0]]){
  rect(c,x-13,-91+shift,29,92,'#152b46','#09172f',7,4);
  rect(c,x-18,-7+shift,40,20,'#0b172a','#647b9a',7,3);
 }
 rect(c,-62,-208,125,124,'#173552','#081c36',17,6);
 rect(c,-51,-195,102,95,'#224c70','#739bb7',12,2);
 // Tie / uniform emblem, belt, epaulettes and polished metal buttons.
 rect(c,-62,-108,124,20,'#0e2038','#a6c4d2',6,3);
 rect(c,-7,-109,20,22,'#dbedf0','#17263b',3,2);
 line(c,[-22,-193,-3,-175,16,-194],'#deedff',5);
 rect(c,-40,-199,29,10,'#b9c9d3');rect(c,13,-199,29,10,'#b9c9d3');
 ellipse(c,0,-157,5,5,'#f2ce7e');ellipse(c,0,-132,5,5,'#f2ce7e');
 cross(c,33,-181,22);
 // Head, neck, nose, eyes and brows.
 rect(c,-17,-231,34,32,'#d5a77f','#75483f',7,3);
 ellipse(c,0,-260,47,51,'#e2b58b','#51363d',3);
 c.beginPath();c.moveTo(-44,-268);c.quadraticCurveTo(-30,-333,13,-305);
 c.lineTo(41,-279);c.quadraticCurveTo(32,-316,-10,-313);
 c.quadraticCurveTo(-43,-308,-44,-268);c.fillStyle='#4b3546';c.fill();
 ellipse(c,-20,-256,4,3,'#232a3d');ellipse(c,22,-256,4,3,'#232a3d');
 line(c,[-26,-267,-14,-268],'#4b3546',3);
 line(c,[13,-268,27,-267],'#4b3546',3);
 line(c,[-2,-250,2,-243,-3,-241],'#ad7868',2);
 line(c,[-13,-229,9,-230],'#78483e',2);
 // Visored Swiss police cap.
 rect(c,-50,-312,101,28,'#1b3d5c','#07162f',12,4);
 rect(c,-62,-289,123,14,'#122c4e','#142336',8,3);
 rect(c,-10,-306,21,19,'#e7e8f0','#d3c09d',4,2);
 cross(c,-4,-303,10);
 label(c,'POLIZEI',0,-169,13,'#e0f6ff');
 function arm(x1,y1,x2,y2,handX,handY){
  line(c,[x1,y1,x2,y2,handX,handY],'#08162c',22);
  line(c,[x1,y1,x2,y2,handX,handY],'#214965',15);
  ellipse(c,handX,handY,12,12,'#e0b28a','#654d4d',2);
 }
 if(point){arm(-49,-200,-72,-155,-102,-164);arm(52,-201,83,-209,119,-214);}
 else if(inspect){arm(-53,-202,-87,-157,-74,-105);arm(52,-202,83,-157,48,-100);}
 else if(escort){arm(-53,-202,-91,-174,-115,-151);arm(52,-202,85,-157,117,-141);}
 else if(stampPose){arm(-53,-202,-60,-157,-18,-139);arm(52,-202,77,-130,34,-98);}
 else{arm(-53,-202,-78,-159,-68,-119);arm(53,-202,79,-159,69,-119);}
 if(stampPose){
  c.save();c.translate(40,-97);c.rotate(-.2);
  rect(c,-21,-9,45,18,'#a12c43','#472d43',5,3);
  rect(c,-8,-36,17,31,'#dfb17a','#5c3a2f',5,2);c.restore();
 }
 c.restore();
}
function officer(c,x,y,scale=1,pose=0,flip=false){
 if(!police.has(pose)){
  const ca=document.createElement('canvas');ca.width=260;ca.height=360;
  officerShape(ca.getContext('2d'),pose);police.set(pose,ca);
 }
 const im=police.get(pose);
 c.save();c.translate(x,y);c.scale((flip?-1:1)*scale,scale);
 c.drawImage(im,-130,-340,260,360);c.restore();
}
function sticker(c,x,y,txt='DEPORTADO',rot=0,scale=1){
 c.save();c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
 rect(c,-86,-32,172,64,'#d83d4b','#fff7f2',6,5);
 rect(c,-78,-24,156,48,'#fff2e4','#4c2940',3,2);
 label(c,txt,0,2,20,'#aa2336');
 for(let i=0;i<7;i++)rect(c,-70+i*21,17,11,3,'#b83c4b');
 c.restore();
}
function passport(c,x,y,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(-.11);
 rect(c,-53,-74,106,144,'#ba173e','#4c1434',10,6);
 cross(c,-12,-36,24);
 label(c,'PASS',0,13,17,'#ffe5a0');
 label(c,'PORT',0,33,17,'#ffe5a0');
 rect(c,-33,51,66,3,'#ffdb98');c.restore();
}
function baggageArc(c,t,baseX=715){
 const p=cut((t-355)/34),e=ease(p);
 c.save();c.translate(baseX+e*220,420-Math.sin(p*PI)*220);
 c.rotate(e*1.2);
 luggage(c,0,0,.92,false);
 sticker(c,0,-55,'DEPORTADO',.06,0.64);
 c.restore();
}
function explosion(c,t,x=810,y=312){
 const p=cut((t-372)/45);if(p<=0||p>=1)return;
 c.save();c.translate(x,y);c.globalAlpha=(1-p);
 for(let i=0;i<26;i++){
  const a=i*2.3999,r=(i%2?34:88)+p*160;
  line(c,[Math.cos(a)*(24+p*22),Math.sin(a)*(22+p*14),
          Math.cos(a)*r,Math.sin(a)*r],
    i%3===0?'#fff5b4':i%3===1?'#ff8b67':'#eb3d72',i%3+4);
 }
 c.beginPath();
 for(let i=0;i<24;i++){
  const a=i*PI/12,r=(i%2?70:120)*(1+p*.8);
  const x=Math.cos(a)*r,y=Math.sin(a)*r;
  if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();c.fillStyle='#ffe096aa';c.fill();
 label(c,'¡PLOOOF!',0,-20,46,'#fff','center','#6a214f');
 c.restore();
}
function prompt(c,t,truth){
 // Scene-native checkpoint signs complement the functional QTE overlay.
 c.save();c.globalAlpha=.92;
 rect(c,365,118,336,47,'#071c32','#a0eef4',8,3);
 label(c,t<160?'CONTROL DE PASAPORTE':truth==='perfect'?'ACCESO PERMITIDO':
  truth==='partial'?'VERIFICACIÓN PARCIAL':'PASAPORTE RETENIDO',
  533,141,16,truth==='perfect'?'#9df7d1':'#ffeba0');
 c.restore();
}
window.FLOR_AIRPORT_ART=Object.freeze({
 background,officer,luggage,confiscated,conveyor,scanner,sticker,
 passport,baggageArc,explosion,prompt,stamp,rect,ellipse,line,label,cross,
 get policeSpritesReady(){return police.size;},
 get backgroundReady(){return !!terminal;}
});
})();
