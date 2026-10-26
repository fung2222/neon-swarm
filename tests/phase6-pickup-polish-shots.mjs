/**
 * Phase 6 pickup polish screenshots (v0.9.29).
 * Run: node tests/phase6-pickup-polish-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-pickup-polish');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.29';
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

async function prepOffer(page, mode) {
  return page.evaluate((m) => {
    const S = window.__swarm;
    const g = S.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.bossHazards = [];
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
    g.laser = 0; g.shotgun = 0; g.rocket = 0; g.grenade = 0; g.plasma = 0;
    g.taken = {};
    g.weaponSlots = ['mg', null, null, null];
    g.pausedForLevel = false;
    g.pendingCards = null;
    g.pendingFrom = null;
    let weapon = 'laser';
    if (m === 'upgrade') {
      g.laser = 1; g.taken.laser = 1; g.weaponSlots = ['mg', 'laser', null, null];
    } else if (m === 'max') {
      g.laser = 4; g.taken.laser = 4; g.weaponSlots = ['mg', 'laser', null, null];
      g.hp = Math.max(1, g.maxHp - 4);
    } else if (m === 'swap') {
      g.laser = 1; g.shotgun = 1; g.rocket = 1;
      g.taken = { laser: 1, shotgun: 1, rocket: 1 };
      g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
      weapon = 'plasma';
    } else if (m === 'keep') {
      // same as take visually; keep card is always present
      weapon = 'laser';
    }
    g.gems.push({
      x: 0, z: 0, xp: 0, r: 0.22, life: 30, pop: 0, letter: 'W',
      kind: 'weapon', weapon, weaponIcon: '═',
    });
    const { events } = g.step(1 / 30);
    const lu = events.find((e) => e.type === 'levelup' && e.from === 'pickup');
    if (!lu) return { ok: false, types: events.map((e) => e.type) };
    S.showLevelCards(lu.cards, { from: 'pickup' });
    // For swap, hover first swap card to light target slot
    if (m === 'swap') {
      const btn = document.querySelector('.level-card.has-swap');
      if (btn) btn.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    }
    return {
      ok: true,
      mode: lu.mode,
      n: lu.cards.length,
      actions: lu.cards.map((c) => c.pickupAction),
      title: (document.getElementById('level-title') || {}).textContent,
      slots: (g.weaponSlots || []).slice(),
    };
  }, mode);
}

async function shotViewport(browser, base, { width, height, name, mode }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 400));
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game && window.__swarm.showLevelCards, WAIT);
  await new Promise((r) => setTimeout(r, 350));
  const meta = await prepOffer(page, mode);
  if (!meta.ok) throw new Error('offer failed: ' + JSON.stringify(meta));
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'level', WAIT);
  await new Promise((r) => setTimeout(r, 500));
  const out = join(SHOT_DIR, name);
  await page.screenshot({ path: out, type: 'png' });
  console.log('shot:', name, meta);
  if (errs.length) console.warn('pageerrors', errs);
  await page.close();
  return out;
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
      '--ignore-gpu-blocklist',
    ],
  });
  try {
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'offer-take-1280x800.png', mode: 'take' });
    await shotViewport(browser, base, { width: 390, height: 844, name: 'offer-take-390x844.png', mode: 'take' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'offer-upgrade-1280x800.png', mode: 'upgrade' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'offer-swap-full-1280x800.png', mode: 'swap' });
    await shotViewport(browser, base, { width: 390, height: 844, name: 'offer-swap-full-390x844.png', mode: 'swap' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'offer-convertHeal-1280x800.png', mode: 'max' });
    await shotViewport(browser, base, { width: 1280, height: 800, name: 'offer-keep-1280x800.png', mode: 'keep' });
  } finally {
    await browser.close();
    server.close();
  }
  console.log('phase6-pickup-polish shots done →', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
