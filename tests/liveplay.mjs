/** Real-time renderer playtest: no time acceleration, XP grants, or invincibility. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
// The test-only module suffix exposes the same instance to a deterministic pilot.
// It is never written to application source or the production build.
await page.route('**/src/main.ts', async (route) => {
  const response = await route.fetch();
  await route.fulfill({
    response,
    body: (await response.text()) + '\nwindow.__playtestGame = game;',
  });
});
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__playtestGame);
await page.evaluate(() => {
  const game = window.__playtestGame;
  game.start({ seed: 42 });
  const priority = {
    kindling: 100,
    familiar: 86,
    lightning: 75,
    multishot: 94,
    haste: 68,
    might: 70,
    magnet: 62,
    regen: 60,
    vitality: 40,
    armor: 35,
    velocity: 30,
  };
  window.__pilot = setInterval(() => {
    if (game.screen === 'levelup') {
      const scores = game.choices.map((choice, index) => ({
        index,
        score:
          (priority[choice.id] || 0) +
          (game.upgrades[choice.id] || 0) * 6 +
          (choice.id === 'vitality' && game.player.hp < 50 ? 70 : 0),
      }));
      scores.sort((a, b) => b.score - a.score);
      game.chooseUpgrade(scores[0].index);
      return;
    }
    if (game.screen !== 'playing') return;
    const p = game.player;
    let tx = Math.cos(game.time * 0.16) * 300,
      ty = Math.sin(game.time * 0.16) * 250;
    let best = Infinity;
    for (const pickup of game.pickups) {
      const d = Math.hypot(pickup.x - p.x, pickup.y - p.y);
      const score = d / Math.min(4, Math.sqrt(pickup.value));
      if (score < best) {
        best = score;
        tx = pickup.x;
        ty = pickup.y;
      }
    }
    const shrine = game.shrines.find((s) => !s.done && Math.hypot(s.x - p.x, s.y - p.y) < 450);
    if (shrine) {
      tx = shrine.x;
      ty = shrine.y;
    }
    let dx = tx - p.x,
      dy = ty - p.y,
      d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    let danger = 0;
    for (const e of game.enemies) {
      const ex = p.x - e.x,
        ey = p.y - e.y,
        dist = Math.hypot(ex, ey) || 1;
      if (dist < 130) {
        const push = (130 - dist) / 80;
        dx += (ex / dist) * push;
        dy += (ey / dist) * push;
        if (dist < 60) danger++;
      }
    }
    for (const b of game.projectiles) {
      if (!b.hostile) continue;
      const ex = p.x - b.x,
        ey = p.y - b.y,
        dist = Math.hypot(ex, ey) || 1;
      if (dist < 85) {
        dx += ex / dist;
        dy += ey / dist;
        if (dist < 35) danger++;
      }
    }
    game.input.keys.clear();
    if (dx > 0.22) game.input.keys.add('KeyD');
    if (dx < -0.22) game.input.keys.add('KeyA');
    if (dy > 0.22) game.input.keys.add('KeyS');
    if (dy < -0.22) game.input.keys.add('KeyW');
    if (danger > 0) game.input.dash = true;
  }, 100);
});
const samples = [];
for (const moment of [25, 55, 90]) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.NOVAKI_QA.state());
    if (state.time >= moment || state.screen === 'gameover') break;
    await page.waitForTimeout(500);
  }
  const state = await page.evaluate(() => window.NOVAKI_QA.state());
  samples.push(state);
  await page.screenshot({ path: `artifacts/liveplay-${moment}.png` });
  console.log(
    JSON.stringify({
      sample: moment,
      screen: state.screen,
      time: state.time,
      level: state.player.level,
      hp: state.player.hp,
      enemies: state.enemies,
      kills: state.stats.kills,
      fps: state.fps,
    }),
  );
  if (state.screen === 'gameover') break;
}
await writeFile('artifacts/liveplay.json', JSON.stringify({ samples, errors }, null, 2));
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
