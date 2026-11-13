/* A character has one facial texture; poses provide only its attachment point. */
const FACE_TEXTURES=[];
async function prepareFaceRig(){
 const images=new Map(allImages.map(im=>[im.src.split('/').pop(),im]));
 for(let id=0;id<12;id++){
  const[name,row,col,f]=FACE_REFERENCES[id],im=images.get(name),cw=im.width/6,ch=im.height/4;
  const sx=col*cw+f.center[0]-f.width*.68,sy=row*ch+f.center[1]-f.height*.62,sw=f.width*1.36,sh=f.height*1.24;
  const c=document.createElement('canvas');c.width=Math.ceil(sw*4);c.height=Math.ceil(sh*4);const q=c.getContext('2d',{willReadFrequently:true});q.scale(4,4);q.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
  const image=new Image();image.src=c.toDataURL('image/png');await image.decode();
  const variants=[image];
  const mouth=[(f.landmarks[3][0]+f.landmarks[4][0])/2-(sx-col*cw),(f.landmarks[3][1]+f.landmarks[4][1])/2-(sy-row*ch)];
  for(let expression=1;expression<4;expression++){
   q.clearRect(0,0,sw,sh);q.drawImage(image,0,0,sw,sh);
   if(expression===1&&![1,4,8,9].includes(id)){
    const sample=q.getImageData(Math.round((f.center[0]-(sx-col*cw)) *4),Math.round((f.center[1]+f.height*.16-(sy-row*ch))*4),1,1).data;q.fillStyle=`rgb(${sample[0]} ${sample[1]} ${sample[2]})`;
    for(const eye of f.landmarks.slice(0,2)){const ex=eye[0]-(sx-col*cw),ey=eye[1]-(sy-row*ch);q.beginPath();q.ellipse(ex,ey,f.width*.12,f.height*.065,0,0,Math.PI*2);q.fill();q.strokeStyle='#39231e';q.lineWidth=.65;q.beginPath();q.moveTo(ex-f.width*.10,ey);q.quadraticCurveTo(ex,ey+f.height*.025,ex+f.width*.10,ey);q.stroke();}
   }else if(expression>1){const rx=f.width*.18,ry=f.height*(expression===2?.125:.075);q.fillStyle='#3a1420';q.beginPath();q.ellipse(mouth[0],mouth[1]+ry*.65,rx,ry,0,0,Math.PI*2);q.fill();q.fillStyle='#fff1db';q.fillRect(mouth[0]-rx*.65,mouth[1]+ry*.05,rx*1.3,ry*.4);}
   const variant=new Image();variant.src=c.toDataURL('image/png');await variant.decode();variants.push(variant);
  }
  FACE_TEXTURES[id]={image,variants,width:image.width/4/ch*330,height:image.height/4/ch*330,angle:f.angle,faceWidth:f.width/ch*330,faceHeight:f.height/ch*330};c.width=c.height=0;
 }
}
function drawFaceRig(c,im,row,col,x,y,size,bodyScale=1,cols=6,rows=im.spriteRows||4){
 const name=im.src.split('/').pop(),f=FACE_FRAMES[name]?.[row*cols+col];if(!f||!FACE_TEXTURES[f[0]])return;
 const head=FACE_TEXTURES[f[0]],ss=size*bodyScale,aspect=(im.width/cols)/(im.height/rows),px=x+(f[1]-aspect/2)*ss,py=y+(f[2]-1)*ss,unit=size/330;
 const masked=name.startsWith('mask-')||name==='phone-v48.webp'&&row===1,rx=masked?Math.min(head.faceWidth*.64*unit,f[3]*ss*.45):head.faceWidth*.64*unit,ry=masked?Math.min(head.faceHeight*.60*unit,f[4]*ss*.45):head.faceHeight*.60*unit;c.save();c.translate(px,py);c.rotate(f[5]-head.angle);c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.clip();const actor=typeof renderedFighter==='undefined'?null:renderedFighter,expression=actor?.hp<=0?1:actor?.phoneVictory&&actor.phoneFrame>=4?2:actor?.attackType==='special'&&actor.attack>0?2:actor?.victory?3:0;c.drawImage(head.variants[expression],-head.width*unit/2,-head.height*unit/2,head.width*unit,head.height*unit);if(masked){c.fillStyle="rgba(185,229,255,.12)";c.fillRect(-head.width*unit/2,-head.height*unit/2,head.width*unit,head.height*unit);}c.restore();
}
