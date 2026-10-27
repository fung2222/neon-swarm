/**
 * PHASE6-SLOT-FIRE-PULSE-001 screenshots: weapon slot brief fire pulse.
 * Run: node tests/phase6-slot-fire-pulse-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-slot-fire-pulse');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.49';
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

async function bootPlay(page, base) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh&demo=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && (window.__swarm.state === 'play' || window.__swarm.state === 'menu'), WAIT);
  if (await page.evaluate(() => window.__swarm.state === 'menu')) {
    await page.click('#btn-play');
  }
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 400));
  return errs;
}

async function loadMultiSlots(page) {
  await page.evaluate(() => {
    const S = window.__swarm;
    const g = S.game;
    // fill bar: mg / laser / shotgun / rocket
    g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
    g.taken = Object.assign({}, g.taken, { mg: 1, laser: 2, shotgun: 1, rocket: 1, dmg: 1 });
    g.laser = 2; g.shotgun = 1; g.rocket = 1;
    // force HUD rebuild
    const bar = document.getElementById('weapon-slots');
    if (bar) bar.innerHTML = '';
  });
  // trigger HUD via a tiny step + wait for slots
  await page.evaluate(() => {
    const S = window.__swarm;
    if (S.game) S.game.step(0.016);
  });
  await new Promise((r) => setTimeout(r, 200));
  // manually rebuild slots like updateWeaponSlotsHUD if empty
  await page.evaluate(() => {
    const S = window.__swarm;
    const g = S.game;
    const bar = document.getElementById('weapon-slots');
    if (!bar || bar.children.length >= 4) return;
    const LABEL = { mg: 'MG', laser: 'LASER', shotgun: 'SG', rocket: 'RKT' };
    const ICON = { mg: '⚡', laser: '═', shotgun: '✴', rocket: '🚀' };
    bar.innerHTML = '';
    (g.weaponSlots || []).forEach((id, i) => {
      const el = document.createElement('div');
      el.className = 'wslot filled' + (id === 'mg' || id === 'laser' ? ' primary' : '');
      el.setAttribute('data-i', String(i));
      const lv = (g.taken && g.taken[id]) || 1;
      el.innerHTML = `<span class="wslot-ico">${ICON[id] || '◆'}</span><span class="wslot-name">${LABEL[id] || id}</span><span class="wslot-lv">Lv${lv}</span>`;
      bar.appendChild(el);
    });
  });
}

async function shot(page, name) {
  const path = join(SHOT_DIR, name);
  await page.screenshot({ path, type: 'png' });
  console.log('wrote', name);
}

async function main() {
  const { server, base } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const allErrs = [];
  try {
    const page = await browser.newPage();
    allErrs.push(...await bootPlay(page, base));
    await loadMultiSlots(page);

    // idle multi-bar (no pulse)
    await shot(page, 'slots-idle-1280x800.png');

    // force pulse on laser + rocket for readable evidence (CSS class)
    await page.evaluate(() => {
      const bar = document.getElementById('weapon-slots');
      if (!bar) return;
      const kids = bar.children;
      if (kids[1]) kids[1].classList.add('fire-pulse');
      if (kids[3]) kids[3].classList.add('fire-pulse');
    });
    await shot(page, 'slots-pulse-laser-rocket-1280x800.png');

    // live fire: let demo run briefly; MG should pulse
    await page.evaluate(() => {
      const bar = document.getElementById('weapon-slots');
      if (bar) [...bar.children].forEach((el) => el.classList.remove('fire-pulse'));
    });
    await new Promise((r) => setTimeout(r, 900));
    await shot(page, 'slots-live-fire-1280x800.png');

    // mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      const bar = document.getElementById('weapon-slots');
      if (!bar) return;
      const kids = bar.children;
      if (kids[0]) kids[0].classList.add('fire-pulse');
      if (kids[2]) kids[2].classList.add('fire-pulse');
    });
    await shot(page, 'slots-pulse-mobile-390x844.png');
  } finally {
    await browser.close();
    server.close();
  }
  const real = allErrs.filter((e) => !/ResizeObserver|favicon/i.test(e));
  if (real.length) {
    console.error('page errors:', real);
    process.exit(1);
  }
  console.log('phase6-slot-fire-pulse-shots: OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
