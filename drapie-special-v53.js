let drapieShotScale = 1;
const drapieShotOffsets = [];
function prepareDrapieShot() {
  const surface = document.createElement('canvas');
  surface.width = 700;
  surface.height = 700;
  const context = surface.getContext('2d', {willReadFrequently:true});
  const bounds = [];
  for (let col = 0; col < 6; col++) {
    context.clearRect(0,0,700,700);
    SpriteAtlas.draw(context,drapieShotArt,0,col,350,600,330);
    const pixels = context.getImageData(0,0,700,700).data;
    let top = 700, bottom = 0;
    for (let y = 0; y < 700; y++) {
      for (let x = 0; x < 700; x++) {
        if (pixels[(y*700+x)*4+3] <= 32) continue;
        top = Math.min(top,y);
        bottom = Math.max(bottom,y);
      }
    }
    bounds.push({top,bottom});
  }
  // One scale for the entire sequence keeps the body constant through recoil.
  drapieShotScale = CHARACTER_HEIGHTS[6] / Math.max(...bounds.map(b=>b.bottom-b.top+1));
  bounds.forEach(b=>drapieShotOffsets.push((600-b.bottom)*drapieShotScale));
  surface.width = surface.height = 0;
}
function drawDrapieShot(a,size) {
  const elapsed = a.attackLength-a.attack;
  const col = elapsed<13?0:elapsed<25?1:elapsed<38?2:elapsed<44?3:elapsed<60?4:5;
  drawSprite(drapieShotArt,0,col,0,drapieShotOffsets[col]*(size/330),size*drapieShotScale);
}
function drawDrapieBullet() {
  ctx.strokeStyle='#ffbd55';
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-30,0);
  ctx.lineTo(8,0);
  ctx.stroke();
  ctx.fillStyle='#fff6c9';
  ctx.beginPath();
  ctx.ellipse(10,0,9,4,0,0,Math.PI*2);
  ctx.fill();
}
