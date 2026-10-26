/**
 * AIM-HIT-FAST-002 browser scenario: high-speed lateral MG hits.
 * SwiftShader only — not Roy device verified.
 * Run: node tests/aim-hit-002-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'aim-hit-002');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.19';
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
  const pageErrors = [];
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
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageErrors.push('console:' + msg.text());
    });
    await page.goto(`${base}/index.html?v=${VER}&lang=en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__swarm && (window.__swarm.ready || window.__swarm.state === 'menu' || window.__swarm.game), WAIT);
    await new Promise((r) => setTimeout(r, 800));

    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
    await new Promise((r) => setTimeout(r, 600));
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 400));

    const result = await page.evaluate(() => {
      const g = window.__swarm.game;
      if (!g) return { error: 'no game', keys: Object.keys(window.__swarm || {}) };
      g.enemies.length = 0;
      g.bullets.length = 0;
      if (g.zones) g.zones.length = 0;
      if (g.gems) g.gems.length = 0;
      g.spawnAcc = -99;
      g.waveT = 999;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.vx = 0; g.vz = 0;
      if (g.stopMove) g.stopMove();
      g._spawn('drone');
      const e = g.enemies[0];
      const speed = 10.8;
      const radius = 0.24;
      const hz = 60;
      const dt = 1 / hz;
      const fireShots = 5;
      const cd = g.fireCd || 0.1;
      e.x = -speed * (fireShots * cd * 0.45);
      e.z = 8;
      e.vx = speed; e.vz = 0;
      e.r = radius;
      e.hp = 1e9; e.maxHp = 1e9;
      e.speed = 0; e.chase = 0;
      e.elite = false; e.boss = false;
      e.prevX = e.x; e.prevZ = e.z;
      g.rng = () => 0.5;
      g.fireCd = 1e9;
      g.fireT = 1e9;
      const windowBullets = new Set();
      let shots = 0;
      const fireEvery = Math.max(1, Math.round(cd / dt));
      const maxFrames = Math.ceil(hz * 3);
      for (let f = 0; f < maxFrames && shots < fireShots; f++) {
        e.vx = speed; e.vz = 0;
        if (f % fireEvery === 0) {
          const n0 = g.bullets.length;
          g._fireMg([]);
          for (let i = n0; i < g.bullets.length; i++) windowBullets.add(g.bullets[i]);
          shots++;
        }
        const holdX = e.x, holdZ = e.z;
        if (typeof g._stepProjectiles === 'function') {
          e.prevX = holdX; e.prevZ = holdZ;
          e.x = holdX + speed * dt;
          e.z = holdZ;
          e.vx = speed; e.vz = 0;
          g._stepProjectiles(dt, []);
        } else {
          g.spawnAcc = -99; g.fireT = 1e9;
          g.step(dt);
          if (g.enemies.indexOf(e) >= 0) {
            e.x = holdX + speed * dt; e.z = holdZ; e.vx = speed; e.vz = 0;
          }
        }
      }
      let drain = 0;
      while ([...windowBullets].some((b) => g.bullets.includes(b)) && drain++ < hz * 4) {
        const holdX = e.x, holdZ = e.z;
        if (typeof g._stepProjectiles === 'function') {
          e.prevX = holdX; e.prevZ = holdZ;
          e.x = holdX + speed * dt; e.z = holdZ; e.vx = speed; e.vz = 0;
          g._stepProjectiles(dt, []);
        } else {
          g.spawnAcc = -99; g.fireT = 1e9;
          g.step(dt);
          if (g.enemies.indexOf(e) >= 0) {
            e.x = holdX + speed * dt; e.z = holdZ; e.vx = speed; e.vz = 0;
          }
        }
      }
      let hits = 0;
      for (const b of windowBullets) {
        if (b.hitIds && b.hitIds.has(e)) hits++;
      }
      e.x = 1.5; e.z = 6; e.hp = 50; e.r = 0.68;
      e.elite = true; e.type = 'hunter'; e.phase = 'charge';
      e.chargeDx = 1; e.chargeDz = 0; e.vx = 10.8; e.vz = 0;
      e.phaseT = 0.4;
      return {
        shots, hits,
        versionHint: document.querySelector('script[src*="main.js"]')?.src || '',
        hasSplit: typeof g._stepProjectiles === 'function',
        hasIntercept: typeof g.constructor === 'function',
        bulletCount: g.bullets.length,
        enemyCount: g.enemies.length,
      };
    });

    await page.screenshot({ path: join(SHOT_DIR, 'high-speed-lateral-after.png'), fullPage: false });
    await page.evaluate(() => {
      const g = window.__swarm.game;
      if (!g) return;
      g.rng = () => 0.5;
      for (let i = 0; i < 8; i++) {
        g.fireT = 0;
        g._fireMg([]);
        if (g._stepProjectiles) {
          const e = g.enemies[0];
          if (e) {
            e.prevX = e.x; e.prevZ = e.z;
            e.x += (e.vx || 10.8) * (1 / 60);
            g._stepProjectiles(1 / 60, []);
          }
        } else {
          g.step(1 / 60);
        }
      }
    });
    await page.screenshot({ path: join(SHOT_DIR, 'high-speed-lateral-firing.png'), fullPage: false });

    const summary = { ...result, pageErrors, ver: VER };
    writeFileSync(join(SHOT_DIR, 'browser-result.json'), JSON.stringify(summary, null, 2));
    console.log('aim-hit-002 browser', JSON.stringify(summary));
    if (!result || result.error || result.hits < 4) {
      console.error('FAIL: expected >=4 hits in browser scenario, got', result);
      process.exitCode = 1;
    } else {
      console.log('aim-hit-002 shots OK');
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
