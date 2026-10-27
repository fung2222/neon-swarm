/**
 * WEAPONS-HUD-OVERLAP-FIX-001 screenshots (v0.9.60).
 * Phone portrait 390×844 — prove no HUD overlap.
 * Run: node tests/weapons-hud-overlap-fix-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-hud-overlap-fix');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.60';
const WAIT = { timeout: 45000, polling: 250 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'application/svg+xml',
  '.woff2': 'font/woff2',
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

function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
}

function overlaps(a, b, pad = 1) {
  if (!a || !b || a.width <= 0 || b.width <= 0) return false;
  return !(a.right <= b.left + pad || b.right <= a.left + pad || a.bottom <= b.top + pad || b.bottom <= a.top + pad);
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
  await new Promise((r) => setTimeout(r, 600));

  const layout = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    g.loadout = {
      primary: ['gatling', 'ion_beam'],
      secondary: ['shotgun', 'acid_gun'],
      throw: ['frag', null],
    };
    g.weaponSlots = ['gatling', 'ion_beam', 'shotgun', 'acid_gun', 'frag', null];
    g.weaponBranches = { gatling: 'A' };
    g.fireMode = 'primary';
    g.kills = 19;
    const goalLeft = document.getElementById('goal-left');
    if (goalLeft) goalLeft.textContent = '19';
    const rail = document.getElementById('weapon-rail');
    if (rail) delete rail.dataset.built;
    window.__swarm.syncWeaponHud();

    const q = (sel) => document.querySelector(sel);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) };
    };
    const hit = (a, b) => {
      if (!a || !b || a.width <= 0 || b.width <= 0) return false;
      return !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
    };
    const left = box(q('.hud-left'));
    const right = box(q('.hud-right'));
    const btns = box(q('.hud-buttons.top'));
    const xp = box(q('.xp-bar'));
    const wstat = box(q('#weapon-status'));
    const goal = box(q('#hud-goal'));
    const zone = box(q('#hud-zone'));
    const railBox = box(q('#weapon-rail'));
    const stick = box(q('#stick'));
    const pairs = [
      ['wstat-vs-left', wstat, left],
      ['wstat-vs-right', wstat, right],
      ['wstat-vs-xp', wstat, xp],
      ['wstat-vs-btns', wstat, btns],
      ['xp-vs-left', xp, left],
      ['xp-vs-right', xp, right],
      ['goal-vs-xp', goal, xp],
      ['goal-vs-wstat', goal, wstat],
      ['zone-vs-goal', zone, goal],
      ['zone-vs-wstat', zone, wstat],
      ['rail-vs-stick', railBox, stick],
    ];
    const overlaps = {};
    for (const [k, a, b] of pairs) overlaps[k] = hit(a, b);
    const cs = getComputedStyle(document.documentElement);
    return {
      tokens: {
        row1: cs.getPropertyValue('--hud-row1-top').trim(),
        xp: cs.getPropertyValue('--hud-xp-top').trim(),
        wstat: cs.getPropertyValue('--hud-wstat-top').trim(),
        side: cs.getPropertyValue('--hud-side-top').trim(),
        stickClear: cs.getPropertyValue('--hud-stick-clear').trim(),
      },
      boxes: { left, right, btns, xp, wstat, goal, zone, rail: railBox, stick },
      overlaps,
      statusName: (document.getElementById('wstat-name') || {}).textContent || '',
      railNames: [...document.querySelectorAll('#weapon-rail .wslot-name')].map((el) => el.textContent),
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });

  await page.screenshot({ path: join(SHOT_DIR, '01-top-strip-clear.png'), type: 'png', clip: { x: 0, y: 0, width: 390, height: 220 } });
  await page.screenshot({ path: join(SHOT_DIR, '02-full-phone-hud.png'), type: 'png' });
  await page.screenshot({ path: join(SHOT_DIR, '03-bottom-rail-stick.png'), type: 'png', clip: { x: 0, y: 844 - 220, width: 390, height: 220 } });

  // secondary armed — status still under XP
  await page.evaluate(() => {
    window.__swarm.game.activateSecondaryFromTap();
    window.__swarm.syncWeaponHud();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(SHOT_DIR, '04-secondary-status-under-xp.png'), type: 'png', clip: { x: 0, y: 0, width: 390, height: 240 } });

  const bad = Object.entries(layout.overlaps).filter(([, v]) => v).map(([k]) => k);
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER,
    task: 'WEAPONS-HUD-OVERLAP-FIX-001',
    layout,
    overlapFailures: bad,
    pageErrors: errs.slice(0, 8),
    shots: [
      '01-top-strip-clear.png',
      '02-full-phone-hud.png',
      '03-bottom-rail-stick.png',
      '04-secondary-status-under-xp.png',
    ],
  }, null, 2));

  await browser.close();
  server.close();
  console.log('weapons-hud-overlap-fix shots OK', { overlaps: layout.overlaps, bad, status: layout.statusName });
  if (bad.length) {
    console.error('OVERLAP FAILURES', bad);
    process.exit(2);
  }
  if (errs.length) console.warn('page errors', errs.slice(0, 5));
}

main().catch((e) => { console.error(e); process.exit(1); });
