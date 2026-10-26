/**
 * PHASE3-ENEMY-SNIPER-001 screenshots: long-rifle silhouette + red aim telegraph + fire.
 * Run: node tests/phase3-sniper-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-sniper');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.23';
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

    // Shot 1: silhouette compare — sniper long rifle vs soldier vs officer
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
      const place = (type, x, z) => {
        g._spawn(type);
        const e = g.enemies[g.enemies.length - 1];
        e.x = x; e.z = z; e.prevX = x; e.prevZ = z; e.vx = 0; e.vz = 0;
        e.speed = 0; e.chase = 0; e.panic = false;
        if (e.sniper) { e.sniperPhase = 'reposition'; e.sniperPhaseT = 9; }
        return e;
      };
      place('soldier', -3.2, -3.0);
      place('sniper', 0.0, -3.2);
      place('officer', 3.2, -3.0);
      place('guard', -2.0, -1.2);
      place('staffer', 2.0, -1.2);
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(SHOT_DIR, 'silhouette-compare-1280x800.png'), type: 'png' });
    console.log('shot: silhouette-compare-1280x800.png');

    // Shot 2: red aim telegraph
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawnPauseUntil = g.t + 999;
      g._spawn('sniper');
      const e = g.enemies[0];
      e.x = 0; e.z = -8.5;
      e.prevX = e.x; e.prevZ = e.z;
      e.vx = 0; e.vz = 0;
      e.speed = 0; e.chase = 0;
      e.sniperPhase = 'aim';
      e.sniperPhaseT = 0.55;
      e.telegraphDur = 1.0;
      e.telegraphAt = g.t;
      e.aimDx = 0; e.aimDz = 1; // toward player at origin from -Z
      // nearby grunt for context
      g._spawn('soldier');
      const s = g.enemies[1];
      s.x = -3.5; s.z = -2.5; s.speed = 0; s.chase = 0; s.vx = 0; s.vz = 0;
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'telegraph-aim-1280x800.png'), type: 'png' });
    console.log('shot: telegraph-aim-1280x800.png');

    // Shot 3: fire / muzzle moment
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawnPauseUntil = g.t + 999;
      g._spawn('sniper');
      const e = g.enemies[0];
      e.x = 1.5; e.z = -7.5;
      e.prevX = e.x; e.prevZ = e.z;
      e.vx = 0; e.vz = 0;
      e.speed = 0; e.chase = 0;
      e.sniperPhase = 'aim';
      e.sniperPhaseT = 0.02; // about to fire
      e.telegraphDur = 1.0;
      e.aimDx = (g.px - e.x);
      e.aimDz = (g.pz - e.z);
      const len = Math.hypot(e.aimDx, e.aimDz) || 1;
      e.aimDx /= len; e.aimDz /= len;
      // Unpause briefly so one tick fires sniperShot VFX, then freeze
      g.pausedForLevel = false;
    });
    // Drive a few frames so sniperShot fires and particles spawn
    await page.evaluate(async () => {
      const g = window.__swarm.game;
      for (let i = 0; i < 8; i++) {
        const evs = g.step(1 / 30) || [];
        // mirror main event path for particles if exposed
        if (window.__swarm && typeof window.__swarm._debugPushEvents === 'function') {
          window.__swarm._debugPushEvents(evs);
        }
      }
      // Force a visible shot flash via manual event if step path paused
      const e = g.enemies.find((x) => x.type === 'sniper');
      if (e && e.sniperPhase !== 'cooldown') {
        e.sniperPhase = 'aim';
        e.sniperPhaseT = 0;
        g._tickSniper(e, 0.05, []);
      }
      g.pausedForLevel = true;
    });
    // Also inject muzzle burst via page evaluate calling into THREE if available through view
    await page.evaluate(() => {
      // Ensure aim line still briefly visible + shotFlash
      const g = window.__swarm.game;
      const e = g.enemies.find((x) => x.type === 'sniper');
      if (e) {
        e.shotFlash = 0.18;
        // Keep a short residual aim for screenshot readability
        if (e.sniperPhase === 'cooldown') {
          e.sniperPhase = 'aim';
          e.sniperPhaseT = 0.12;
          e.telegraphDur = 1.0;
        }
      }
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: join(SHOT_DIR, 'fire-shot-1280x800.png'), type: 'png' });
    console.log('shot: fire-shot-1280x800.png');

    // Mobile telegraph
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawn('sniper');
      const e = g.enemies[0];
      e.x = 0; e.z = -7.0;
      e.sniperPhase = 'aim';
      e.sniperPhaseT = 0.5;
      e.telegraphDur = 1.0;
      e.aimDx = 0; e.aimDz = 1;
      e.speed = 0; e.chase = 0; e.vx = 0; e.vz = 0;
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'telegraph-mobile-390x844.png'), type: 'png' });
    console.log('shot: telegraph-mobile-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    else console.log('no page errors');
    console.log('phase3-sniper shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
