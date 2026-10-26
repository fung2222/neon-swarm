/**
 * Phase 6 damage-numbers lite screenshots (v0.9.34).
 * Run: node tests/phase6-damage-numbers-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-damage-numbers');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.34';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = url === '/' ? '/index.html' : url;
      const file = join(ROOT, rel.replace(/^\//, ''));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function bootPlay(page, base) {
  page.on('pageerror', (e) => console.warn('pageerror', e && e.message ? e.message : e));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 200));
}

async function run() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    await bootPlay(page, base);

    // Hit swarm + heavy + block at screen mid
    await page.evaluate(() => {
      const S = window.__swarm;
      S.hideRunCoach && S.hideRunCoach();
      const w = window.innerWidth, h = window.innerHeight;
      // bypass throttle by unique keys / direct spawn
      S.spawnCombatFloat({ kind: 'hit', amount: 3, left: w * 0.42, top: h * 0.48, key: 'a' });
      S.spawnCombatFloat({ kind: 'hit', amount: 4, left: w * 0.50, top: h * 0.46, key: 'b' });
      S.spawnCombatFloat({ kind: 'hit', amount: 2, left: w * 0.58, top: h * 0.50, key: 'c' });
      S.spawnCombatFloat({ kind: 'hit', amount: 18, left: w * 0.55, top: h * 0.40, heavy: true, key: 'h' });
      S.spawnCombatFloat({ kind: 'hit', amount: 0.2, left: w * 0.35, top: h * 0.44, frontBlock: true, key: 'blk' });
    });
    await new Promise((r) => setTimeout(r, 120));
    await page.screenshot({ path: join(SHOT_DIR, '1280-hit-swarm.png'), type: 'png' });

    await page.evaluate(() => {
      const S = window.__swarm;
      S.dmgFloats && S.dmgFloats.clear();
      const w = window.innerWidth, h = window.innerHeight;
      S.spawnCombatFloat({ kind: 'hit', amount: 22, left: w * 0.5, top: h * 0.45, heavy: true, key: 'hv' });
    });
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: join(SHOT_DIR, '1280-heavy.png'), type: 'png' });

    await page.evaluate(() => {
      const S = window.__swarm;
      S.dmgFloats && S.dmgFloats.clear();
      const w = window.innerWidth, h = window.innerHeight;
      S.spawnCombatFloat({ kind: 'heal', amount: 2, left: w * 0.5, top: h * 0.48, key: 'heal' });
    });
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: join(SHOT_DIR, '1280-heal.png'), type: 'png' });

    // 390 mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(base + `/index.html?v=${VER}&lang=zh&stick=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play', WAIT);
    await page.evaluate(() => {
      const S = window.__swarm;
      S.hideRunCoach && S.hideRunCoach();
      const w = window.innerWidth, h = window.innerHeight;
      S.spawnCombatFloat({ kind: 'hit', amount: 5, left: w * 0.45, top: h * 0.48, key: 'm1' });
      S.spawnCombatFloat({ kind: 'hit', amount: 14, left: w * 0.55, top: h * 0.42, heavy: true, key: 'm2' });
      S.spawnCombatFloat({ kind: 'heal', amount: 2, left: w * 0.5, top: h * 0.55, key: 'm3' });
      S.spawnCombatFloat({ kind: 'hurt', amount: 2, left: w * 0.5, top: h * 0.58, key: 'm4' });
    });
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: join(SHOT_DIR, '390-mobile.png'), type: 'png' });

    console.log('shots ok →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
