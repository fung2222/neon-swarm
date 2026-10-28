/**
 * WEAPONS-ULT-LIGHT-AMP-DOCS-001 screenshots (v0.9.88)
 */
import { createServer } from 'http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SHOT_DIR = join(__dirname, 'screenshots', 'weapons-ult-light-amp-docs');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const VER = '0.9.88';
const WAIT = { timeout: 60000 };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.md': 'text/markdown' };

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = join(ROOT, p);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('missing'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
  const doc = readFileSync(join(ROOT, 'docs/WEAPONS.md'), 'utf8');
  const probe = {
    hasShip: doc.includes('WEAPONS-ULT-LIGHT-AMP-DOCS-001'),
    hasU1: doc.includes('1.2'),
    hasU2: doc.includes('0.85'),
    hasTable: doc.includes('POWER AMP') && doc.includes('CADENCE AMP'),
  };
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--ignore-gpu-blocklist', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.screenshot({ path: join(SHOT_DIR, '01-phone-home-ult-amp-docs.png'), type: 'png' });
  const fail = [];
  for (const [k, v] of Object.entries(probe)) if (!v) fail.push(k);
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, probe, fail }, null, 2));
  await browser.close(); server.close();
  if (fail.length) { console.error('FAIL', fail); process.exit(1); }
  console.log('weapons-ult-light-amp-docs-shots.mjs: PASS', probe);
}
main().catch((e) => { console.error(e); process.exit(1); });
