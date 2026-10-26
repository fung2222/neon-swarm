/**
 * PHASE2-COMBAT-READABILITY-002 screenshots.
 * Run: node tests/phase2-readability-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase2-readability');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.22';
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

    // Dense-ish combat: many ordinary grunts (no ground rings) + officer identity ring
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
        return e;
      };
      const ring = [
        [-3.2, -2.4], [-1.6, -3.4], [0.1, -3.6], [1.8, -3.2], [3.2, -2.2],
        [-3.4, -0.6], [3.5, -0.4], [-2.8, 1.4], [2.6, 1.6],
        [-1.4, -1.6], [1.2, -1.8], [-0.2, -2.2],
      ];
      for (let i = 0; i < ring.length; i++) {
        const t = i % 3 === 0 ? 'staffer' : i % 3 === 1 ? 'guard' : 'drone';
        place(t, ring[i][0], ring[i][1]);
      }
      place('officer', -4.0, -4.0);
      // fake MG tracers with required hitIds Set
      for (let i = 0; i < 8; i++) {
        g.bullets.push({
          x: 0.2 + i * 0.35, z: -0.4 - i * 0.45, vx: 0, vz: -18,
          r: 0.08, life: 9, dmg: 0, from: 'player', kind: 'mg',
          hitIds: new Set(), pierce: 99,
        });
      }
      g.pausedForLevel = true; // freeze sim; view still syncs
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'combat-dense-1280x800.png'), type: 'png' });
    console.log('shot: combat-dense-1280x800.png');

    // Danger telegraph (elite charge lane — danger orange vs dark floor)
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.gems.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._beatsFired['120:sentinel'] = true;
      g._spawnPauseUntil = g.t + 999;
      const evs = [];
      const e = g._spawnElite({ at: 120, kind: 'elite', id: 'sentinel' }, evs);
      e.x = 0; e.z = -5.5; e.prevX = e.x; e.prevZ = e.z;
      e.phase = 'telegraph';
      e.phaseT = 0.85;
      e.telegraphDur = 1.2;
      e.telegraphAt = g.t;
      e.damageAt = g.t + 1.2;
      e.chargeDx = (g.px - e.x);
      e.chargeDz = (g.pz - e.z);
      const len = Math.hypot(e.chargeDx, e.chargeDz) || 1;
      e.chargeDx /= len; e.chargeDz /= len;
      const place = (type, x, z) => {
        g._spawn(type);
        const o = g.enemies[g.enemies.length - 1];
        o.x = x; o.z = z; o.prevX = x; o.prevZ = z;
        o.speed = 0; o.chase = 0; o.panic = false; o.vx = 0; o.vz = 0;
      };
      place('staffer', -3.0, -2.0);
      place('guard', 2.8, -2.4);
      place('drone', -2.0, 1.5);
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'danger-telegraph-1280x800.png'), type: 'png' });
    console.log('shot: danger-telegraph-1280x800.png');

    // Pickups vs dark floor
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.pausedForLevel = false;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g._spawnPauseUntil = g.t + 999;
      g.gems.length = 0;
      g.gems.push(
        { x: -1.8, z: -2.2, xp: 2, r: 0.18, life: 99, pop: 0.35, letter: 'X', kind: 'xp' },
        { x: 0.0, z: -2.4, xp: 0, r: 0.2, life: 99, pop: 0.35, letter: 'H', kind: 'heal' },
        { x: 1.8, z: -2.2, xp: 0, r: 0.22, life: 99, pop: 0.4, letter: 'W', kind: 'weapon', weapon: 'laser' },
        { x: -0.9, z: -1.2, xp: 3, r: 0.18, life: 99, pop: 0.25, letter: 'X', kind: 'xp' },
        { x: 0.9, z: -1.2, xp: 0, r: 0.2, life: 99, pop: 0.3, letter: 'H', kind: 'heal' },
      );
      g.pausedForLevel = true;
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(SHOT_DIR, 'pickups-1280x800.png'), type: 'png' });
    console.log('shot: pickups-1280x800.png');

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    else console.log('no page errors');
    console.log('phase2-readability shots OK →', SHOT_DIR);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
