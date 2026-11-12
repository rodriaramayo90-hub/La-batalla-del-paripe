/* Keep authored pose corrections local to the affected character/cell. */
const DAMAGE_POSE_SCALE=[.78,.74,.78,.90,.78,.78,.78,.78,.78,.78,.78,.78];
function configureCharacterSprites(){
 configureLucasLowRenderer();
 const substitutions=new WeakMap(),scales=new WeakMap(),baseDraw=SpriteAtlas.draw;
 const put=(map,im,row,col,value)=>{let cells=map.get(im);if(!cells){cells=new Map();map.set(im,cells);}cells.set(row*6+col,value);};
 // These complete bodies share Lucas's portrait mustache, including open mouths.
 for(let col=0;col<6;col++){
  put(substitutions,revisedFinisherArt,0,col,[lucasArt[0],0,col]);
  put(substitutions,actionAtlases[0],2,col,[lucasArt[1],1,col]);
 }
 for(let phase=0;phase<3;phase++){
  put(substitutions,victorySheets[0],1,3+phase,[lucasArt[0],1,phase]);
  put(substitutions,grappleSheets[0],1,3+phase,[lucasArt[0],1,3+phase]);
 }
 put(substitutions,heldSheet,0,3,[lucasArt[1],0,3]);
 // Pain poses were authored closer to the camera than idle poses. Apply a fixed
 // uniform anatomical correction BEFORE measuring floor bounds and rendering.
 // It remains identical throughout hit reaction, KO fall and resting on the floor.
 for(let id=0;id<12;id++){const[sheet,row]=actionMap[id];put(scales,actionAtlases[sheet],row,5,DAMAGE_POSE_SCALE[id]);}
 put(scales,maskedSheets[0],1,5,.92);
 SpriteAtlas.draw=function(c,im,row,col,x,y,size=330){
  const scale=scales.get(im)?.get(row*6+col)||1,replacement=substitutions.get(im)?.get(row*6+col);
  if(replacement)[im,row,col]=replacement;
  return baseDraw.call(this,c,im,row,col,x,y,size*scale);
 };
}
function drawLucasLowPose(im,id){
 if(id!==3)return false;const col=im===crouchArt?0:im===lowPunchArt?1:im===lowKickArt?2:-1;if(col<0)return false;
 SpriteAtlas.draw(ctx,lucasArt[1],0,col,0,0,330);return true;
}

function configureLucasLowRenderer(){
 const drawBase=drawCombatCell;drawCombatCell=function(im,cells,id,height){if(!drawLucasLowPose(im,id))return drawBase(im,cells,id,height);};
}
