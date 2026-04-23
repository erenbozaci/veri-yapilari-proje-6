export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, 800, 600);
  }

  drawPlayer(player) {
    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(player.pos.x, player.pos.y, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}