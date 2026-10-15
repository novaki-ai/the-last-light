import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const url = process.env.TEST_URL || 'http://localhost:4173/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto(url);
await page.waitForFunction(() => window.NOVAKI_QA);
const state = () => page.evaluate(() => window.NOVAKI_QA.state());
assert.equal((await state()).screen, 'menu');
await page.evaluate(() => window.NOVAKI_QA.start({ seed: 12345 }));
await page.evaluate(() => window.NOVAKI_QA.setInvincible(true));
await page.keyboard.down('KeyD');
await page.waitForTimeout(400);
await page.keyboard.up('KeyD');
assert.ok((await state()).player.x > 50, 'Keyboard moves real player');
await page.keyboard.press('Space');
await page.waitForTimeout(250);
assert.ok((await state()).stats.dashes >= 1, 'Dash fires');
await page.keyboard.press('Escape');
await page.waitForFunction(() => window.NOVAKI_QA.state().screen === 'paused');
assert.equal((await state()).screen, 'paused');
const frozen = (await state()).time;
await page.waitForTimeout(250);
assert.equal((await state()).time, frozen, 'Pause freezes simulation');
await page.getByRole('button', { name: 'Settings', exact: true }).click();
await page.getByRole('slider', { name: 'Music volume' }).fill('25');
await page.getByRole('switch', { name: 'Screen shake' }).click();
await page.getByRole('button', { name: '← Back', exact: true }).click();
assert.equal((await state()).screen, 'paused');
await page.getByRole('button', { name: /Return to the fire/ }).click();
assert.equal((await state()).screen, 'playing');
await page.evaluate(() => window.NOVAKI_QA.addXp(13));
assert.equal((await state()).screen, 'levelup');
await page.evaluate(() => window.NOVAKI_QA.chooseUpgrade(0));
assert.equal((await state()).screen, 'playing');
assert.equal((await state()).player.level, 2);
await page.evaluate(() => window.NOVAKI_QA.spawnEnemies(600));
await page.waitForTimeout(1000);
assert.ok((await state()).enemies > 450, 'Stress enemies really exist');
console.log('STRESS', JSON.stringify(await state()));
await page.screenshot({ path: 'artifacts/stress.png' });
for (let stage = 1; stage <= 3; stage++) {
  await page.evaluate((s) => window.NOVAKI_QA.skipTo(s, 'boss'), stage);
  assert.equal((await state()).bossActive, true);
  assert.equal((await state()).stage, stage);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `artifacts/boss${stage}.png` });
  await page.evaluate(() => window.NOVAKI_QA.killBoss());
  const waitEnd = Date.now() + 15000;
  while (Date.now() < waitEnd) {
    const s = await state();
    if (s.screen === 'levelup') await page.evaluate(() => window.NOVAKI_QA.chooseUpgrade(0));
    else if (s.screen === 'transition' || s.screen === 'victory') break;
    await page.waitForTimeout(100);
  }
  assert.equal((await state()).bossActive, false);
  if (stage < 3) {
    assert.equal((await state()).screen, 'transition');
    await page.getByRole('button', { name: /Enter / }).click();
    assert.equal((await state()).stage, stage + 1);
  } else assert.equal((await state()).screen, 'victory');
}
const end = await state();
assert.equal(end.stats.bosses, 3);
assert.ok(end.meta.currency >= 360);
assert.equal(end.meta.wins, 1);
assert.ok(end.meta.unlocks.includes('frost'));
await page.screenshot({ path: 'artifacts/victory.png' });
await page.getByRole('button', { name: 'Visit the hearth' }).click();
await page.locator('[data-action="buy"][data-value="vigor"]').click();
const bought = await state();
assert.equal(bought.meta.upgrades.vigor, 1);
await page.reload();
assert.equal((await state()).meta.upgrades.vigor, 1);
await page.evaluate(() => window.NOVAKI_QA.start({ seed: 2 }));
assert.equal((await state()).player.maxHp, 110);
console.log('DESKTOP PASS', JSON.stringify({ errors, meta: (await state()).meta }));
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
mobile.on('pageerror', (e) => errors.push(e.message));
await mobile.goto(url);
await mobile.evaluate(() => window.NOVAKI_QA.start({ seed: 99 }));
await mobile.waitForTimeout(300);
const joy = mobile.locator('#joystick');
const box = await joy.boundingBox();
assert.ok(box, 'Touch joystick visible');
await mobile.dispatchEvent('#joystick', 'pointerdown', {
  pointerId: 1,
  clientX: box.x + box.width / 2 + 35,
  clientY: box.y + box.height / 2,
  pointerType: 'touch',
});
await mobile.waitForTimeout(350);
await mobile.dispatchEvent('#joystick', 'pointerup', { pointerId: 1, pointerType: 'touch' });
assert.ok(
  (await mobile.evaluate(() => window.NOVAKI_QA.state())).player.x > 25,
  'Touch moves player',
);
await mobile.locator('#touch-dash').tap();
await mobile.waitForTimeout(100);
assert.ok(
  (await mobile.evaluate(() => window.NOVAKI_QA.state())).stats.dashes > 0,
  'Touch dash fires',
);
await mobile.screenshot({ path: 'artifacts/mobile-playing.png' });
console.log('MOBILE PASS');
assert.deepEqual(errors, [], 'No browser errors');
await browser.close();
