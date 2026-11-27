/* Paripe EX manager v1.
   One central dispatcher for six character supers. Character files only
   register cinematic hooks; they must never replace global combat functions.
   Load after super-defense-v1.js and before the character super scripts.
*/
(function(){
'use strict';
const base={strike,update,draw,updateHud,resetArcade};
const modules=[],byId=new Map(),byKey=new Map();
function activeModule(){return modules.find(m=>m.state.active)||null;}
function register(module){
 if(!module||!Number.isInteger(module.fighterId)||!module.key||
  !module.state||typeof module.state.active!=='boolean'||
  !['canStart','start','update','draw','hud','reset'].every(k=>typeof module[k]==='function'))
  throw Error('[Paripe EX] Invalid super registration');
 if(byId.has(module.fighterId)||byKey.has(module.key))
  throw Error('[Paripe EX] Duplicate fighter/key '+module.key);
 const entry=Object.freeze({...module,defenseKey:module.defenseKey||module.key});
 modules.push(entry);byId.set(entry.fighterId,entry);byKey.set(entry.key,entry);
 return entry;
}
// A super is chosen by fighter ID; a non-EX action delegates straight to
// the original combat engine. This replaces the six nested strike wrappers.
strike=function(a,b,type,power,low){
 const m=type==='special'&&a?byId.get(a.id):null;
 if(m&&activeModule())return false; // Never launch a second EX mid-cinematic.
 if(m&&m.canStart(a,type))
  return m.start.call(this,a,b,type,power,low);
 return base.strike.apply(this,arguments);
};
update=function(dt){
 const m=activeModule();
 if(m){m.update.call(this,dt);return;}
 return base.update.apply(this,arguments);
};
draw=function(){
 const result=base.draw.apply(this,arguments);
 const m=activeModule();
 if(m)m.draw.call(this);
 return result;
};
updateHud=function(){
 const result=base.updateHud.apply(this,arguments);
 // Preserve original registration/cascade order for EX glow and labels.
 for(const m of modules)m.hud.call(this);
 return result;
};
resetArcade=function(){
 // The old nested wrappers reset latest->earliest; preserve that order.
 for(let i=modules.length-1;i>=0;i--){
  const m=modules[i];
  if(m.state.active)window.SUPER_DEFENSE?.end(m.defenseKey);
  m.reset.call(this);
 }
 return base.resetArcade.apply(this,arguments);
};
window.SUPER_MANAGER=Object.freeze({
 register,
 supports:id=>byId.has(id),
 isActive:()=>!!activeModule(),
 activeKey:()=>activeModule()?.key||null,
 list:()=>modules.map(m=>({fighterId:m.fighterId,key:m.key,active:m.state.active}))
});
})();
