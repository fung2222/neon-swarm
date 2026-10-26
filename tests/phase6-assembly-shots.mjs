/**
 * Phase 6 assembly bay screenshots: lab-edge vs assembly-edge.
 * Run: node tests/phase6-assembly-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-assembly');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.14';
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

async function quietArena(page) {
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.bossHazards.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
    g.spawnAcc = 0;
    // Suppress beats so banners don't fight zone banner
    g._beatsFired['120:sentinel'] = true;
    g._beatsFired['240:hunter'] = true;
    g._beatsFired['360:swarm_core'] = true;
    const banner = document.getElementById('beat-banner');
    if (banner) banner.classList.add('hidden');
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
    await quietArena(page);

    // Pull camera toward an edge cluster so décor reads
    await page.evaluate(() => {
      const g = window.__swarm.game;
      // Stand beside EDGE_SPOTS[-14,-12] so crates / frames fill the frame
      g.px = -12; g.pz = -10.5;
      const v = window.__swarm.view;
      if (v && v.setMapZone) v.setMapZone('lab');
      g.mapZone = 'lab';
      if (v && v.setZoom) v.setZoom(0.85);
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'lab-edge-1280x800.png'), type: 'png' });
    console.log('shot: lab-edge-1280x800.png');

    // Force assembly zone + banner
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.mapZone = 'assembly';
      g.t = 196;
      const v = window.__swarm.view;
      if (v && v.setMapZone) v.setMapZone('assembly');
      g.px = -12; g.pz = -10.5;
      if (v && v.setZoom) v.setZoom(0.85);
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = '進入 · 機甲組裝區';
      if (en) en.textContent = 'ASSEMBLY BAY';
      if (banner) {
        banner.classList.remove('hidden', 'boss');
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(SHOT_DIR, 'assembly-edge-1280x800.png'), type: 'png' });
    console.log('shot: assembly-edge-1280x800.png');

    // Mobile framing
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.px = -12; g.pz = -10.5;
      g.mapZone = 'assembly';
      const v = window.__swarm.view;
      if (v && v.setMapZone) v.setMapZone('assembly');
      if (v && v.setZoom) v.setZoom(0.85);
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'assembly-edge-mobile-390x844.png'), type: 'png' });
    console.log('shot: assembly-edge-mobile-390x844.png');

    // Lab mobile for pair
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.mapZone = 'lab';
      const v = window.__swarm.view;
      if (v && v.setMapZone) v.setMapZone('lab');
      const banner = document.getElementById('beat-banner');
      if (banner) banner.classList.add('hidden');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'lab-edge-mobile-390x844.png'), type: 'png' });
    console.log('shot: lab-edge-mobile-390x844.png');

    if (errs.length) {
      console.log('page errors:', errs.slice(0, 8));
      throw new Error('page errors: ' + errs[0]);
    }
    console.log('phase6-assembly shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
