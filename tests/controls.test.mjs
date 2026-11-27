import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(ROOT,f),'utf8');

function fakeElement(key){
 const handlers={};
 return {dataset:{key},handlers,disabled:false,style:{},textContent:'',
  classList:{add(){},remove(){},toggle(){}},addEventListener(t,fn){(handlers[t]??=[]).push(fn);},
  querySelector(){return fakeElement('child')},setPointerCapture(){},setAttribute(){},
  getClientRects(){return [1]},appendChild(){}};
}
function entity(id,x){
 return {id,x,hp:220,meter:100,attack:0,cool:0,stun:0,blockstun:0,
  blocking:false,y:0,vy:0,escaping:0,grabbed:false,grabbing:false,
  parryWindow:0,parryCooldown:0,knockback:0,dir:1};
}
function makeFixture(local=false){
 const buttons=Object.fromEntries(['punch','kick','special','jump','defend'].map(k=>[k,fakeElement(k)]));
 const elements=new Map();const el=k=>{if(!elements.has(k))elements.set(k,fakeElement(k));return elements.get(k)};
 const document={
  addEventListener(){},activeElement:null,hidden:false,
  querySelectorAll:sel=>sel==='[data-key]'?Object.values(buttons):[],
  querySelector:sel=>sel.includes('data-key')?buttons.special:el(sel),
  getElementById:el,createElement:()=>fakeElement('created'),head:{appendChild(){}}
 };
 const pads=[];
 const env={window:null,document,navigator:{getGamepads:()=>pads},
  player:entity(9,240),enemy:entity(2,740),mode:'game',practice:false,
  ending:false,introFrames:0,projectileClash:null,
  keys:{},mapping:{ShiftLeft:'defend',ShiftRight:'defend',KeyJ:'punch',
   KeyK:'kick',Space:'special',ArrowUp:'jump'},
  lastTap:{left:-10000,right:-10000},CHARGE_FRAMES:36,chargeInputs:new Map(),
  effects:[],announcement:'',announceTime:0,score:0,MAX_HP:220,
  console:{warn(){},error(){}},performance:{now:()=>1000},
  $:el,requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  haptic(){},sfx(){},armParry(){},beginCharge(){},releaseCharge(){},
  bufferAction(){},clearActionBuffer(){},cancelCharges(){},
  cancelSecondCharges(){},unlockAudio(){},tryEscape(){},escapeUnit(){},
  captureLowChord(){},latchOnlineJump(){},tapDirection(){},dashUnit(){},
  syncChargeButtons(){},syncPortraitMode(){},posture(){},consumeInput(){},
  movementDirection(){return 0},movementMultiplier(){return 1},
  fighters:Array.from({length:12},(_,i)=>['Fighter'+i,'','','',7])};
 env.window=env;env.addEventListener=()=>{};
 const ctx=vm.createContext(env);
 for(const path of ['local-v52.js','gamepads-v44.js','super-defense-v1.js'])
  vm.runInContext(read(path),ctx,{filename:path,timeout:3000});
 vm.runInContext('LOCAL.active='+local,ctx);
 const evaluate=src=>vm.runInContext(src,ctx,{timeout:3000});
 const tick=(type,t)=>ctx.SUPER_DEFENSE.tick(type,t);
 const start=(type,defender=0)=>ctx.SUPER_DEFENSE.start(type,
  defender===0?ctx.enemy:ctx.player,defender===0?ctx.player:ctx.enemy);
 const result=type=>ctx.SUPER_DEFENSE.result(type);
 const press=(slot,key,source)=>ctx.humanInput(slot,key,true,source);
 const release=(slot,key,source)=>ctx.humanInput(slot,key,false,source);
 return {ctx,pads,buttons,evaluate,tick,start,result,press,release};
}
const pad=(id,index=0,mapping='standard')=>({id,index,mapping,connected:true,
 axes:[0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))});
function padTap(f,p,button,type,time){
 f.evaluate('pollGamepads(1000)');
 p.buttons[button].pressed=true;p.buttons[button].value=1;
 f.evaluate('pollGamepads(1016)');
 f.tick(type,time);
 p.buttons[button].pressed=false;p.buttons[button].value=0;
 f.evaluate('pollGamepads(1032)');
}
function touch(f,key,type,id=5){
 const e={pointerId:id,pointerType:'touch',button:0,preventDefault(){},stopPropagation(){}};
 for(const fn of f.buttons[key].handlers[type]||[])fn(e);
}
test('PS4 L1 and L2 defend cinematics, but R2 is not a guard',()=>{
 for(const [button,expected] of [[4,'partial'],[6,'partial'],[7,'fail']]){
  const f=makeFixture(),p=pad('Wireless Controller (054c)');f.pads.push(p);
  f.start('malefica');padTap(f,p,button,'malefica',178);
  assert.equal(f.result('malefica'),expected,'PS4 button '+button);
 }
});

