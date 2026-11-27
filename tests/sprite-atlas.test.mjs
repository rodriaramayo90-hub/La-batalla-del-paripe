import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const SPRITES=readFileSync(resolve(ROOT,'sprite-import-v49.js'),'utf8');
class FakeCanvas{
 constructor(w=0,h=0){this._width=w;this._height=h;this.data=new Uint8ClampedArray(w*h*4);}
 get width(){return this._width}
 get height(){return this._height}
 set width(v){this._width=v;this.data=new Uint8ClampedArray(this._width*this._height*4)}
 set height(v){this._height=v;this.data=new Uint8ClampedArray(this._width*this._height*4)}
 getContext(){return new FakeContext(this)}
 toBlob(cb,type){
  assert.equal(type,'image/png','Cache must be lossless, never JPEG');
  cb({size:this.data.length||1,width:this.width,height:this.height,pixels:this.data.slice()});
 }
}
class FakeContext{
 constructor(canvas){this.canvas=canvas;this.calls=[]}
 drawImage(image,...args){
  this.calls.push({image,args});
  let sx=0,sy=0,sw=image.width,sh=image.height,dx=0,dy=0,dw=sw,dh=sh;
  if(args.length===2){[dx,dy]=args;}
  else if(args.length===8){[sx,sy,sw,sh,dx,dy,dw,dh]=args;}
  else throw Error('Unsupported drawImage args '+args.length);
  if(!image.data&&!image.pixels)return;
  // Actual input and packing use unscaled transfers. Draw stage may resize,
  // but this test only needs to inspect geometry and source pixels.
  if(sw!==dw||sh!==dh)return;
  const src=image.data||image.pixels;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
   const ix=(Math.floor(sy+y)*image.width+Math.floor(sx+x))*4;
   const ox=Math.floor(dx+x),oy=Math.floor(dy+y);
   if(ox<0||ox>=this.canvas.width||oy<0||oy>=this.canvas.height)continue;
   const idx=(oy*this.canvas.width+ox)*4;
   this.canvas.data.set(src.slice(ix,ix+4),idx);
  }
 }
 getImageData(){return {data:this.canvas.data.slice()};}
 createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};}
 putImageData(im,dx,dy){
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
   const dest=((y+dy)*this.canvas.width+x+dx)*4;
   this.canvas.data.set(im.data.slice((y*im.width+x)*4,(y*im.width+x)*4+4),dest);
  }
 }
}
function sourceImage(name,second=true){
 const width=32,height=16,data=new Uint8ClampedArray(width*height*4);
 const set=(x,y,r,g,b)=>{const i=(y*width+x)*4;data.set([r,g,b,255],i)};
 for(let y=2;y<=11;y++)for(let x=3;x<=9;x++)set(x,y,245,30,30);
 // Detached arm crosses from cell 0 into cell 1 and must stay with pose 0.
 for(let x=10;x<=17;x++)set(x,6,245,30,30);
 if(second)for(let y=3;y<=12;y++)for(let x=22;x<=28;x++)set(x,y,40,70,230);
 return {src:'assets/'+name+'.webp',currentSrc:'',width,height,naturalWidth:width,
  naturalHeight:height,complete:true,spriteRows:1,spriteCols:2,
  data,decode:()=>Promise.resolve()};
}
function moduleFixture(withDB=false){
 const records=new Map();
 const sandbox={
  window:null,document:{createElement:()=>new FakeCanvas()},
  console:{warn(){}},Image:class {},
  createImageBitmap:async image=>({
   width:image.width,height:image.height,
   pixels:(image.data||image.pixels).slice()
  })
 };
 if(withDB){
  sandbox.setTimeout=setTimeout;sandbox.clearTimeout=clearTimeout;
  sandbox.indexedDB={open:()=>{
   const request={};
   queueMicrotask(()=>{
    const db={
     objectStoreNames:{contains:()=>true},
     createObjectStore(){},
     transaction:()=>{
      const tx={};
      tx.objectStore=()=>({
       get:key=>{
        const req={};
        queueMicrotask(()=>{req.result=records.get(key)||null;req.onsuccess?.()});
        return req;
       },
       put:(value,key)=>{
        records.set(key,value);queueMicrotask(()=>tx.oncomplete?.());
        return {};
       }
      });
      return tx;
     }
    };
    request.result=db;request.onsuccess?.();
   });
   return request;
  }};
 }
 sandbox.window=sandbox;
 vm.runInContext(SPRITES,vm.createContext(sandbox),{filename:'sprite-import-v49.js',timeout:3000});
 return {atlas:sandbox.SpriteAtlas,records};
}
test('Packed atlas retains original frame proportions and keeps a crossed-arm pixel',async()=>{
 const {atlas}=moduleFixture();
 const image=sourceImage('crossing-arm');
 const reports=await atlas.prepare([image]);
 assert.equal(reports.length,1);
 assert.equal(reports[0].fallback,false);
 assert.equal(reports[0].extendedFrames.length>0,true);
 assert.equal(atlas.stats.parsed,1);
 const renderer=new FakeContext(new FakeCanvas(1000,1000));
 atlas.draw(renderer,image,0,0,480,463,300);
 atlas.draw(renderer,image,0,1,480,463,300);
 const [first,second]=renderer.calls;
 assert.equal(first.args.length,8,'Packed sprites use source rectangle cropping');
 assert.equal(second.args.length,8);
 // First pose still includes the arm in cell 1; it wasn't cut at x=16.
 assert.equal(first.args[2],15);
 assert.ok(first.args[2]>image.width/2-3);
 // Its absolute placement follows the original anchor, never stretch-to-fit.
 assert.equal(first.args[6],(15/16)*300*(16/16));
 assert.ok(first.image.pixels.some((p,i)=>i%4===0&&p===245));
});
test('Repeated prepare on same image skips expensive extraction',async()=>{
 const {atlas}=moduleFixture();const image=sourceImage('same-sheet');
 await atlas.prepare([image]);await atlas.prepare([image]);
 assert.equal(atlas.stats.parsed,1);
});
test('A damaged/incomplete sprite sheet falls back without blocking the game',async()=>{
 const {atlas}=moduleFixture();const img=sourceImage('one-pose-only',false);
 const [report]=await atlas.prepare([img]);
 assert.equal(report.fallback,true);
 const renderer=new FakeContext(new FakeCanvas(1000,1000));
 assert.doesNotThrow(()=>atlas.draw(renderer,img,0,1,0,0,330));
 assert.equal(renderer.calls.at(-1).image,img,'Uses original grid for missing frame');
});
test('Versioned persistent PNG cache reopens packed frames without pixel scans',async()=>{
 const fixture=moduleFixture(true),image=sourceImage('persist-once');
 await fixture.atlas.prepare([image]);
 await fixture.atlas.whenCacheSettled();
 assert.equal(fixture.atlas.stats.stored,1);
 assert.equal(fixture.records.size,1);
 const entry=[...fixture.records.values()][0];
 assert.equal(entry.frames.length,2);
 assert.equal(entry.blob.pixels.length,entry.width*entry.height*4);
 // Same module, new Image object (same src) exercises IndexedDB restore.
 const another=sourceImage('persist-once');
 await fixture.atlas.prepare([another]);
 assert.equal(fixture.atlas.stats.parsed,1);
 assert.equal(fixture.atlas.stats.reused,1);
 assert.equal(fixture.atlas.reportFor(another).fromCache,true);
 const renderer=new FakeContext(new FakeCanvas(1000,1000));
 fixture.atlas.draw(renderer,another,0,0,400,460,300);
 assert.equal(renderer.calls.length,1);
});
