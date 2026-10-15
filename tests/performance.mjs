import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';

const url = process.env.NOVAKI_TEST_URL || 'http://localhost:4173/';
const counts = (process.env.NOVAKI_PERF_COUNTS || '200,400,600').split(',').map(Number);
const warmupMs = Number(process.env.NOVAKI_PERF_WARMUP_MS || 6000);
const sampleMs = Number(process.env.NOVAKI_PERF_SAMPLE_MS || 6000);
const viewport = { width: 1440, height: 900 };
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

// A development hot reload would invalidate the sample. The shipped game uses
// no WebSockets; this isolates the benchmark from unrelated edits to Vite files.
await page.addInitScript(() => {
  window.WebSocket = class {
    static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
    readyState = 0;
    addEventListener() {} removeEventListener() {} send() {} close() {}
  };
});

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.NOVAKI_QA);
  const gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
  });
  const report = {
    url, date: new Date().toISOString(), browser: await browser.version(),
    cpu: os.cpus()[0]?.model, logicalCpus: os.availableParallelism(), gpu,
    viewport, deviceScaleFactor: 1, seed: 1729, warmupMs, sampleMs, samples: [], errors,
  };
  console.log(JSON.stringify({ browser: report.browser, cpu: report.cpu, gpu, viewport }));
  for (const count of counts) {
    await page.evaluate(count => {
      window.NOVAKI_QA.start({ seed: 1729 });
      window.NOVAKI_QA.setInvincible(true);
      window.NOVAKI_QA.spawnEnemies(count);
      if (!window.perfAutoChoice) window.perfAutoChoice = setInterval(() => {
        if (window.NOVAKI_QA.state().screen === 'levelup') window.NOVAKI_QA.chooseUpgrade(0);
      }, 50);
    }, count);
    await page.waitForTimeout(warmupMs);
    await page.evaluate(() => {
      window.perfFrames = [];
      window.perfMeasuring = true;
      let last = performance.now();
      function measure(now) {
        if (!window.perfMeasuring) return;
        const elapsed = now - last;
        if (elapsed > 0) window.perfFrames.push(elapsed);
        last = now;
        requestAnimationFrame(measure);
      }
      requestAnimationFrame(measure);
    });
    await page.waitForTimeout(sampleMs);
    const sample = await page.evaluate(() => {
      window.perfMeasuring = false;
      const values = window.perfFrames;
      const sorted = [...values].sort((a, b) => a - b);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const state = window.NOVAKI_QA.state();
      return {
        screen: state.screen, enemies: state.enemies, stage: state.stage, runTime: state.time,
        fps: Number((1000 / average).toFixed(2)),
        p95FrameMs: Number(sorted[Math.floor(sorted.length * .95)].toFixed(2)),
        frames: values.length,
      };
    });
    if (sample.screen !== 'playing' || sample.enemies < count * .75) {
      throw new Error(`Invalid performance fixture: ${JSON.stringify(sample)}`);
    }
    report.samples.push({ requestedEnemies: count, ...sample });
    console.log(JSON.stringify(report.samples.at(-1)));
  }
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/performance-600.png' });
  await writeFile('artifacts/performance.json', JSON.stringify(report, null, 2) + '\n');
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log('Report: artifacts/performance.json; screenshot: artifacts/performance-600.png');
} finally {
  await browser.close();
}
