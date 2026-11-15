/* Consistent La Drapie face: victory keeps its existing poses and gestures,
   while the face itself is rendered from the exact in-game combat sprite. */
(function(){
 'use strict';
 if(typeof drawVictoryPose!=='function'||typeof drapieOutfitArt==='undefined'||typeof SpriteAtlas==='undefined')return;
 const originalVictoryPose=drawVictoryPose;
 const sourceFace=drapieOutfitArt[0]; // Actual normal-combat sprite, not a new generated face.
 const headCache=new Map();
 function headTexture(pose,pos){
  if(headCache.has(pose))return headCache.get(pose);
  // Draw the mask once per win pose to avoid canvas allocations each frame.
  const mask=document.createElement('canvas');mask.width=120;mask.height=140;
  const m=mask.getContext('2d');
  const gradient=m.createRadialGradient(60,66,22,60,66,60);
  gradient.addColorStop(0,'rgba(0,0,0,1)');
  gradient.addColorStop(.70,'rgba(0,0,0,1)');
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  m.beginPath();m.ellipse(60,68,50,55,-.07,0,Math.PI*2);m.fillStyle=gradient;m.fill();
  const face=document.createElement('canvas');face.width=120;face.height=140;
  const f=face.getContext('2d');
  f.translate(60-pos[0],70-pos[1]);
  // Draw the original fighting sprite in the *same anatomical scale* as the victory pose.
  SpriteAtlas.draw(f,sourceFace,0,0,0,0,330);
  f.setTransform(1,0,0,1,0,0);
  f.globalCompositeOperation='destination-in';f.drawImage(mask,0,0);
  headCache.set(pose,face);return face;
 }
 drawVictoryPose=function(fighter,size){
  originalVictoryPose.apply(this,arguments);
  if(!fighter||fighter.id!==6||!sourceFace.complete||!sourceFace.naturalWidth)return;
  const pose=[0,1,2,1][Math.floor((fighter.victoryAge||0)/18)%4],u=size/330;
  const pos=[[-5,-276],[1,-280],[-2,-278]][pose];
  const face=headTexture(pose,pos);
  ctx.save();ctx.drawImage(face,(pos[0]-60)*u,(pos[1]-70)*u,120*u,140*u);ctx.restore();
 };
})();