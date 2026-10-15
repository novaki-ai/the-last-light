import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = resolve('dist');
const prefix = '/games/novaki/the-last-light/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.json': 'application/json',
};
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const path = resolve(root, decodeURIComponent(pathname.slice(prefix.length) || 'index.html'));
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const bytes = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(4174, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [],
    external = [],
    requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('request', (r) => {
    requests.push(r.url());
    if (!r.url().startsWith('http://127.0.0.1:4174/')) external.push(r.url());
  });
  await page.goto(`http://127.0.0.1:4174${prefix}`);
  await page.waitForFunction(() => window.NOVAKI_QA);
  await page.getByRole('button', { name: /Begin your journey/ }).click();
  await page.getByRole('button', { name: /Carry the spark/ }).click();
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => window.NOVAKI_QA.state().screen), 'playing');
  await page.evaluate(() => {
    window.NOVAKI_QA.setInvincible(true);
    window.NOVAKI_QA.skipTo(2, 'boss');
  });
  await page.waitForTimeout(1500);
  const loaded = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((x) => /assets\/(images|audio)\//.test(x.name))
      .map((x) => x.name),
  );
  assert.ok(
    loaded.some((x) => x.endsWith('boss2.png')),
    'Boss image loaded under subpath',
  );
  assert.ok(
    loaded.some((x) => x.endsWith('boss2.mp3')),
    'Boss music loaded under subpath',
  );
  assert.ok(
    loaded.some((x) => x.endsWith('boss2-intro.mp3')),
    'Boss voice loaded under subpath',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/production-subpath.png' });
  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        path: prefix,
        requests: requests.length,
        localAssets: loaded.length,
        errors,
        external,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
