/* Whole-body substitutions share a fixed anatomical unit across pose families. */
function configureCharacterSprites(){
 configureLucasLowRenderer();
 drawMaskedLowPose=function(im,id){if(!(id===1&&renderedFighter?.diveMask>0))return false;const col=im===crouchArt?3:im===lowPunchArt?4:im===lowKickArt?5:-1;if(col<0)return false;SpriteAtlas.draw(ctx,maskStages,1,col,0,0,330);return true;};
 const substitutions=new WeakMap(),baseDraw=SpriteAtlas.draw;
 const put=(map,im,row,col,value)=>{let cells=map.get(im);if(!cells){cells=new Map();map.set(im,cells);}cells.set(row*6+col,value);};
 // Preserve complete original drawings; never composite faces or mouths.
 for(let col=0;col<6;col++){
  put(substitutions,revisedFinisherArt,0,col,[lucasArt[0],0,col]);
  put(substitutions,actionAtlases[0],2,col,[lucasArt[1],1,col]);
 }
 for(let phase=0;phase<3;phase++){
  put(substitutions,victorySheets[0],1,3+phase,[lucasArt[0],1,phase]);
  put(substitutions,grappleSheets[0],1,3+phase,[lucasArt[0],1,3+phase]);
 }
 put(substitutions,heldSheet,0,3,[lucasArt[1],0,3]);
 const [drapieMoves,drapieAttacks,drapieReactions,drapieFall]=drapieOutfitArt;
 for(let col=0;col<6;col++){
  put(substitutions,atlases[2],0,col,[drapieMoves,0,col]);
  put(substitutions,actionAtlases[2],0,col,[drapieMoves,1,col]);
 }
 for(let phase=0;phase<3;phase++){
  put(substitutions,finisherAtlases[2],0,phase,[drapieAttacks,1,phase]);
  put(substitutions,finisherAtlases[6],0,3+phase,[drapieAttacks,1,3+phase]);
  put(substitutions,grappleSheets[1],1,phase,[drapieReactions,0,phase]);
  put(substitutions,heldStages[1],1,phase,[drapieReactions,0,3+phase]);
  put(substitutions,victorySheets[1],1,phase,[drapieReactions,1,phase]);
  put(substitutions,fallArt[1],1,phase,[drapieFall,0,phase]);
 }
 SpriteAtlas.draw=function(c,im,row,col,x,y,size=330){
  const replacement=substitutions.get(im)?.get(row*6+col);if(replacement)[im,row,col]=replacement;
  const scale=poseScale(im,row,col);
  baseDraw.call(this,c,im,row,col,x,y,size*scale);
 };
}
function drawLucasLowPose(im,id){
 if(id!==3)return false;const col=im===crouchArt?0:im===lowPunchArt?1:im===lowKickArt?2:-1;if(col<0)return false;
 SpriteAtlas.draw(ctx,lucasArt[1],0,col,0,0,330);return true;
}

// Bent torsos and foreshortened shoulders cannot determine a fighter's scale.
// Match the original head's anatomical unit for stance/action families, with
// one shared factor throughout the three punch phases. All scaling is uniform.
function poseScale(im,row,col){
 const name=im.src.split('/').pop(),stance=name.startsWith('actions-')||name==='lucas-actions-v45.webp';
 return (stance||name.startsWith('fall-')||name==='phone-v48.webp')?(POSE_SCALES[name]?.[row*6+col]||1):(BODY_FACTORS[name]?.[row*6+col]||1);
}
const LOW_TEXTURES=new WeakMap();
function lowPoseTexture(im,cell,id,unit){
 let textures=LOW_TEXTURES.get(im);if(!textures){textures=new Map();LOW_TEXTURES.set(im,textures);}if(textures.has(id))return textures.get(id);
 // The low-pose sheets were drawn at a much higher resolution than the normal
 // sheets. Use the same texels per anatomical unit, avoiding a sharp cutout
 // appearing in place of a softer standing sprite. Keep the original full body.
 const [sheet]=atlasMap[id],density=atlases[sheet].height/4/330,w=cell.w*unit*density,h=cell.h*unit*density;
 const surface=document.createElement('canvas');surface.width=Math.ceil(w);surface.height=Math.ceil(h);const c=surface.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,cell.x,cell.y,cell.w,cell.h,0,0,w,h);
 const texture={surface,w,h};textures.set(id,texture);return texture;
}
function configureLucasLowRenderer(){
 drawCombatCell=function(im,cells,id,height){
  if(drawLucasLowPose(im,id)||drawMaskedLowPose(im,id))return;
  if(id===6){
   const col=im===crouchArt?3:im===lowPunchArt?4:5;
   SpriteAtlas.draw(ctx,drapieOutfitArt[2],1,col,0,0,330);
   return;
  }
  const cell=cells?.[id];if(!cell)return;const key=im.src.split('/').pop(),factor=POSE_SCALES[key]?.[id]||1,unit=330/(im.height/3)*factor,w=cell.w*unit,h=cell.h*unit;
  const gw=im.width/4,gx=id%4*gw,texture=lowPoseTexture(im,cell,id,unit);ctx.drawImage(texture.surface,0,0,texture.w,texture.h,(cell.x-gx-gw/2)*unit,-h,w,h);
 };
}

function normalizePhonePoses(){
 const c=document.createElement('canvas');c.width=c.height=700;const x=c.getContext('2d',{willReadFrequently:true}),scales=POSE_SCALES[phoneArt.src.split('/').pop()];
 for(let row=0;row<2;row++)for(let col=0;col<6;col++){x.clearRect(0,0,700,700);SpriteAtlas.draw(x,phoneArt,row,col,350,600,330);const d=x.getImageData(0,0,700,700).data;let top=700,bottom=0;for(let y=0;y<700;y++)for(let px=0;px<700;px++)if(d[(y*700+px)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y);}scales[row*6+col]*=(CHARACTER_HEIGHTS[1]+(row?15:0))/(bottom-top);}
 c.width=c.height=0;
}
