/* Reconstructor de sprites: separa siluetas por transparencia para evitar
   extremidades de la pose vecina y conservar los bordes que cruzan la celda. */
(function(){
'use strict';
const cache=new WeakMap();
function repack(image){
 if(cache.has(image))return cache.get(image);
 const W=image.naturalWidth||image.width,H=image.naturalHeight||image.height;
 if(!W||!H)return null;
 const sw=Math.floor(W/6),sh=Math.floor(H/4),pad=Math.round(Math.min(sw,sh)*.19);
 if(sw<20||sh<20)return null;
 const source=document.createElement('canvas');source.width=W;source.height=H;
 const sc=source.getContext('2d',{willReadFrequently:true});
 if(!sc)return null;
 sc.drawImage(image,0,0);
 const data=sc.getImageData(0,0,W,H).data;
 const total=W*H,labels=new Int32Array(total),queue=new Int32Array(total);
 const owners=[0],ambiguous=[false];let label=0;
 const alphaAt=i=>data[i*4+3];
 for(let i=0;i<total;i++){
  if(labels[i]||alphaAt(i)<=9)continue;
  label++;let head=0,tail=1;queue[0]=i;labels[i]=label;
  const counts=new Uint32Array(24);
  while(head<tail){
   const pos=queue[head++],y=Math.floor(pos/W),x=pos-y*W;
   const cx=Math.min(5,Math.floor(x/sw)),cy=Math.min(3,Math.floor(y/sh));
   counts[cy*6+cx]++;
   for(let oy=-1;oy<=1;oy++){
    const ny=y+oy;if(ny<0||ny>=H)continue;
    for(let ox=-1;ox<=1;ox++){
     if(!ox&&!oy)continue;
     const nx=x+ox;if(nx<0||nx>=W)continue;
     const n=ny*W+nx;
     if(!labels[n]&&alphaAt(n)>9){labels[n]=label;queue[tail++]=n}
    }
   }
  }
  let best=0,first=0,second=0;
  for(let cell=0;cell<24;cell++){
   const count=counts[cell];
   if(count>first){second=first;first=count;best=cell}
   else if(count>second)second=count;
  }
  owners[label]=best;
  // Si dos poses están realmente unidas, preferimos el recorte original
  // a hacer desaparecer por completo una de las siluetas.
  ambiguous[label]=second>250&&second>first*.42;
 }
 const tw=sw+pad*2,th=sh+pad*2,tiles=[],buffers=[];
 for(let i=0;i<24;i++){
  const canvas=document.createElement('canvas');canvas.width=tw;canvas.height=th;
  const context=canvas.getContext('2d');
  if(!context)return null;
  tiles.push(canvas);buffers.push(context.createImageData(tw,th));
 }
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,l=labels[i];if(!l)continue;
  const owner=ambiguous[l]?Math.min(3,Math.floor(y/sh))*6+Math.min(5,Math.floor(x/sw)):owners[l];
  const col=owner%6,row=Math.floor(owner/6);
  const tx=x-col*sw+pad,ty=y-row*sh+pad;
  if(tx<0||tx>=tw||ty<0||ty>=th)continue;
  const from=i*4,to=(ty*tw+tx)*4,buf=buffers[owner].data;
  buf[to]=data[from];buf[to+1]=data[from+1];buf[to+2]=data[from+2];buf[to+3]=data[from+3];
 }
 for(let i=0;i<24;i++)tiles[i].getContext('2d').putImageData(buffers[i],0,0);
 const result={tiles,sw,sh,pad};
 cache.set(image,result);return result;
}
window.SpriteRepair={
 repack,
 get(image,row,col){const pack=cache.get(image);if(!pack)return null;return {canvas:pack.tiles[row*6+col],sw:pack.sw,sh:pack.sh,pad:pack.pad}}
};
})();
