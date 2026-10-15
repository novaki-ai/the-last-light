import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { UI } from './ui';
for (const name of ['title', 'ending']) {
  document.documentElement.style.setProperty(
    `--${name}-art`,
    `url("${new URL(`${import.meta.env.BASE_URL}assets/images/${name}.webp`, document.baseURI).href}")`,
  );
}
const game = new Game();
const renderer = new Renderer(document.getElementById('game') as HTMLCanvasElement, game);
const ui = new UI(game);
let last = performance.now(),
  accumulator = 0,
  frames = 0,
  fpsTime = 0;
function loop(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += dt;
  let ticks = 0;
  while (accumulator >= 1 / 60 && ticks < 6) {
    game.tick(1 / 60);
    accumulator -= 1 / 60;
    ticks++;
  }
  renderer.draw(dt);
  ui.update(now);
  frames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    game.fps = Math.round(frames / fpsTime);
    frames = 0;
    fpsTime = 0;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
const qa = {
  state: () => game.state(),
  start: (options: { seed?: number } = {}) => {
    game.start(options);
    return game.state();
  },
  setInvincible: (on: boolean) => {
    game.invincible = !!on;
  },
  addXp: (amount: number) => game.addXp(amount),
  chooseUpgrade: (index: number) => game.chooseUpgrade(index),
  skipTo: (stage: number, point: 'start' | 'boss') => game.skipTo(stage, point),
  killBoss: () => game.killBoss(),
  spawnEnemies: (count: number) => game.spawnEnemies(count),
};
Object.defineProperty(window, 'NOVAKI_QA', { value: qa, writable: false });
game.audio.playMusic('menu');
window.addEventListener('pointerdown', () => game.audio.unlock(), { once: true });
window.addEventListener('keydown', () => game.audio.unlock(), { once: true });
