/**
 * Phase 6 multi-slot inventory HUD + swap offer screenshots (v0.9.28).
 * Run: node tests/phase6-inventory-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'phase6-inventory');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.28';
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
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 350));
  await page.click('#btn-play');
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.bossHazards = [];
    g.invuln = 99;
    g.px = 0; g.pz = 0;
    g.stopMove();
  });
  return errs;
}

async function shot(browser, base, { width, height, name, setup }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errs = await bootPlay(page, base);
  const meta = await page.evaluate((fnBody) => {
    // eslint-disable-next-line no-new-func
    const setup = new Function('return (' + fnBody + ')')();
    return setup(window.__swarm);
  }, setup.toString());
  if (meta && meta.showCards) {
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'level', WAIT);
  } else {
    await page.evaluate(() => {
      if (window.__swarm && window.__swarm.game) {
        // force HUD refresh
        window.__swarm.game.score += 0.001;
      }
    });
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));
  const out = join(SHOT_DIR, name);
  await page.screenshot({ path: out, type: 'png' });
  console.log('shot:', name, meta);
  if (errs.length) console.warn('pageerrors', errs.slice(0, 3));
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
    // start: mg only
    await shot(browser, base, {
      width: 1280, height: 800, name: 'slots-start-mg-1280x800.png',
      setup: `function (S) {
        const g = S.game;
        g.weaponSlots = ['mg', null, null, null];
        g.taken = {};
        return { slots: g.weaponSlots.slice(), showCards: false };
      }`,
    });

    await shot(browser, base, {
      width: 390, height: 844, name: 'slots-start-mg-390x844.png',
      setup: `function (S) {
        const g = S.game;
        g.weaponSlots = ['mg', null, null, null];
        g.taken = {};
        return { slots: g.weaponSlots.slice(), showCards: false };
      }`,
    });

    // multi filled
    await shot(browser, base, {
      width: 1280, height: 800, name: 'slots-multi-1280x800.png',
      setup: `function (S) {
        const g = S.game;
        g.laser = 2; g.shotgun = 1; g.rocket = 1;
        g.taken = { laser: 2, shotgun: 1, rocket: 1 };
        g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
        return { slots: g.weaponSlots.slice(), showCards: false };
      }`,
    });

    await shot(browser, base, {
      width: 390, height: 844, name: 'slots-multi-390x844.png',
      setup: `function (S) {
        const g = S.game;
        g.laser = 2; g.shotgun = 1; g.rocket = 1;
        g.taken = { laser: 2, shotgun: 1, rocket: 1 };
        g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
        return { slots: g.weaponSlots.slice(), showCards: false };
      }`,
    });

    // full → swap offer
    await shot(browser, base, {
      width: 1280, height: 800, name: 'offer-swap-full-1280x800.png',
      setup: `function (S) {
        const g = S.game;
        g.laser = 1; g.shotgun = 1; g.rocket = 1;
        g.taken = { laser: 1, shotgun: 1, rocket: 1 };
        g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
        g.pausedForLevel = false;
        g.pendingCards = null;
        g.gems.push({
          x: 0, z: 0, xp: 0, r: 0.22, life: 30, pop: 0, letter: 'W',
          kind: 'weapon', weapon: 'plasma', weaponIcon: '☢',
        });
        const { events } = g.step(1 / 30);
        const lu = events.find((e) => e.type === 'levelup' && e.from === 'pickup');
        if (!lu) return { ok: false, types: events.map((e) => e.type) };
        S.showLevelCards(lu.cards, { from: 'pickup' });
        return {
          ok: true, mode: lu.mode, showCards: true,
          actions: lu.cards.map((c) => c.pickupAction),
          title: (document.getElementById('level-title') || {}).textContent,
        };
      }`,
    });

    await shot(browser, base, {
      width: 390, height: 844, name: 'offer-swap-full-390x844.png',
      setup: `function (S) {
        const g = S.game;
        g.laser = 1; g.shotgun = 1; g.rocket = 1;
        g.taken = { laser: 1, shotgun: 1, rocket: 1 };
        g.weaponSlots = ['mg', 'laser', 'shotgun', 'rocket'];
        g.pausedForLevel = false;
        g.pendingCards = null;
        g.gems.push({
          x: 0, z: 0, xp: 0, r: 0.22, life: 30, pop: 0, letter: 'W',
          kind: 'weapon', weapon: 'grenade', weaponIcon: '💣',
        });
        const { events } = g.step(1 / 30);
        const lu = events.find((e) => e.type === 'levelup' && e.from === 'pickup');
        if (!lu) return { ok: false, types: events.map((e) => e.type) };
        S.showLevelCards(lu.cards, { from: 'pickup' });
        return { ok: true, mode: lu.mode, showCards: true, actions: lu.cards.map((c) => c.pickupAction) };
      }`,
    });
  } finally {
    await browser.close();
    server.close();
  }
  console.log('phase6-inventory shots done →', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
