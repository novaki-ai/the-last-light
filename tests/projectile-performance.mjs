import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(process.env.TEST_URL || 'http://localhost:4173/');
await page.evaluate(() => {
  NOVAKI_QA.start({ seed: 1729 });
  NOVAKI_QA.setInvincible(true);
  NOVAKI_QA.skipTo(2, 'boss');
  NOVAKI_QA.spawnEnemies(350);
});
await page.waitForTimeout(10000);
const samples = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const intervals = [],
        loads = [];
      let last = performance.now(),
        start = last;
      function frame(now) {
        intervals.push(now - last);
        last = now;
        loads.push(NOVAKI_QA.state().projectiles);
        if (now - start >= 6000) {
          intervals.sort((a, b) => a - b);
          resolve({
            fps: 1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length),
            p95: intervals[Math.floor(intervals.length * 0.95)],
            maxProjectiles: Math.max(...loads),
            state: NOVAKI_QA.state(),
          });
        } else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }),
);
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/projectile-performance.json',
  JSON.stringify({ samples, errors }, null, 2),
);
await page.screenshot({ path: 'artifacts/projectile-performance.png' });
console.log(JSON.stringify(samples));
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
