const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const random=()=>crypto.randomUUID().replaceAll('-','');
const originOK=o=>!o||o==='https://rodriaramayo90-hub.github.io'||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
export default{async fetch(req,env){
 const url=new URL(req.url),origin=req.headers.get('origin');if(!originOK(origin))return json({error:'Origen no permitido'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers:{'access-control-allow-origin':origin||'*','access-control-allow-methods':'POST,GET,OPTIONS','access-control-allow-headers':'content-type'}});
 let response;
 if(url.pathname==='/health')response=json({ok:true});
 else if(url.pathname==='/rooms'&&req.method==='POST'){
  const code=random().slice(0,10).toUpperCase();response=await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request('https://room/create',{method:'POST',body:JSON.stringify({...await req.json(),code})}));
 }else{const match=url.pathname.match(/^\/rooms\/([A-Z0-9]{10})\/(join|ws)$/);if(!match)return json({error:'Sala no encontrada'},404);response=await env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(new Request('https://room/'+match[2]+url.search,req));}
 if(response.status===101)return response;
 const headers=new Headers(response.headers);headers.set('access-control-allow-origin',origin||'*');headers.set('vary','Origin');return new Response(response.body,{status:response.status,headers});
}};
export class Room{
 constructor(ctx){this.ctx=ctx;this.room=null;this.sockets=new Map();this.lastFrame=0;}
 broadcast(type,data={}){const msg=JSON.stringify({type,...data});for(const ws of this.sockets.values())try{ws.send(msg)}catch(_){}}
 view(){const r=this.room;return{code:r.code,bestOf:r.bestOf,wins:r.wins,round:r.round,phase:r.phase,players:r.players.map(p=>({role:p.role,character:p.character,ready:p.ready,connected:this.sockets.has(p.role)}))};}
 async fetch(req){
 const u=new URL(req.url);
 if(u.pathname==='/create'){
  if(this.room)return json({error:'Sala ocupada'},409);const body=await req.json();if(![1,3,5,7].includes(body.bestOf))return json({error:'Elegí 1, 3, 5 o 7 rondas'},400);
  this.room={code:body.code,bestOf:body.bestOf,wins:[0,0],round:1,phase:'lobby',players:[{role:0,token:random(),character:0,ready:false}]};await this.ctx.storage.setAlarm(Date.now()+2*60*60*1000);return json({code:body.code,role:0,token:this.room.players[0].token});
 }
 if(!this.room)return json({error:'La sala expiró. Creá otra.'},404);
 if(u.pathname==='/join'&&req.method==='POST'){
  if(this.room.players.length>=2)return json({error:'La sala está llena'},409);if(!this.sockets.has(0))return json({error:'El anfitrión no está conectado'},409);
  const p={role:1,token:random(),character:1,ready:false};this.room.players.push(p);this.broadcast('lobby',{room:this.view()});return json({code:this.room.code,role:1,token:p.token});
 }
 if(u.pathname==='/ws'&&req.headers.get('upgrade')==='websocket'){
  const p=this.room.players.find(p=>p.token===u.searchParams.get('token'));if(!p)return json({error:'Acceso inválido'},403);if(this.sockets.has(p.role))return json({error:'Ya conectado'},409);
  const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.accept();this.sockets.set(p.role,server);
  server.addEventListener('message',e=>{if(typeof e.data!=='string'||e.data.length>150000){server.close(1009);return;}try{this.message(p,JSON.parse(e.data))}catch(_){server.close(1008,'Mensaje inválido')}});
  server.addEventListener('close',()=>this.disconnected(p,server));server.addEventListener('error',()=>this.disconnected(p,server));this.broadcast('lobby',{room:this.view()});return new Response(null,{status:101,webSocket:client});
 }
 return json({error:'Ruta inválida'},404);
 }
 disconnected(p,ws){if(this.sockets.get(p.role)!==ws)return;this.sockets.delete(p.role);if(!this.room)return;this.room.phase='disconnected';this.broadcast('disconnected',{role:p.role});}
 message(p,m){
  const r=this.room;if(m.type==='ping'){this.sockets.get(p.role)?.send('{"type":"pong"}');return;}
  if(m.type==='select'&&['lobby','roundEnd','matchEnd'].includes(r.phase)){if(!Number.isInteger(m.character)||m.character<0||m.character>11)return;p.character=m.character;p.ready=false;this.broadcast('lobby',{room:this.view()});}
  if(m.type==='settings'&&p.role===0&&r.phase==='lobby'&&[1,3,5,7].includes(m.bestOf)){r.bestOf=m.bestOf;r.players.forEach(p=>p.ready=false);this.broadcast('lobby',{room:this.view()});}
  if(m.type==='ready'&&['lobby','roundEnd','matchEnd'].includes(r.phase)){
   p.ready=true;if(r.players.length===2&&r.players.every(p=>p.ready&&this.sockets.has(p.role))){if(r.phase==='matchEnd'){r.wins=[0,0];r.round=1;}r.phase='playing';r.players.forEach(p=>p.ready=false);this.broadcast('start',{room:this.view()});}else this.broadcast('lobby',{room:this.view()});
  }
  if(r.phase==='playing'&&p.role===1&&m.type==='input'){
   if(JSON.stringify(m.input).length>2500)return;this.sockets.get(0)?.send(JSON.stringify({type:'input',input:m.input}));
  }
  if(r.phase==='playing'&&p.role===0&&m.type==='frame'){
   if(m.round!==r.round||!m.state)return;this.sockets.get(1)?.send(JSON.stringify({type:'frame',round:r.round,state:m.state}));
  }
  if(r.phase==='playing'&&p.role===0&&m.type==='result'){
   if(m.round!==r.round||![0,1,2].includes(m.winner))return;
   if(m.winner<2)r.wins[m.winner]++;
   r.phase=r.wins.some(w=>w>=Math.ceil(r.bestOf/2))?'matchEnd':'roundEnd';if(m.winner<2)r.round++;
   r.players.forEach(p=>p.ready=false);this.broadcast('result',{room:this.view(),winner:m.winner});
  }
 }
 async alarm(){for(const ws of this.sockets.values())ws.close(1000,'Sala expirada');this.room=null;this.sockets.clear();await this.ctx.storage.deleteAll();}
}
