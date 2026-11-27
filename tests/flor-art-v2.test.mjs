import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(root,f),'utf8');

function fixture(imagesEnabled=true){
 const samples=[],draws=[],ops=[];
 const ctx=new Proxy({
  createLinearGradient(){return {addColorStop(){}}},
  drawImage(...args){draws.push(args)},
  fillText(...args){ops.push(['text',...args])},
  save(){},restore(){},translate(){},scale(){},rotate(){},
  beginPath(){},closePath(){},moveTo(){},lineTo(){},arc(){},
  rect(){},roundRect(){},ellipse(){},stroke(){},fill(){},
  fillRect(){},clearRect(){},clip(){},strokeText(){},
 },{
  get(target,k){return k in target?target[k]:()=>{};}
 });
 class ImageStub{
  set src(value){
   this._src=value;
   const content=decodeURIComponent(String(value).split(',').slice(1).join(','));
   samples.push(content);
   if(value.startsWith('data:image/svg+xml'))this.onload?.();
  }
  get src(){return this._src}
 }
 const sandbox={
  window:null,document:{createElement(){return {getContext(){return ctx}}}},
  console:{warn(){},error(){}}
 };
 if(imagesEnabled)sandbox.Image=ImageStub;
 sandbox.window=sandbox;
 const context=vm.createContext(sandbox);
 for(const path of ['flor-airport-art-v1.js','flor-airport-art-v2.js','flor-airport-props-v2.js'])
  vm.runInContext(read(path),context,{filename:path,timeout:3000});
 return {ctx,draws,ops,samples,art:sandbox.FLOR_AIRPORT_ART};
}
test('Customs artwork preloads separately illustrated male and female Swiss officers',()=>{
 const f=fixture();
 assert.equal(f.art.version,2);
 assert.equal(f.art.propsVersion,2);
 assert.equal(f.art.illustratedOfficersReady,20);
 assert.equal(f.art.illustratedBackgroundReady,true);
 const svg=f.samples.filter(x=>x.includes('POLIZEI'));
 assert.equal(svg.length,20);
 assert.ok(svg.some(x=>x.includes('ellipse cx="198" cy="102"')));
 assert.ok(svg.some(x=>x.includes('ellipse cx="196" cy="99"')));
 assert.ok(svg.every(x=>x.includes('linearGradient')&&x.includes('POLIZEI')));
});
test('Police pose draw uses real prepared SVG sprite, not old rectangles',()=>{
 const f=fixture();
 f.art.officer(f.ctx,450,460,.8,1,false,0,45);
 f.art.officer(f.ctx,670,460,.8,7,true,1,345);
 assert.equal(f.draws.length,2);
 assert.ok(f.draws[0][0].src.startsWith('data:image/svg+xml'));
 assert.ok(f.draws[1][0].src.startsWith('data:image/svg+xml'));
 assert.notEqual(f.draws[0][0].src,f.draws[1][0].src);
 assert.equal(f.draws[0][3],270);
 assert.equal(f.draws[1][4],360);
});
test('Detailed airport backdrop and customs machinery render with their own assets',()=>{
 const f=fixture();
 f.art.background(f.ctx,210);
 f.art.scanner(f.ctx,315);
 f.art.conveyor(f.ctx,352);
 f.art.luggage(f.ctx,400,430,.8,true);
 f.art.passport(f.ctx,720,240,.5);
 f.art.confiscated(f.ctx,145);
 assert.ok(f.draws.length>=7);
 assert.ok(f.samples.some(x=>x.includes('ZÜRICH AIRPORT')));
 assert.ok(f.samples.some(x=>x.includes('X-RAY / KONTROLLE')));
 assert.ok(f.samples.some(x=>x.includes('PASSPORT')));
 assert.ok(f.samples.some(x=>x.includes('FERNET')||x.includes('F</text>')));
});
test('SVG disabled or no browser image decoder falls back safely to legacy painted scene',()=>{
 const f=fixture(false);
 assert.equal(f.art.illustratedBackgroundReady,false);
 assert.equal(f.art.illustratedOfficersReady,0);
 assert.doesNotThrow(()=>f.art.background(f.ctx,100));
 assert.doesNotThrow(()=>f.art.officer(f.ctx,450,450,.8,1,false,0,100));
 assert.ok(f.art.policeSpritesReady>=1,'Fallback old police canvas produced');
 assert.equal(f.art.backgroundReady,true);
});
test('Flor EX retains original fighter atlas identity and does not scale down opponent',()=>{
 const src=read('flor-super-v1.js');
 assert.match(src,/SpriteAtlas\.draw\(ctx,atlases\[m\[0\]\]/);
 assert.match(src,/SpriteAtlas\.draw\(ctx,sheet,m\[1\]/);
 assert.doesNotMatch(src,/size=315\*\(1-p\*\.45\)/);
 assert.match(src,/drawCinematicFX\(t,verdict\)/);
 assert.match(src,/A\.officer\(ctx,x2,456/);
});
