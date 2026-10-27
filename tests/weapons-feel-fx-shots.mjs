/**
 * WEAPONS-FEEL-FX-001 screenshots (v0.9.56).
 * Run: node tests/weapons-feel-fx-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-feel-fx');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.56';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'application/svg+xml',
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
      '--no-sandbox', '--disable-setuid-sandbox',
      '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--ignore-gpu-blocklist', '--window-size=390,844',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));

  const meta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    // Arm full catalog for FX cycling
    g.taken = {
      gatling: 1, vulcan: 1, ion_beam: 1, tracking_bomb: 1, zero_laser: 1,
      acid_gun: 1, shotgun: 1, slow_gun: 1, attack_drone: 1, blackhole: 1,
      frag: 1, chill: 1, flash: 1, gravity: 1,
    };
    g.loadout = {
      primary: ['gatling', 'vulcan'],
      secondary: ['acid_gun', 'shotgun'],
      throw: ['frag', 'chill'],
    };
    g.weaponSlots = ['gatling', 'vulcan', 'acid_gun', 'shotgun', 'frag', 'chill'];
    g.fireMode = 'primary';
    g.activePrimaryIndex = 0;
    // Spawn a ring of grunts
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.enemies.push({
        id: 'fx' + i, kind: 'soldier', type: 'soldier', family: 'human',
        x: Math.cos(a) * 4, z: Math.sin(a) * 4,
        prevX: Math.cos(a) * 4, prevZ: Math.sin(a) * 4,
        vx: 0, vz: 0, hp: 30, maxHp: 30, r: 0.35, speed: 0, damage: 1,
        color: '#c44', slow: 0, hit: 0, score: 10,
      });
    }
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
    return { armed: g.weaponSlots.slice(), enemies: g.enemies.length };
  });

  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: join(SHOT_DIR, '01-gatling-muzzle.png'), fullPage: false });

  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.activePrimaryIndex = 1; // vulcan
    g.fireT = 0;
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: join(SHOT_DIR, '02-vulcan-sparks.png'), fullPage: false });

  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.loadout.primary[0] = 'ion_beam';
    g.weaponSlots[0] = 'ion_beam';
    g.activePrimaryIndex = 0;
    g._ionPhase = 'charge';
    g._ionChargeT = 0;
    g.taken.ion_beam = 1;
    g.laser = 1;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: join(SHOT_DIR, '03-ion-charge-punch.png'), fullPage: false });

  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.loadout.primary[0] = 'zero_laser';
    g.weaponSlots[0] = 'zero_laser';
    g.zero_laser = 1;
    g.laserT = 0;
    if (window.__swarm.syncWeaponHud) window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: join(SHOT_DIR, '04-zero-chill.png'), fullPage: false });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, meta, errs }, null, 2));
  await browser.close();
  server.close();
  if (errs.length) {
    console.error('page errors', errs);
    process.exit(1);
  }
  console.log('weapons-feel-fx shots OK', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
