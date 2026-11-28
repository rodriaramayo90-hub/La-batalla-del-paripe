import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(ROOT,f),'utf8');

function fixture(mode='loaded'){
 const draw=[],fallback=[],loads=[];
 const ctx={
  drawImage(...args){draw.push(args);},
  save(){},restore(){},translate(){},scale(){}
 };
 class FakeImage{
  constructor(){this.naturalWidth=1024;this.naturalHeight=768;}
  set src(value){
   this._src=value;loads.push(value);
   if(mode==='loaded')this.onload?.();
   if(mode==='failed')this.onerror?.();
  }
  get src(){return this._src;}
 }
 const sandbox={
  window:null,console:{warn(){}},
  FLOR_AIRPORT_ART:{
   officer(...args){fallback.push(args)},
   policeArtVersion:2
  }
 };
 if(mode!=='missing')sandbox.Image=FakeImage;
 sandbox.window=sandbox;
 vm.runInContext(read('flor-police-sprites-v3.js'),vm.createContext(sandbox),{timeout:3000});
 return {ctx,draw,fallback,loads,api:sandbox.FLOR_AIRPORT_ART,debug:sandbox.FLOR_POLICE_SPRITES};
}
function webp(path){
 const b=readFileSync(resolve(ROOT,path));
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.equal(b.toString('ascii',12,16),'VP8X');
 const w=1+b[24]+(b[25]<<8)+(b[26]<<16);
 const h=1+b[27]+(b[28]<<8)+(b[29]<<16);
 return {bytes:b.length,w,h};
}
test('Both illustrated police atlas files exist and contain real 1024×768 WebP image data',()=>{
 for(const path of [
  'assets/flor-police-officer-v3.webp',
  'assets/flor-police-officer-female-v3.webp'
 ]){
  const asset=webp(path);
  assert.deepEqual([asset.w,asset.h],[1024,768]);
  assert.ok(asset.bytes>75000,'Atlas too small to contain 12 rendered illustrated poses');
 }
});
test('Two raster atlases preload, replacing the geometric officer renderer',()=>{
 const f=fixture();
 assert.equal(f.debug.ready,true);
 assert.equal(f.debug.loaded,2);
 assert.equal(f.debug.failed,0);
 assert.equal(f.api.policeArtVersion,3);
 assert.equal(f.api.realSpriteAtlasesReady,2);
 assert.equal(f.loads.length,2);
 assert.ok(f.loads.every(p=>p.endsWith('.webp')));
 f.api.officer(f.ctx,475,456,.75,1,false,0,45);
 f.api.officer(f.ctx,680,456,.75,7,true,1,345);
 assert.equal(f.fallback.length,0);
 assert.equal(f.draw.length,2);
 assert.ok(f.draw[0][0].src.includes('officer-v3.webp'));
 assert.ok(f.draw[1][0].src.includes('officer-female-v3.webp'));
});
test('All police poses crop correct 256×256 atlas cell, keeping a constant body size',()=>{
 const f=fixture();
 const expected={0:0,1:2,2:4,3:7,4:8,5:3,6:6,7:10,8:1,9:9};
 const sizes=[];
 for(const variant of [0,1]){
  for(const [pose,frame] of Object.entries(expected)){
   f.api.officer(f.ctx,500,450,.77,Number(pose),false,variant,7);
   const args=f.draw.at(-1);
   const chosen=Number(pose)===8?0:frame;
   assert.equal(args.length,9);
   assert.deepEqual(args.slice(1,5),[(chosen%4)*256,Math.floor(chosen/4)*256,256,256]);
   assert.equal(args[7],args[8],'Image pixel aspect ratio must remain 1:1');
   sizes.push([args[7],args[8]]);
  }
 }
 assert.equal(new Set(sizes.map(x=>x.join('x'))).size,1,
   'Every animation frame must preserve the same on-screen proportions');
 assert.equal(f.fallback.length,0);
});
test('While PNG/WebP is loading, do NOT paint the original rectangular cartoon officers',()=>{
 const f=fixture('pending');
 assert.equal(f.debug.ready,false);
 f.api.officer(f.ctx,400,420,.8,2,false,0,0);
 assert.equal(f.draw.length,0);
 assert.equal(f.fallback.length,0);
});
test('A broken image fails gracefully, without interrupting super-special logic',()=>{
 const f=fixture('failed');
 assert.equal(f.debug.failed,2);
 assert.doesNotThrow(()=>f.api.officer(f.ctx,400,420,.8,2,false,0,0));
 assert.equal(f.fallback.length,1,'Only an actual load failure enables legacy fallback');
});
test('Published HTML preloads both real police atlases and loads the replacement before Flor EX',()=>{
 const html=read('index.html');
 const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 const v3=scripts.findIndex(x=>x.startsWith('flor-police-sprites-v3.js'));
 const flor=scripts.findIndex(x=>x.startsWith('flor-super-v1.js'));
 const props=scripts.findIndex(x=>x.startsWith('flor-airport-props-v2.js'));
 assert.ok(props>=0&&v3>props&&flor>v3);
 assert.equal((html.match(/rel="preload" as="image" href="assets\/flor-police-officer/g)||[]).length,2);
});
