/* Per-route art overrides: sheet, row, first column (three complete key poses). */
const THEMED_FINISHER_ART={
 '0:0':[7,0,0],'0:1':[7,0,3],'1:0':[7,1,0],'5:1':[5,0,3],'2:1':[5,1,0],'4:0':[5,1,3],
 '11:0':[6,0,0],'6:1':[6,0,3],'9:1':[6,1,0],'7:1':[6,1,3]
};
function finisherRenderCell(a){return THEMED_FINISHER_ART[a.id+':'+a.finisherVariant]||[...FINISHER_ART_MAP[a.id],a.finisherVariant===1?3:0];}
const DIVE_MASK_DURATION=300,DIVE_MASK_REDUCTION=.25;
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
 const football=p.projectileKind===-8,blob=p.projectileKind===-6,kid=p.projectileKind===-9;
 projectiles.push({owner:a,x:a.x+a.dir*(football?70:85),y:(football?335:blob?278:kid?300:245)-a.y,dir:a.dir,
  life:kid?85:70,speed:football?9.4:blob?6.8:kid?7.2:9,damage:(a.attackType==='kick'?8:6)+fighters[a.id][3]*.8,
  advantage:{...finisherAdvantage(a)},level:p.level,kind:p.projectileKind,cast:++castSerial,age:0,spin:football?.18:.12,
  finisherProjectile:true,comboName:COMBO_ROUTES[a.id][a.finisherVariant][0],comboVariant:a.finisherVariant});
 sfx('release',{id:a.id,pan:a.x/480-1});
}
function confirmFinisherProjectile(p,target){p.owner.routeCompleted=p.comboName;effects.push({x:target.x,y:150-target.y,t:48,text:p.comboName.toUpperCase(),color:'#ffe43a'});sfx('combo',{count:3});}
function themedProjectileBox(p){let dx=26,dy=24;if(p.kind===-7){const c=Math.abs(Math.cos(p.age*p.spin)),s=Math.abs(Math.sin(p.age*p.spin));dx=c*29+s*12;dy=s*29+c*12;}if(p.kind===-8)dx=dy=22;if(p.kind===-9){dx=43;dy=52;}return {left:p.x-dx,right:p.x+dx,top:p.y-dy,bottom:p.y+dy};}
function drawMousseBall(x,y,age=0){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(age*.2)*.08);const g=ctx.createRadialGradient(-10,-12,2,2,2,30);g.addColorStop(0,'#b27a4c');g.addColorStop(.5,'#71452d');g.addColorStop(1,'#3c2118');ctx.fillStyle=g;ctx.strokeStyle='#281b1b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,27,24,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#c39770';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-16,-7);ctx.bezierCurveTo(-7,-23,22,-10,9,1);ctx.bezierCurveTo(-1,10,-14,1,-5,-5);ctx.stroke();ctx.fillStyle='#e1ba8b88';ctx.beginPath();ctx.ellipse(-9,-13,6,3,-.4,0,Math.PI*2);ctx.fill();for(let n=0;n<3;n++){ctx.fillStyle='#805237';ctx.beginPath();ctx.ellipse(-35-n*9,Math.sin(age*.2+n)*8,5-n,3-n*.4,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawDoorKey(x,y,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineWidth=8;ctx.strokeStyle='#6c4718';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(26,0);ctx.stroke();ctx.strokeStyle='#e7bd4c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(26,0);ctx.stroke();ctx.fillStyle='#dfb346';ctx.strokeStyle='#704c1d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-30,-13,22,26,5);ctx.fill();ctx.stroke();ctx.fillStyle='#483924';ctx.beginPath();ctx.arc(-19,0,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7bd4c';ctx.fillRect(14,0,5,10);ctx.fillRect(24,0,5,7);ctx.restore();}
function drawThemedProjectile(p){if(p.kind===-6)drawMousseBall(0,0,p.age);else if(p.kind===-7)drawDoorKey(0,0,p.age*p.spin);else if(p.kind===-8)drawFootball(0,0,22,p.age*p.spin);else if(p.kind===-9)drawPainterKid(0,0,p.age);}
function drawThemedFinisherEffect(a,e,r,t,tail){
 switch(finisherProfile(a).style){
 case 'diveMask':break; // One shared rigid equipment asset for every pose.
 case 'reversePsychology':drawPsychologyArrows(e,r,t);break;
 case 'artWorkshop':if(e<17)drawPainterKid(65,-165,0);break;
 case 'mousse':break;
 case 'doorKey':break;
 case 'coffee':if(e>=13&&e<33){ctx.strokeStyle='#64391f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(125,-195);ctx.quadraticCurveTo(r+20,-170,r+20,-110-tail*20);ctx.stroke();ctx.strokeStyle='#fff0d7';ctx.lineWidth=2;for(let n=0;n<4;n++){const x=120+n*12;ctx.beginPath();ctx.moveTo(x,-205);ctx.bezierCurveTo(x-9,-220,x+10,-227,x,-245-tail*20);ctx.stroke();}ctx.fillStyle='#8b5029';for(let n=0;n<6;n++){ctx.beginPath();ctx.ellipse(r+Math.sin(n*2.1)*15,-125+Math.cos(n*2.1)*18,3,5,0,0,Math.PI*2);ctx.fill();}}break;
 case 'leafCigar':ctx.strokeStyle='#84aa52';ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(r-8,-180+n*10);ctx.lineTo(r+9,-187+n*10);ctx.stroke();}break;
 case 'footballMatch':if(e<17)drawFootball(45,-22,22,e*.1);break;
 case 'rotaryPhone':ctx.strokeStyle='#6c5849';ctx.lineWidth=3;ctx.beginPath();for(let n=0;n<30;n++){const x=45+n*3,y=-125+Math.sin(n*1.9)*7+n*.4;if(!n)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();break;
 case 'companyCar':ctx.strokeStyle='#dce8f4';ctx.lineWidth=3;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(r-25-n*10,-175-n*12);ctx.lineTo(r+8-n*10,-175-n*12);ctx.stroke();}break;
 }
}

let renderedFighter=null;
function drawMaskedSprite(im,row,col,x,y,size){
 const a=renderedFighter;if(!(a?.id===1&&a.diveMask>0))return false;
 let sheet=-1,mr=row,mc=col;
 if(im===atlases[0]&&row===1){sheet=0;mr=0;}
 else if(im===actionAtlases[0]&&row===1){sheet=0;mr=1;}
 else if(im===specials[0]&&row===1){sheet=1;mr=0;}
 else if(im===alcaFinisherArt&&row===1&&col<3){sheet=1;mr=1;}
 else if(im===finisherAtlases[0]&&row===1&&col>=3){sheet=1;mr=1;}
 if(sheet<0)return false;
 SpriteAtlas.draw(ctx,maskedSheets[sheet],mr,mc,x,y,size);return true;
}
function drawMaskedLowPose(im,id){if(!(id===1&&renderedFighter?.diveMask>0))return false;const col=im===crouchArt?0:im===lowPunchArt?1:im===lowKickArt?2:-1;if(col<0)return false;SpriteAtlas.draw(ctx,maskedSheets[2],0,col,0,0,330);return true;}
function drawDiveProtectionStatus(a){if(!(a.diveMask>0))return;ctx.save();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#15303c';ctx.fillStyle='#b8f3ff';const text='MÁSCARA · '+Math.ceil(a.diveMask/60)+'s',y=clamp(501-a.y,32,515);ctx.strokeText(text,a.x,y);ctx.fillText(text,a.x,y);ctx.strokeStyle='#80e3f788';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,461-a.y,58,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();}

function drawPainterKid(x,y,age){
 ctx.save();ctx.translate(x,y+Math.sin(age*.18)*3);
 const pose=Math.floor(age/7)%3;
 SpriteAtlas.draw(ctx,alcaFinisherArt,1,3+pose,0,70,140);
 // Paint follows the brush, not the fighter's anatomy.
 ctx.strokeStyle=['#ffdb32','#e23bdc','#35cef5'][pose];ctx.lineWidth=4;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(38,-12);ctx.quadraticCurveTo(64,-28,74,-14);ctx.stroke();
 ctx.restore();
}
function drawPsychologyArrows(e,r,t){
 const x=90+(r-90)*t,y=-235;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='#c399ff';ctx.fillStyle='#ffed6b';ctx.lineWidth=4;
 for(let n=0;n<2;n++){
  const d=n?1:-1,yy=n?12:-12;ctx.beginPath();ctx.moveTo(-d*33,yy);ctx.lineTo(d*33,yy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(d*36,yy);ctx.lineTo(d*23,yy-8);ctx.lineTo(d*23,yy+8);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
function drawReverseStatus(a){
 if(!(a.reverse>0))return;
 ctx.save();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#231136';ctx.fillStyle='#e2b8ff';
 const y=clamp(518-a.y,32,518),label='↔ AL REVÉS · '+Math.ceil(a.reverse/60)+'s';ctx.strokeText(label,a.x,y);ctx.fillText(label,a.x,y);
 ctx.restore();
}
