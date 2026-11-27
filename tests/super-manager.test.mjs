import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');

function makeManager(){
 const log=[];
 const s={window:null,
  strike(...args){log.push(['baseStrike',args[2]]);return 'normal'},
  update(dt){log.push(['baseUpdate',dt])},
  draw(){log.push(['baseDraw']);return 42},
  updateHud(){log.push(['baseHud'])},
  resetArcade(){log.push(['baseReset']);return 'base reset'}
 };
 s.window=s;s.SUPER_DEFENSE={end:k=>log.push(['endDefense',k])};
 vm.runInContext(read('super-manager-v1.js'),vm.createContext(s),{timeout:3000});
 return {s,log};
}
function register(f,id,key){
 const state={active:false};
 f.s.SUPER_MANAGER.register({fighterId:id,key,state,
  canStart:(a,type)=>a.meter>=100&&type==='special',
  start(a){state.active=true;f.log.push(['superStrike',key]);a.meter=0;return true;},
  update:dt=>f.log.push(['superTick',key,dt]),
  draw:()=>f.log.push(['superDraw',key]),
  hud:()=>f.log.push(['superHud',key]),
  reset:()=>{f.log.push(['superReset',key]);state.active=false;}
 });
 return state;
}
test('Manager selects EX by fighter ID without wrapping core strike for each hero',()=>{
 const f=makeManager();register(f,1,'trex');register(f,9,'malefica');
 assert.equal(f.s.SUPER_MANAGER.supports(1),true);
 assert.equal(f.s.SUPER_MANAGER.supports(9),true);
 assert.equal(f.s.SUPER_MANAGER.supports(3),false);
 assert.equal(f.s.strike({id:9,meter:0},null,'special'), 'normal');
 assert.equal(f.s.strike({id:3,meter:100},null,'special'),'normal');
 const hero={id:1,meter:100};
 assert.equal(f.s.strike(hero,null,'special'),true);
 assert.equal(hero.meter,0);
 assert.equal(f.s.SUPER_MANAGER.activeKey(),'trex');
 assert.equal(f.s.strike({id:9,meter:100},null,'special'),false,
  'A second EX cannot start while a cinematic is running');
 assert.deepEqual(f.log.filter(x=>x[0]==='superStrike'),[['superStrike','trex']]);
});
test('Manager updates only the active EX and renders base game before cinematic',()=>{
 const f=makeManager();const s=register(f,2,'coqui');
 f.s.update(3);assert.deepEqual(f.log,[['baseUpdate',3]]);
 f.log.length=0;s.active=true;
 f.s.update(2);assert.deepEqual(f.log,[['superTick','coqui',2]]);
 f.log.length=0;assert.equal(f.s.draw(),42);
 assert.deepEqual(f.log,[['baseDraw'],['superDraw','coqui']]);
 f.log.length=0;f.s.updateHud();
 assert.deepEqual(f.log,[['baseHud'],['superHud','coqui']]);
});
test('Reset runs registered supers in the legacy reverse order and cleans their QTE',()=>{
 const f=makeManager();const a=register(f,1,'trex'),b=register(f,2,'coqui');
 b.active=true;
 const result=f.s.resetArcade();
 assert.equal(result,'base reset');
 assert.deepEqual(f.log,[['endDefense','coqui'],['superReset','coqui'],
  ['superReset','trex'],['baseReset']]);
 assert.equal(a.active,false);assert.equal(b.active,false);
 assert.equal(f.s.SUPER_MANAGER.activeKey(),null);
});
test('Manager rejects duplicate or malformed registrations',()=>{
 const f=makeManager();register(f,1,'trex');
 const make=(fighterId,key)=>({fighterId,key,state:{active:false},
  canStart(){},start(){},update(){},draw(){},hud(){},reset(){}});
 assert.throws(()=>f.s.SUPER_MANAGER.register(make(1,'other')),/Duplicate/);
 assert.throws(()=>f.s.SUPER_MANAGER.register(make(2,'trex')),/Duplicate/);
 assert.throws(()=>f.s.SUPER_MANAGER.register({fighterId:4,key:'x'}),/Invalid/);
});
test('All six production supers register instead of overwriting global lifecycle functions',()=>{
 const scripts=['trex-super-v1.js','drapie-super-v1.js','alcahueta-super-v1.js',
  'berga-super-v1.js','malefica-super-v1.js','coqui-super-v1.js'];
 for(const path of scripts){
  const source=read(path);
  assert.match(source,/SUPER_MANAGER\.register\(/,'Missing registration in '+path);
  assert.doesNotMatch(source,/(?:^|\n)\s*(?:strike|update|draw|updateHud|resetArcade)\s*=\s*function\b/m,
   'Nested global combat wrapper remains in '+path);
 }
 const training=read('training-special-controls-v1.js');
 assert.match(training,/SUPER_MANAGER\?\.supports\(id\)/);
 assert.match(training,/SUPER_MANAGER\?\.isActive\(\)/);
});

function hero(id,x=230){
 return {id,x,dir:x<480?1:-1,hp:220,meter:100,attack:0,attackLength:0,
  attackType:'',cool:0,stun:0,blockstun:0,blocking:false,escaping:0,
  grabbed:false,grabbing:false,y:0,vy:0,legGone:false,moving:false,
  parryWindow:0,invuln:0};
}
function fullGame(){
 const sandbox={
  window:null,document:{createElement:()=>({textContent:'',style:{},setAttribute(){}}),
   head:{appendChild(){}},querySelector:()=>null,getElementById:()=>null},
  Image:class {constructor(){this.complete=false;this.naturalWidth=0;}set src(v){this._src=v;}get src(){return this._src;}},
  fetch:()=>Promise.resolve({ok:false,status:404,text:async()=>''}),
  console:{warn(){},error(){}},player:null,enemy:null,practice:false,
  mode:'game',ONLINE:{active:false},LOCAL:{active:false},SECOND:{actions:[]},
  ending:false,introFrames:0,projectileClash:null,castSerial:0,exFlash:0,
  announcement:'',announceTime:0,score:0,shake:0,hitstop:0,
  MAX_HP:220,soundEnabled:false,ctx:{},effects:[],
  haptic(){},sfx(){},clearActionBuffer(){},cancelCharges(){},
  cancelSecondCharges(){},audio:{playVoice(){}},cancelSpeech(){},finish(){},
  $:()=>null,clamp:(v,a,b)=>Math.max(a,Math.min(v,b)),
  strike(){return false},update(){},draw(){},updateHud(){},resetArcade(){},
  SUPER_DEFENSE:{start(){},tick(){},end(){},notice(){},draw(){},
   result(){return 'fail'},multiplier(){return 1}}
 };
 sandbox.window=sandbox;
 const context=vm.createContext(sandbox);
 const modules=['trex-super-v1.js','drapie-super-v1.js','alcahueta-super-v1.js',
  'berga-super-v1.js','malefica-super-v1.js','coqui-super-v1.js'];
 for(const file of ['super-manager-v1.js',...modules])
  vm.runInContext(read(file),context,{filename:file,timeout:3000});
 return sandbox;
}
test('All six real supers initialize, run a tick, and reset through one dispatcher',()=>{
 const s=fullGame();
 const roster=[[1,'trex'],[6,'drapie'],[0,'alca'],[5,'berga'],
  [9,'malefica'],[2,'coqui']];
 assert.deepEqual(Array.from(s.SUPER_MANAGER.list(),m=>m.key),roster.map(x=>x[1]));
 for(const [id,key] of roster){
  s.player=hero(id);s.enemy=hero(3,730);
  assert.equal(s.strike(s.player,s.enemy,'special',false,false),true,key+' must launch');
  assert.equal(s.SUPER_MANAGER.activeKey(),key,key+' is active');
  assert.equal(s.player.meter,0,key+' spends full EX meter');
  const before=s.player.attack;
  s.update(1);
  assert.ok(s.player.attack<before,key+' must advance its animation');
  s.resetArcade();
  assert.equal(s.SUPER_MANAGER.activeKey(),null,key+' must reset');
 }
});
