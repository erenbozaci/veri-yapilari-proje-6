import { Renderer } from "../render/renderer.js";


export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");

    this.renderer = new Renderer(this.ctx);

    this.lastTime = 0;
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {

  }

  render() {
    this.renderer.clear();
  }
}