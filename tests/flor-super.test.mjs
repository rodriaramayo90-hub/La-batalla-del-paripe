import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(root,f),'utf8');

function canvas(log){
 const gradient=()=>({addColorStop(){}});
 return new Proxy({globalAlpha:1,fillText:(x)=>log.text.push(String(x)),
  strokeText:(x)=>log.text.push(String(x)),
  drawImage:(...a)=>log.images.push(a),createLinearGradient:gradient,
  createRadialGradient:gradient},{
  get(o,k){return k in o?o[k]:()=>{};}
 });
}
function fighter(id,x){
 return {id,x,dir:x<480?1:-1,hp:220,meter:100,attack:0,attackLength:0,
  attackType:'',cool:0,stun:0,blockstun:0,blocking:false,escaping:0,
  grabbed:false,grabbing:false,legGone:false,moving:false,
  y:0,vy:0,parryWindow:0,invuln:0};
}
function fixture({human=true,practice=false,secondActor=false}={}){
 const log={text:[],images:[],sprited:[],baseStrikes:0,finishes:[]};
 const context=canvas(log);
 const doc={
  createElement:()=>({width:0,height:0,getContext:()=>canvas(log)}),
  head:{appendChild(){}},querySelector:()=>null,getElementById:()=>null
 };
 const env={
  window:null,document:doc,ctx:context,
  player:fighter(secondActor?3:7,225),enemy:fighter(secondActor?7:3,735),
  ONLINE:{active:false},LOCAL:{active:human,paused:false},
  SECOND:{actions:[]},mode:'game',practice,
  introFrames:0,ending:false,projectileClash:null,
  castSerial:0,MAX_HP:220,soundEnabled:false,
  score:0,shake:0,hitstop:0,announcement:'',announceTime:0,exFlash:0,
  effects:[],console:{warn(){},error(){}},
  atlasMap:[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[0,3],[2,1],[1,3],[2,2],[2,3]],
  actionMap:[[0,0],[0,1],[1,0],[0,2],[1,1],[1,2],[2,0],[0,3],[2,1],[1,3],[2,2],[2,3]],
  atlases:[{name:'atlas0'},{name:'atlas1'},{name:'atlas2'}],
  actionAtlases:[{name:'actions0'},{name:'actions1'},{name:'actions2'}],
  SpriteAtlas:{draw(_ctx,sheet,row,col,x,y,size){log.sprited.push({sheet:sheet.name,row,col,size});}},
  strike(_a,_b,type){log.baseStrikes++;return type;},
  update(){},draw(){},updateHud(){},resetArcade(){},
  clearActionBuffer(){},cancelCharges(){},cancelSecondCharges(){},
  haptic(){},sfx(){},finish(win){log.finishes.push(win)},
  clamp:(v,a,b)=>Math.max(a,Math.min(v,b)),$:()=>null
 };
 env.window=env;
 const contextVM=vm.createContext(env);
 for(const script of ['super-defense-v1.js','super-manager-v1.js',
  'flor-airport-art-v1.js','flor-super-v1.js']){
  vm.runInContext(read(script),contextVM,{filename:script,timeout:3000});
 }
 const actor=secondActor?env.enemy:env.player;
 const opponent=secondActor?env.player:env.enemy;
 const defenderSlot=secondActor?0:1;
 return {
  env,actor,opponent,defenderSlot,log,
  start:()=>env.strike(actor,opponent,'special',false,false),
  tickTo:t=>{env.FLOR_SUPER.t=t-.82;env.update(1)},
  pressAt:(i,action)=>{
   const times=[188,229,269],key=action||['punch','kick','special'][i];
   env.SUPER_DEFENSE.input(defenderSlot,key,true,'key-'+key);
   env.FLOR_SUPER.t=times[i]-.82;env.update(1);
   env.SUPER_DEFENSE.input(defenderSlot,key,false,'key-'+key);
  }
 };
}
test('Flor super is registered, costs all meter and leaves Paletazo intact',()=>{
 const f=fixture();
 assert.equal(f.env.SUPER_MANAGER.supports(7),true);
 assert.equal(f.env.strike(f.actor,f.opponent,'punch'),'punch');
 assert.equal(f.log.baseStrikes,1);
 assert.equal(f.start(),true);
 assert.equal(f.actor.meter,0);
 assert.equal(f.actor.attackType,'flor-super');
 assert.equal(f.env.SUPER_MANAGER.activeKey(),'flor');
 assert.equal(f.log.baseStrikes,1);
 assert.equal(f.env.strike(f.actor,f.opponent,'special'),false);
});
test('Failed passport checks deport the real rival and remove 48% HP',()=>{
 const f=fixture();f.start();
 f.tickTo(293);f.tickTo(380);
 assert.equal(f.env.SUPER_DEFENSE.result('flor'),'fail');
 assert.equal(f.env.FLOR_SUPER.verdict,'fail');
 assert.ok(Math.abs(f.opponent.hp-(220-220*.48))<1e-8);
 f.env.FLOR_SUPER.t=390;f.env.draw();
 assert.ok(f.log.sprited.some(x=>x.row===3),'Flor original atlas required');
 assert.ok(f.log.sprited.some(x=>x.row===2),'Real opponent original atlas required');
 assert.ok(f.log.text.some(x=>x.includes('DEPORTADO')));
 assert.equal(f.env.FLOR_AIRPORT_ART.backgroundReady,true);
 assert.ok(f.env.FLOR_AIRPORT_ART.policeSpritesReady>=2);
});
test('One or two correct passport checks prevent deportation but cost 24% HP',()=>{
 for(const success of [1,2]){
  const f=fixture();f.start();
  for(let i=0;i<success;i++)f.pressAt(i);
  f.tickTo(293);f.tickTo(380);
  assert.equal(f.env.SUPER_DEFENSE.result('flor'),'partial');
  assert.ok(Math.abs(f.opponent.hp-(220-220*.24))<1e-8);
  f.env.FLOR_SUPER.t=386;f.env.draw();
  assert.ok(f.log.text.some(x=>x.includes('LIBERADO CON RETRASO')));
 }
});
test('Three accurately timed controls make Swiss police arrest Flor instead',()=>{
 const f=fixture();f.start();
 for(let i=0;i<3;i++)f.pressAt(i);
 f.tickTo(293);f.tickTo(380);
 assert.equal(f.env.SUPER_DEFENSE.result('flor'),'perfect');
 assert.equal(f.env.SUPER_DEFENSE.multiplier('flor'),0);
 assert.equal(f.opponent.hp,220);
 f.env.FLOR_SUPER.t=402;assert.doesNotThrow(()=>f.env.draw());
 assert.ok(f.log.text.some(x=>x.includes('DETENIDA OTRA VEZ')));
 assert.ok(f.log.text.some(x=>x.includes('¡PERO OTRA VEZ YO, BOLUDO!')));
});
test('Wrong buttons or button-mashing cannot create perfect verdict',()=>{
 const f=fixture();f.start();
 for(const a of ['punch','kick','special'])f.env.SUPER_DEFENSE.input(1,a,true,'pad-'+a);
 f.tickTo(188);
 for(const a of ['punch','kick','special'])f.env.SUPER_DEFENSE.input(1,a,false,'pad-'+a);
 f.pressAt(1);f.pressAt(2);f.tickTo(293);
 assert.equal(f.env.SUPER_DEFENSE.result('flor'),'partial');
 f.tickTo(380);
 assert.ok(Math.abs(f.opponent.hp-(220-220*.24))<1e-8);
});
test('Campaign meter rules, practice meter bypass and clean EX reset',()=>{
 const f=fixture({human:false});
 f.actor.meter=99;assert.equal(f.start(),'special');
 assert.equal(f.env.SUPER_MANAGER.isActive(),false);
 f.actor.meter=100;assert.equal(f.start(),true);
 f.env.resetArcade();assert.equal(f.env.SUPER_MANAGER.isActive(),false);
 const p=fixture({practice:true});
 p.actor.meter=0;assert.equal(p.start(),true);
 p.env.resetArcade();assert.equal(p.env.SUPER_MANAGER.isActive(),false);
});
test('VS local Flor player two is defendable by player one',()=>{
 const f=fixture({secondActor:true});f.start();
 for(let i=0;i<3;i++)f.pressAt(i);
 f.tickTo(380);
 assert.equal(f.env.SUPER_DEFENSE.result('flor'),'perfect');
 assert.equal(f.opponent.hp,220);
});
test('All airport, police and baggage animation phases render for all endings',()=>{
 for(const verdict of ['fail','partial','perfect']){
  const f=fixture();f.start();
  if(verdict==='partial')f.pressAt(0);
  if(verdict==='perfect')for(let i=0;i<3;i++)f.pressAt(i);
  f.tickTo(294);
  for(const time of [0,25,48,85,124,159,180,238,277,302,328,355,378,390,406,428]){
   f.env.FLOR_SUPER.t=time;
   assert.doesNotThrow(()=>f.env.draw(),verdict+' frame '+time);
  }
  assert.ok(f.log.text.some(x=>x.includes('ZÜRICH AIRPORT')));
  assert.ok(f.log.text.some(x=>x.includes('POLIZEI')));
  assert.ok(f.log.images.length>20);
 }
});
