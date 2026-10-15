import { createServer } from 'vite';
import { spawn } from 'node:child_process';

let server;
let url = process.env.TEST_URL;
try {
  if (!url) {
    server = await createServer({
      server: { host: '127.0.0.1', port: 0 },
      clearScreen: false,
      logLevel: 'warn',
    });
    await server.listen();
    url = server.resolvedUrls.local[0];
  }
  const suites = process.env.TEST_URL ? ['qa'] : ['qa', 'mechanics'];
  for (const suite of suites) {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`tests/${suite}.mjs`], {
        stdio: 'inherit',
        env: { ...process.env, TEST_URL: url },
      });
      child.on('error', reject);
      child.on('exit', resolve);
    });
    if (code !== 0) throw new Error(`${suite} failed with exit code ${code}`);
  }
} finally {
  await server?.close();
}
