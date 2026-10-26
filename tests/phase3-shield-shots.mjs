/**
 * PHASE3-ENEMY-SHIELD-001 screenshots: big front plate + frontal defense + bash telegraph.
 * Run: node tests/phase3-shield-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase3-shield');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.24';
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

    // Shot 1: silhouette compare — shield big plate vs soldier vs walker vs sniper
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
        if (e.shieldGuard) {
          e.shieldPhase = 'chase'; e.shieldPhaseT = 9;
          e.faceDx = 0; e.faceDz = 1;
        }
        if (e.sniper) { e.sniperPhase = 'reposition'; e.sniperPhaseT = 9; }
        return e;
      };
      place('soldier', -3.5, -3.0);
      place('shield', 0.0, -3.0);
      place('walker', 3.5, -3.0);
      place('sniper', -2.0, -1.2);
      place('guard', 2.0, -1.2);
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(SHOT_DIR, 'silhouette-compare-1280x800.png'), type: 'png' });
    console.log('shot: silhouette-compare-1280x800.png');

    // Shot 2: front defense pose (shield facing camera/player) + bash telegraph red wedge
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawnPauseUntil = g.t + 999;
      g._spawn('shield');
      const e = g.enemies[0];
      e.x = 0; e.z = -3.2;
      e.prevX = e.x; e.prevZ = e.z;
      e.vx = 0; e.vz = 0;
      e.speed = 0; e.chase = 0;
      e.shieldPhase = 'telegraph';
      e.shieldPhaseT = 0.35;
      e.telegraphDur = 0.65;
      e.telegraphAt = g.t;
      e.faceDx = 0; e.faceDz = 1;
      e.aimDx = 0; e.aimDz = 1;
      g._spawn('soldier');
      const s = g.enemies[1];
      s.x = -3.2; s.z = -2.2; s.speed = 0; s.chase = 0; s.vx = 0; s.vz = 0;
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'front-defense-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: front-defense-telegraph-1280x800.png');

    // Shot 3: flank/rear vulnerability — shield facing away from camera (rear exposed)
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawnPauseUntil = g.t + 999;
      g._spawn('shield');
      const e = g.enemies[0];
      e.x = 0; e.z = -3.0;
      e.prevX = e.x; e.prevZ = e.z;
      e.vx = 0; e.vz = 0;
      e.speed = 0; e.chase = 0;
      e.shieldPhase = 'chase';
      e.shieldPhaseT = 9;
      // Face away from player (rear toward camera) — shows rear vulnerability pose
      e.faceDx = 0; e.faceDz = -1;
      e.aimDx = 0; e.aimDz = -1;
      // Second shield facing player for compare
      g._spawn('shield');
      const e2 = g.enemies[1];
      e2.x = 3.2; e2.z = -2.8;
      e2.speed = 0; e2.chase = 0; e2.vx = 0; e2.vz = 0;
      e2.shieldPhase = 'chase'; e2.shieldPhaseT = 9;
      e2.faceDx = 0; e2.faceDz = 1;
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'flank-rear-expose-1280x800.png'), type: 'png' });
    console.log('shot: flank-rear-expose-1280x800.png');

    // Mobile bash telegraph
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawn('shield');
      const e = g.enemies[0];
      e.x = 0; e.z = -2.8;
      e.shieldPhase = 'telegraph';
      e.shieldPhaseT = 0.4;
      e.telegraphDur = 0.65;
      e.faceDx = 0; e.faceDz = 1;
      e.aimDx = 0; e.aimDz = 1;
      e.speed = 0; e.chase = 0; e.vx = 0; e.vz = 0;
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: join(SHOT_DIR, 'bash-telegraph-mobile-390x844.png'), type: 'png' });
    console.log('shot: bash-telegraph-mobile-390x844.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    else console.log('no page errors');
    console.log('phase3-shield shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
