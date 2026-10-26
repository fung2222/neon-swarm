/**
 * PHASE6-PERIODIC-DANGER-001 screenshots: arena red danger-pulse telegraph.
 * Run: node tests/phase6-danger-pulse-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-danger-pulse');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.41';
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

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));

  try {
    await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await new Promise((r) => setTimeout(r, 800));

    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 500));

    // Shot 1: desktop red arena telegraph (offset from player)
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.gems.length = 0;
      g.bossHazards = [];
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.stopMove();
      g._spawnPauseUntil = g.t + 999;
      g.dangerPulses = [{
        id: 1,
        x: 2.4,
        z: -2.0,
        radius: 2.4,
        phase: 'telegraph',
        phaseT: 0.45,
        telegraphDur: 1.0,
        telegraphAt: g.t,
      }];
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'telegraph-1280x800.png'), type: 'png' });
    console.log('shot: telegraph-1280x800.png');

    // Shot 2: second pulse + player context
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.dangerPulses = [
        {
          id: 2, x: -2.6, z: -1.4, radius: 2.4,
          phase: 'telegraph', phaseT: 0.55, telegraphDur: 1.0, telegraphAt: g.t,
        },
        {
          id: 3, x: 2.8, z: 1.2, radius: 2.4,
          phase: 'telegraph', phaseT: 0.35, telegraphDur: 1.0, telegraphAt: g.t,
        },
      ];
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'telegraph-dual-1280x800.png'), type: 'png' });
    console.log('shot: telegraph-dual-1280x800.png');

    // Mobile telegraph
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.dangerPulses = [{
        id: 4, x: 1.8, z: -2.2, radius: 2.4,
        phase: 'telegraph', phaseT: 0.4, telegraphDur: 1.0, telegraphAt: g.t,
      }];
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'telegraph-mobile-390x844.png'), type: 'png' });
    console.log('shot: telegraph-mobile-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    else console.log('no page errors');
    console.log('phase6-danger-pulse shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
