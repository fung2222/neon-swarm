/**
 * Phase 6 level-up card UX screenshots (v0.9.31).
 * Run: node tests/phase6-levelup-ux-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { CARDS, CARDS_BY_ID, buildWeaponPickupOffer } from '../js/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-levelup-ux');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.31';
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

function pickCardsByIds(ids) {
  return ids.map((id) => {
    const c = CARDS_BY_ID[id] || CARDS.find((x) => x.id === id);
    if (!c) throw new Error('missing card ' + id);
    return c;
  });
}

async function bootPlay(page, base) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 300));
  await page.click('#btn-play');
  await page.waitForFunction(
    () => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game && window.__swarm.showLevelCards,
    WAIT,
  );
  await new Promise((r) => setTimeout(r, 350));
  return errs;
}

async function openLevel(page, { ids, mode, from }) {
  return page.evaluate((opts) => {
    const S = window.__swarm;
    const g = S.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.invuln = 99;
    g.stopMove();
    g.taken = g.taken || {};
    g.taken.mg = Math.max(g.taken.mg || 1, 2);
    if (opts.mode === 'stacked') {
      g.taken.laser = 2;
      g.laser = 2;
      if (!(g.weaponSlots || []).includes('laser')) {
        const i = g.weaponSlots.findIndex((s) => s == null);
        if (i >= 0) g.weaponSlots[i] = 'laser';
      }
    }
    if (opts.mode === 'fullslots') {
      g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
      g.taken.laser = 1; g.laser = 1;
      g.taken.shotgun = 1; g.shotgun = 1;
      g.taken.rocket = 1; g.rocket = 1;
    }
    if (opts.mode === 'emptyslot') {
      g.weaponSlots = ['mg', null, null, null];
    }
    // Cards are passed as plain JSON from Node; rehydrate apply from game config via id.
    const cards = opts.cards;
    g.pendingCards = cards;
    g.pausedForLevel = true;
    g.pendingFrom = opts.from || 'level';
    S.showLevelCards(cards, { from: opts.from || 'level' });
    const box = document.getElementById('level-cards');
    return {
      n: box ? box.children.length : 0,
      classes: box ? box.className : '',
      titles: box ? [...box.querySelectorAll('.card-title')].map((el) => el.textContent) : [],
      counts: box ? [...box.querySelectorAll('.card-count')].map((el) => el.textContent.trim()) : [],
      hints: box ? [...box.querySelectorAll('.card-slot-hint')].map((el) => el.textContent) : [],
      state: S.state,
    };
  }, { cards: ids.map((id) => {
    const c = CARDS_BY_ID[id];
    // Strip apply functions for structured clone; showLevelCards only needs display fields + id/kind/max/shape
    return {
      id: c.id, kind: c.kind, zh: c.zh, en: c.en, descZh: c.descZh, descEn: c.descEn,
      max: c.max, shape: c.shape, icon: c.icon, healAmount: c.healAmount,
    };
  }), mode, from });
}

async function openPickup(page, weaponId, mode) {
  return page.evaluate((opts) => {
    const S = window.__swarm;
    const g = S.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.invuln = 99;
    g.stopMove();
    if (opts.mode === 'full') {
      g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
      g.taken.laser = 1; g.laser = 1;
      g.taken.shotgun = 1; g.shotgun = 1;
      g.taken.rocket = 1; g.rocket = 1;
    } else {
      g.weaponSlots = ['mg', null, null, null];
    }
    const offer = g._offerWeaponPickup(opts.weaponId);
    S.showLevelCards(g.pendingCards, { from: 'pickup' });
    const box = document.getElementById('level-cards');
    return {
      n: box ? box.children.length : 0,
      classes: box ? box.className : '',
      titles: box ? [...box.querySelectorAll('.card-title')].map((el) => el.textContent) : [],
      state: S.state,
      from: g.pendingFrom,
      mode: offer && offer.mode,
    };
  }, { weaponId, mode });
}

async function shot(browser, base, { width, height, name, setup }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errs = await bootPlay(page, base);
  const meta = await setup(page);
  await new Promise((r) => setTimeout(r, 500));
  const out = join(SHOT_DIR, name);
  await page.screenshot({ path: out, type: 'png' });
  console.log('shot:', name, meta);
  if (errs.length) console.warn('pageerrors', errs.slice(0, 5));
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
    // 3-card mix: weapon + armor + util
    await shot(browser, base, {
      width: 1280, height: 800, name: 'levelup-mix-1280x800.png',
      setup: (page) => openLevel(page, { ids: ['laser', 'armor', 'magnet'], mode: 'emptyslot', from: 'level' }),
    });
    await shot(browser, base, {
      width: 390, height: 844, name: 'levelup-mix-390x844.png',
      setup: (page) => openLevel(page, { ids: ['laser', 'armor', 'magnet'], mode: 'emptyslot', from: 'level' }),
    });
    // Stacked weapon (2/4 laser) + rate + heal
    await shot(browser, base, {
      width: 1280, height: 800, name: 'levelup-stacked-1280x800.png',
      setup: (page) => openLevel(page, { ids: ['laser', 'rate', 'speed'], mode: 'stacked', from: 'level' }),
    });
    // Full slots → new plasma shows swap-need hint
    await shot(browser, base, {
      width: 1280, height: 800, name: 'levelup-slot-hint-1280x800.png',
      setup: (page) => openLevel(page, { ids: ['plasma', 'armor', 'magnet'], mode: 'fullslots', from: 'level' }),
    });
    // Pickup offer still OK
    await shot(browser, base, {
      width: 1280, height: 800, name: 'pickup-offer-1280x800.png',
      setup: (page) => openPickup(page, 'laser', 'empty'),
    });
    await shot(browser, base, {
      width: 390, height: 844, name: 'pickup-offer-390x844.png',
      setup: (page) => openPickup(page, 'laser', 'empty'),
    });
  } finally {
    await browser.close();
    server.close();
  }
  console.log('phase6-levelup-ux shots done →', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
