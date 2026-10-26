/**
 * Phase 3 lab slice screenshots: distinct grunts + elite telegraph.
 * Run: node tests/phase3-lab-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-lab');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.9';
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
    await new Promise((r) => setTimeout(r, 1000));

    // Start a run
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 600));

    // Arrange lab grunts in front of camera
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.stopMove();
      const place = (type, x, z) => {
        g._spawn(type);
        const e = g.enemies[g.enemies.length - 1];
        e.x = x; e.z = z; e.vx = 0; e.vz = 0;
        e.speed = 0; e.chase = 0; e.panic = false;
        return e;
      };
      place('staffer', -2.2, -3.2);
      place('guard', 0.2, -3.4);
      place('drone', 2.4, -3.0);
    });
    // Let a few frames sync meshes
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'grunts-distinct-1280x800.png'), type: 'png' });
    console.log('shot: grunts-distinct-1280x800.png');

    // Elite telegraph
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._beatsFired['120:sentinel'] = true;
      const evs = [];
      const e = g._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, evs);
      e.x = 0; e.z = -5.5;
      e.phase = 'telegraph';
      e.phaseT = 1.0;
      e.telegraphDur = 1.2;
      e.telegraphAt = g.t;
      e.damageAt = g.t + 1.2;
      e.chargeDx = 0;
      e.chargeDz = 1; // toward +z from -5.5 toward player at 0 → actually player is at 0, elite at -5.5, so dir is +z
      e.chargeDx = (g.px - e.x);
      e.chargeDz = (g.pz - e.z);
      const len = Math.hypot(e.chargeDx, e.chargeDz) || 1;
      e.chargeDx /= len; e.chargeDz /= len;
      // Show banner
      const banner = document.getElementById('beat-banner');
      const zh = document.getElementById('beat-zh');
      const en = document.getElementById('beat-en');
      if (zh) zh.textContent = '精英出現 · 哨戒長';
      if (en) en.textContent = 'ELITE INBOUND · SENTINEL PRIME';
      if (banner) banner.classList.remove('hidden');
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'elite-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: elite-telegraph-1280x800.png');

    // Mobile-ish framing of grunts
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      const place = (type, x, z) => {
        g._spawn(type);
        const e = g.enemies[g.enemies.length - 1];
        e.x = x; e.z = z; e.speed = 0; e.chase = 0; e.panic = false;
      };
      place('staffer', -1.6, -2.8);
      place('guard', 0.1, -3.0);
      place('drone', 1.7, -2.6);
      const banner = document.getElementById('beat-banner');
      if (banner) banner.classList.add('hidden');
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'grunts-mobile-390x844.png'), type: 'png' });
    console.log('shot: grunts-mobile-390x844.png');

    if (errs.length) {
      console.log('page errors:', errs.slice(0, 5));
    }
    console.log('phase3-lab shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