test('Individual left and right Joy-Cons use the same normalized defense action',()=>{
 for(const id of ['Joy-Con (L)','Joy-Con (R)']){
  const f=makeFixture(),p=pad(id,0,'');f.pads.push(p);
  f.start('malefica');padTap(f,p,4,'malefica',178);
  assert.equal(f.result('malefica'),'partial',id);
 }
});

test('Player two keyboard V blocks; player one Shift cannot block for them',()=>{
 const f=makeFixture(true);
 f.start('coqui',1);
 f.ctx.handleHumanKeyDown({code:'ShiftLeft',repeat:false,preventDefault(){}});
 f.tick('coqui',127);assert.equal(f.result('coqui'),'fail');
 f.ctx.handleHumanKeyDown({code:'KeyV',repeat:false,preventDefault(){}});
 f.tick('coqui',215);assert.equal(f.result('coqui'),'partial');
 f.ctx.handleHumanKeyUp({code:'KeyV',preventDefault(){}});
});

test('Two controllers stay assigned to their own player in VS local',()=>{
 const f=makeFixture(true),p0=pad('Wireless Controller',0),p1=pad('Joy-Con (L)',1,'');
 f.pads.push(p0,p1);
 f.evaluate("LOCAL.controls=['pad:0','pad:1']");
 f.start('coqui',1);
 padTap(f,p0,4,'coqui',127);
 assert.equal(f.result('coqui'),'fail','Attacker pad must not defend');
 padTap(f,p1,4,'coqui',215);
 assert.equal(f.result('coqui'),'partial','Defender pad must defend');
});

test('Holding defense never counts as three perfect taps',()=>{
 const f=makeFixture();f.start('malefica');
 f.press(0,'defend','key-ShiftLeft');
 for(const t of [178,217,256])f.tick('malefica',t);
 assert.equal(f.result('malefica'),'partial');
 f.release(0,'defend','key-ShiftLeft');
 f.ctx.SUPER_DEFENSE.end('malefica');f.start('malefica');
 for(const t of [178,217,256]){
  f.press(0,'defend','key-ShiftLeft');f.tick('malefica',t);
  f.release(0,'defend','key-ShiftLeft');
 }
 assert.equal(f.result('malefica'),'perfect');
 assert.equal(f.ctx.SUPER_DEFENSE.multiplier('malefica'),0);
});

test('Tapping too early fails; correct frame-perfect defense cancels all damage',()=>{
 const f=makeFixture();f.start('trex');
 f.press(0,'defend','key-ShiftLeft');f.tick('trex',145);
 f.release(0,'defend','key-ShiftLeft');f.tick('trex',169);
 assert.equal(f.result('trex'),'fail');
 f.press(0,'defend','key-ShiftLeft');f.tick('trex',169);
 assert.equal(f.result('trex'),'perfect');
 assert.equal(f.ctx.SUPER_DEFENSE.multiplier('trex'),0);
});

test('Touch punch, kick, special and jump complete Drapies QTE in order',()=>{
 const f=makeFixture(),core=read('game-v52.js');
 const a=core.indexOf('const holdButtons=new Map();'),b=core.indexOf('const mapping=',a);
 assert.ok(a>=0&&b>a,'Live touch control block present');
 f.evaluate(core.slice(a,b));
 f.start('drapie');
 for(const [key,t] of [['punch',92],['kick',122],['special',154],['jump',186]]){
  touch(f,key,'pointerdown',t);f.tick('drapie',t);touch(f,key,'pointerup',t);
 }
 assert.equal(f.result('drapie'),'perfect');
});

test('PS4 face buttons □ △ ○ × complete Drapies QTE in order',()=>{
 const f=makeFixture(),p=pad('Wireless Controller (054c)');f.pads.push(p);
 f.start('drapie');
 for(const [button,time] of [[2,90],[3,120],[1,152],[0,185]])
  padTap(f,p,button,'drapie',time);
 assert.equal(f.result('drapie'),'perfect');
});

test('Defense reset cannot replay old presses in a new match',()=>{
 const f=makeFixture();f.start('malefica');
 f.press(0,'defend','key-ShiftLeft');
 f.ctx.resetHumanInputs();
 f.ctx.SUPER_DEFENSE.end('malefica');f.start('malefica');
 f.tick('malefica',178);
 assert.equal(f.result('malefica'),'fail');
 f.press(0,'defend','key-ShiftLeft');f.tick('malefica',178);
 assert.equal(f.result('malefica'),'partial');
});

test('Attacker actions cannot fake the opponent’s timed defense',()=>{
 const f=makeFixture(true);f.start('berga',1);
 f.press(0,'defend','key-ShiftLeft');f.tick('berga',270);
 assert.equal(f.result('berga'),'fail');
 f.press(1,'punch','key-Z');f.tick('berga',270);
 assert.equal(f.result('berga'),'fail');
 f.press(1,'defend','key-V');f.tick('berga',270);
 assert.equal(f.result('berga'),'perfect');
});
