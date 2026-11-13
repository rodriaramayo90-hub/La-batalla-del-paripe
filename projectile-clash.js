let projectileClash = null;
function clashTap(slot) {
  if (!projectileClash || LOCAL.paused || PAD.soloPause || ending) return;
  if (ONLINE.active && ONLINE.role === 1) {
    bufferAction('clash');
    return;
  }
  projectileClash.taps[slot]++;
}
function detectProjectileClash(dt) {
  for (let i = 0; i < projectiles.length; i++) {
    const a = projectiles[i];
    if (a.life <= 0 || a.clashWon) continue;
    for (const b of projectiles.slice(i + 1)) {
      if (b.life <= 0 || b.clashWon || a.owner === b.owner || a.dir === b.dir) continue;
      const gap = (b.x - a.x) * a.dir;
      if (gap < 0 || gap > 60 + (a.speed + b.speed) * dt || Math.abs(a.y - b.y) > 65) continue;
      projectileClash = {pair:[a,b], x:(a.x+b.x)/2, y:(a.y+b.y)/2, time:240, elapsed:0, taps:[0,0], cpu:0,
        start:[{x:a.x,y:a.y},{x:b.x,y:b.y}]};
      clearKeys();
      sfx('hit');
      return true;
    }
  }
  return false;
}
function stepProjectileClash(dt) {
  const c = projectileClash;
  c.time -= dt;
  c.elapsed += dt;
  if (!LOCAL.active && !ONLINE.active) {
    c.cpu += dt;
    while (c.cpu >= 12) { c.cpu -= 12; c.taps[1]++; }
  }
  const ease = Math.min(1,c.elapsed/10);
  for (let i=0;i<2;i++) {
    const p=c.pair[i], start=c.start[i];
    p.x=start.x+(c.x-p.dir*24-start.x)*ease+Math.sin(c.elapsed*1.7+i*Math.PI)*2*ease;
    p.y=start.y+(c.y-start.y)*ease;
    p.age+=dt*.15;
  }
  if(c.time>0)return;
  if(c.taps[0]===c.taps[1]) {
    c.pair.forEach(p=>p.life=0);
    announcement='¡EMPATE!'; announceTime=80;
  } else {
    const owner=c.taps[0]>c.taps[1]?player:enemy;
    for(const p of c.pair) {
      if(p.owner!==owner){p.life=0;continue;}
      p.clashWon=true;
      p.life=120;
      p.speed=Math.max(p.speed,14);

    }
    announcement='¡GANA EL CHOQUE '+(owner===player?'1P':'2P')+'!';announceTime=80;
  }
  projectiles = projectiles.filter(p => p.life > 0);
  projectileClash=null;
  clearKeys();
  sfx('release');
}
function clashPunchButton(slot) {
  const pads = availablePads();
  const control = LOCAL.active ? LOCAL.controls[slot] : null;
  const pad = LOCAL.active
    ? pads.find(p => control === 'pad:' + p.index)
    : pads[0];
  if (pad) return isPS4(pad) ? '□' : /nintendo|switch|joy-con/i.test(pad.id) ? 'Y' : 'X';
  return slot === 1 ? 'Z' : 'J';
}
function drawProjectileClash() {
  const c=projectileClash;
  if(!c)return;
  ctx.save();
  ctx.strokeStyle='#ffe38a';ctx.lineWidth=3;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6+c.elapsed*.04;
    const radius=18+Math.sin(c.elapsed*.8+i)*5;
    ctx.beginPath();ctx.moveTo(c.x+Math.cos(angle)*radius,c.y+Math.sin(angle)*radius);
    ctx.lineTo(c.x+Math.cos(angle)*(radius+15),c.y+Math.sin(angle)*(radius+15));ctx.stroke();
  }
  const twoPlayers = LOCAL.active;
  ctx.fillStyle='#180d27ee';
  ctx.fillRect(140,25,680,twoPlayers?88:55);
  ctx.fillStyle='#ffe38a';
  ctx.textAlign='center';
  ctx.font='bold 23px Arial';
  if (twoPlayers) {
    ctx.fillText('1P · PULSAR «'+clashPunchButton(0)+'» REPETIDAMENTE',480,57);
    ctx.fillText('2P · PULSAR «'+clashPunchButton(1)+'» REPETIDAMENTE',480,92);
  } else {
    ctx.fillText('PULSAR «'+clashPunchButton(0)+'» REPETIDAMENTE',480,60);
  }
  ctx.restore();
}
