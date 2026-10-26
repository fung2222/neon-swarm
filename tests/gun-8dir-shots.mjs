/**
 * GUN-8DIR-001 — screenshots showing 8-dir gun aim (incl. diagonals).
 * Honest label: 8-dir sector snap, not continuous 360° turret.
 * Run: node tests/gun-8dir-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'gun-8dir');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.27';
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

/** [label, aimX, aimZ, keyCodes for move] */
const POSES = [
  ['aim-n', 0, 1, []],
  ['aim-ne', 0.7, 0.7, []],
  ['aim-e', 1, 0, []],
  ['aim-se', 0.7, -0.7, []],
  ['aim-s', 0, -1, []],
  ['aim-sw', -0.7, -0.7, []],
  ['aim-w', -1, 0, []],
  ['aim-nw', -0.7, 0.7, []],
  ['run-e-aim-nw', -0.7, 0.7, ['KeyD']],
];

async function pose(page, aimX, aimZ, keys) {
  await page.evaluate(({ aimX, aimZ, keys }) => {
    const S = window.__swarm;
    const g = S.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    // Clear movement keys then set requested
    for (const k of Object.keys(S.keys || {})) S.keys[k] = false;
    for (const k of keys) S.keys[k] = true;
    // Target in aim direction so MG keeps visualAim locked
    g._spawn('soldier');
    const e = g.enemies[g.enemies.length - 1];
    e.x = aimX * 6; e.z = aimZ * 6; e.vx = 0; e.vz = 0; e.hp = 99999;
    g.visualAimX = aimX;
    g.visualAimZ = aimZ;
    g.aimHold = 1.0;
    g.aimX = aimX; g.aimZ = aimZ;
    if (keys.length) g.moveDir(
      keys.includes('KeyD') ? 1 : keys.includes('KeyA') ? -1 : 0,
      keys.includes('KeyS') ? 1 : keys.includes('KeyW') ? -1 : 0,
    );
    else g.stopMove();
  }, { aimX, aimZ, keys });
  await new Promise((r) => setTimeout(r, 450));
  return page.evaluate(() => {
    const v = window.__swarm.view;
    const ud = v?.player?.userData || {};
    return {
      gunDir: ud.gunDir || null,
      bodyDir: ud.bodyDir || null,
      baked: !!ud.baked,
      vax: window.__swarm.game.visualAimX,
      vaz: window.__swarm.game.visualAimZ,
      vx: window.__swarm.game.vx,
      vz: window.__swarm.game.vz,
    };
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
    await new Promise((r) => setTimeout(r, 600));
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 700));
    await page.evaluate(() => {
      const banner = document.getElementById('beat-banner');
      if (banner) banner.classList.add('hidden');
    });

    const report = [];
    for (const [label, ax, az, keys] of POSES) {
      const info = await pose(page, ax, az, keys);
      report.push({ label, ...info });
      await page.screenshot({ path: join(SHOT_DIR, `${label}-1280x800.png`), type: 'png' });
      console.log('shot:', label, info);
    }

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await pose(page, 0.7, 0.7, []);
    await page.screenshot({ path: join(SHOT_DIR, 'aim-ne-390x844.png'), type: 'png' });
    console.log('shot: aim-ne-390x844');

    const ne = report.find((r) => r.label === 'aim-ne');
    const run = report.find((r) => r.label === 'run-e-aim-nw');
    if (!ne || ne.gunDir !== 'ne') {
      console.error('FAIL: aim-ne gunDir expected ne, got', ne);
      process.exitCode = 1;
    }
    if (!run || run.gunDir !== 'nw') {
      console.error('FAIL: run-e-aim-nw gunDir expected nw, got', run);
      process.exitCode = 1;
    }
    if (!run || run.bodyDir !== 'e') {
      console.error('FAIL: run-e-aim-nw bodyDir expected e, got', run);
      process.exitCode = 1;
    }

    if (errs.length) console.log('page errors:', errs.slice(0, 8));
    console.log('gun-8dir shots →', SHOT_DIR);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
