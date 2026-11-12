/* Per-route art overrides: sheet, row, first column (three complete key poses). */
const THEMED_FINISHER_ART={
 '1:0':[5,0,0],'5:1':[5,0,3],'2:1':[5,1,0],'4:0':[5,1,3],
 '11:0':[6,0,0],'6:1':[6,0,3],'9:1':[6,1,0],'7:1':[6,1,3]
};
function finisherRenderCell(a){return THEMED_FINISHER_ART[a.id+':'+a.finisherVariant]||[...FINISHER_ART_MAP[a.id],a.finisherVariant===1?3:0];}
const DIVE_MASK_DURATION=300,DIVE_MASK_REDUCTION=.35;
function activateDiveMask(a){a.diveMask=DIVE_MASK_DURATION;sfx('ready');}
function resolveThemedFinisher(a,b,elapsed){
 const p=finisherProfile(a);if(p.style==='diveMask'){
  if(!a.hit&&elapsed>=finisherData(a).start){a.hit=true;a.connected=true;activateDiveMask(a);recordCombo(a,{x:a.x,y:a.y});}return true;
 }
 if(p.projectileKind!==undefined){
  if(!a.shots&&elapsed>=finisherData(a).start){spawnFinisherProjectile(a,p);a.shots=1;a.hit=true;if(practice){a.connected=true;recordCombo(a,{x:a.x+a.dir*140,y:a.y});}}return true;
 }
 return false;
}
function spawnFinisherProjectile(a,p){
 const football=p.projectileKind===-8,blob=p.projectileKind===-6;
 projectiles.push({owner:a,x:a.x+a.dir*(football?70:85),y:(football?335:blob?278:245)-a.y,dir:a.dir,
  life:70,speed:football?9.4:blob?6.8:9,damage:(a.attackType==='kick'?8:6)+fighters[a.id][3]*.8,
  advantage:{...finisherAdvantage(a)},level:p.level,kind:p.projectileKind,cast:++castSerial,age:0,spin:football?.18:.12,
  finisherProjectile:true,comboName:COMBO_ROUTES[a.id][a.finisherVariant][0],comboVariant:a.finisherVariant});
 sfx('release',{id:a.id,pan:a.x/480-1});
}
function confirmFinisherProjectile(p,target){p.owner.routeCompleted=p.comboName;effects.push({x:target.x,y:150-target.y,t:48,text:p.comboName.toUpperCase(),color:'#ffe43a'});sfx('combo',{count:3});}
function themedProjectileBox(p){let dx=26,dy=24;if(p.kind===-7){const c=Math.abs(Math.cos(p.age*p.spin)),s=Math.abs(Math.sin(p.age*p.spin));dx=c*29+s*12;dy=s*29+c*12;}if(p.kind===-8)dx=dy=22;return {left:p.x-dx,right:p.x+dx,top:p.y-dy,bottom:p.y+dy};}
function drawMousseBall(x,y,age=0){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(age*.2)*.08);const g=ctx.createRadialGradient(-10,-12,2,2,2,30);g.addColorStop(0,'#b27a4c');g.addColorStop(.5,'#71452d');g.addColorStop(1,'#3c2118');ctx.fillStyle=g;ctx.strokeStyle='#281b1b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,27,24,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#c39770';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-16,-7);ctx.bezierCurveTo(-7,-23,22,-10,9,1);ctx.bezierCurveTo(-1,10,-14,1,-5,-5);ctx.stroke();ctx.fillStyle='#e1ba8b88';ctx.beginPath();ctx.ellipse(-9,-13,6,3,-.4,0,Math.PI*2);ctx.fill();for(let n=0;n<3;n++){ctx.fillStyle='#805237';ctx.beginPath();ctx.ellipse(-35-n*9,Math.sin(age*.2+n)*8,5-n,3-n*.4,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawDoorKey(x,y,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineWidth=8;ctx.strokeStyle='#6c4718';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(26,0);ctx.stroke();ctx.strokeStyle='#e7bd4c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(26,0);ctx.stroke();ctx.fillStyle='#dfb346';ctx.strokeStyle='#704c1d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-30,-13,22,26,5);ctx.fill();ctx.stroke();ctx.fillStyle='#483924';ctx.beginPath();ctx.arc(-19,0,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7bd4c';ctx.fillRect(14,0,5,10);ctx.fillRect(24,0,5,7);ctx.restore();}
function drawThemedProjectile(p){if(p.kind===-6)drawMousseBall(0,0,p.age);else if(p.kind===-7)drawDoorKey(0,0,p.age*p.spin);else if(p.kind===-8)drawFootball(0,0,22,p.age*p.spin);}
function drawThemedFinisherEffect(a,e,r,t,tail){
 switch(finisherProfile(a).style){
 case 'diveMask':break; // The worn visor is part of the authored activation poses.
 case 'mousse':break;
 case 'doorKey':break;
 case 'coffee':if(e>=13&&e<33){ctx.strokeStyle='#64391f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(125,-195);ctx.quadraticCurveTo(r+20,-170,r+20,-110-tail*20);ctx.stroke();ctx.strokeStyle='#fff0d7';ctx.lineWidth=2;for(let n=0;n<4;n++){const x=120+n*12;ctx.beginPath();ctx.moveTo(x,-205);ctx.bezierCurveTo(x-9,-220,x+10,-227,x,-245-tail*20);ctx.stroke();}ctx.fillStyle='#8b5029';for(let n=0;n<6;n++){ctx.beginPath();ctx.ellipse(r+Math.sin(n*2.1)*15,-125+Math.cos(n*2.1)*18,3,5,0,0,Math.PI*2);ctx.fill();}}break;
 case 'leafCigar':ctx.strokeStyle='#84aa52';ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(r-8,-180+n*10);ctx.lineTo(r+9,-187+n*10);ctx.stroke();}break;
 case 'footballMatch':if(e<17)drawFootball(45,-22,22,e*.1);break;
 case 'rotaryPhone':ctx.strokeStyle='#6c5849';ctx.lineWidth=3;ctx.beginPath();for(let n=0;n<30;n++){const x=45+n*3,y=-125+Math.sin(n*1.9)*7+n*.4;if(!n)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();break;
 case 'companyCar':ctx.strokeStyle='#dce8f4';ctx.lineWidth=3;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(r-25-n*10,-175-n*12);ctx.lineTo(r+8-n*10,-175-n*12);ctx.stroke();}break;
 }
}

// Body-local visor attachment. It follows the same rigid transform as the
// rendered key pose; clear glass preserves the character's own face underneath.
let renderedFighter=null;
function drawDiveMaskShape(x,y,angle=0,scale=1){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.lineCap='round';ctx.strokeStyle='#232d35';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-23,-13);ctx.lineTo(-34,-8);ctx.lineTo(-31,21);ctx.lineTo(-19,27);ctx.stroke();ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-9,-29);ctx.lineTo(-12,-42);ctx.lineTo(-24,-51);ctx.stroke();ctx.strokeStyle='#f4f6f6';ctx.lineWidth=7;ctx.stroke();ctx.save();ctx.translate(-26,-53);ctx.rotate(-.55);ctx.fillStyle='#65cbd0';ctx.strokeStyle='#294c50';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-8,-6,16,11,3);ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle='#b5f1f526';ctx.strokeStyle='#35414a';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,24,34,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#eef5f7';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,18,28,0,-2.7,-1.8);ctx.stroke();ctx.fillStyle='#eaf1f2';ctx.beginPath();ctx.moveTo(-8,27);ctx.lineTo(8,27);ctx.lineTo(5,35);ctx.lineTo(-5,35);ctx.closePath();ctx.fill();ctx.restore();}
function visorActor(){const a=renderedFighter;return a?.id===1&&a.diveMask>0?a:null;}
function attachDiveMaskToSprite(im,row,col,x,y,size){const a=visorActor();if(!a)return;const scale=size/330;let anchor;
 if(im===atlases[0]&&row===1)anchor=[[12,-273,0],[14,-271,.04],[14,-271,.04],[23,-275,.02],[-25,-267,.05],[12,-273,0]][col];
 else if(im===actionAtlases[0]&&row===1)anchor=[[16,-274,0],[24,-246,.15],[18,-272,.02],[25,-272,.02],[23,-281,.02],[-68,-271,-.55]][col];
 else if(im===specials[0]&&row===1)anchor=[[8,-274,0],[48,-224,.45],[-6,-276,0],[-22,-274,0],[28,-258,.16],[12,-273,0]][col];
 else if(im===finisherAtlases[0]&&row===1&&col>=3)anchor=[[-15,-227,.07],[57,-231,.15],[10,-259,0]][col-3];
 if(anchor)drawDiveMaskShape(x+anchor[0]*scale,y+anchor[1]*scale,anchor[2],scale);
}
function attachDiveMaskToCell(im){if(!visorActor())return;const anchor=im===crouchArt?[36,-205,.08]:im===lowPunchArt?[-25,-200,.05]:im===lowKickArt?[-40,-193,.06]:im===grabArt?[18,-270,.04]:null;if(anchor)drawDiveMaskShape(...anchor);}
function drawDiveProtectionStatus(a){if(!(a.diveMask>0))return;ctx.save();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#15303c';ctx.fillStyle='#b8f3ff';const text='MÁSCARA · '+Math.ceil(a.diveMask/60)+'s',y=clamp(501-a.y,32,515);ctx.strokeText(text,a.x,y);ctx.fillText(text,a.x,y);ctx.strokeStyle='#80e3f788';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,461-a.y,58,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
