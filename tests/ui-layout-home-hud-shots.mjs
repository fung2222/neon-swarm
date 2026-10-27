/**
 * UI-LAYOUT-HOME-HUD-001 (v0.9.52) — menu + in-run top HUD screenshots.
 * Run: node tests/ui-layout-home-hud-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'ui-layout-home-hud');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.52';
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

async function shot(browser, base, { width, height, name, mode }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e && e.message ? e.message : e)));
  await page.goto(base + `/index.html?v=${VER}&lang=zh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'menu', WAIT);
  await new Promise((r) => setTimeout(r, 500));

  let meta = {};
  if (mode === 'menu') {
    meta = await page.evaluate(() => {
      const mute = document.getElementById('btn-mute-menu');
      const gear = document.getElementById('btn-settings-home');
      const cta = document.querySelector('#screen-start .menu-cta');
      const cards = [...document.querySelectorAll('.mech-card')];
      const on = cards.find((c) => c.classList.contains('on'));
      const cr = cta && cta.getBoundingClientRect();
      return {
        hasLooseMute: !!mute,
        hasGear: !!gear,
        ctaBottom: cr ? Math.round(window.innerHeight - cr.bottom) : null,
        selected: on ? (on.querySelector('b')?.textContent || '').trim() : null,
        cardCount: cards.length,
      };
    });
    await page.screenshot({ path: join(SHOT_DIR, name), type: 'png' });
  } else if (mode === 'settings') {
    await page.click('#btn-settings-home');
    await page.waitForSelector('.ck-settings, .ck-modal.ck-settings', WAIT);
    await new Promise((r) => setTimeout(r, 250));
    meta = await page.evaluate(() => {
      const mute = document.querySelector('[data-set="mute"]');
      return { settingsOpen: !!document.querySelector('.ck-settings'), hasMuteToggle: !!mute };
    });
    await page.screenshot({ path: join(SHOT_DIR, name), type: 'png' });
  } else if (mode === 'play') {
    await page.click('#btn-play');
    await page.waitForFunction(() => window.__swarm && window.__swarm.state === 'play' && window.__swarm.game, WAIT);
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const g = window.__swarm.game;
      g.enemies.length = 0;
      g.bullets.length = 0;
      g.gems.length = 0;
      g.bossHazards = [];
      g.invuln = 99;
      g.px = 0; g.pz = 0;
      g.stopMove();
      g.xp = Math.max(g.xp || 0, 12);
      g.xpNeed = g.xpNeed || 40;
      if (typeof g._syncWeaponSlotsHud === 'function') g._syncWeaponSlotsHud();
      else if (typeof g.renderWeaponSlots === 'function') g.renderWeaponSlots();
    });
    await new Promise((r) => setTimeout(r, 200));
    meta = await page.evaluate(() => {
      const xp = document.querySelector('.xp-bar, #xp-bar');
      const slots = document.querySelector('.weapon-slots, #weapon-slots');
      const xr = xp && xp.getBoundingClientRect();
      const sr = slots && slots.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      return {
        xpTop: xr ? Math.round(xr.top) : null,
        xpBottom: xr ? Math.round(xr.bottom) : null,
        slotsTop: sr ? Math.round(sr.top) : null,
        slotsBottom: sr ? Math.round(sr.bottom) : null,
        xpAboveMid: xr ? xr.bottom < mid : false,
        slotsAboveMid: sr ? sr.bottom < mid : false,
      };
    });
    await page.screenshot({ path: join(SHOT_DIR, name), type: 'png' });
  }

  await page.close();
  return { name, meta, errs };
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
      '--window-size=1280,800',
    ],
  });
  const jobs = [
    { width: 1280, height: 800, name: 'menu-desktop-1280x800.png', mode: 'menu' },
    { width: 390, height: 844, name: 'menu-mobile-390x844.png', mode: 'menu' },
    { width: 390, height: 844, name: 'settings-mobile-390x844.png', mode: 'settings' },
    { width: 1280, height: 800, name: 'play-desktop-1280x800.png', mode: 'play' },
    { width: 390, height: 844, name: 'play-mobile-390x844.png', mode: 'play' },
  ];
  const results = [];
  for (const j of jobs) {
    results.push(await shot(browser, base, j));
    console.log('shot', j.name, JSON.stringify(results[results.length - 1].meta));
  }
  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({ ver: VER, results }, null, 2));
  await browser.close();
  server.close();

  // Assertions
  const menu = results.find((r) => r.name.startsWith('menu-desktop'));
  if (menu?.meta?.hasLooseMute) throw new Error('loose menu mute still present');
  if (!menu?.meta?.hasGear) throw new Error('gear missing on menu');
  const settings = results.find((r) => r.name.startsWith('settings'));
  if (!settings?.meta?.hasMuteToggle) throw new Error('settings mute toggle missing');
  for (const r of results.filter((x) => x.mode === 'play' || x.name.startsWith('play-'))) {
    if (!r.meta.xpAboveMid || !r.meta.slotsAboveMid) {
      throw new Error(`XP/slots not in top half: ${r.name} ${JSON.stringify(r.meta)}`);
    }
  }
  console.log('ui-layout-home-hud-shots.mjs OK →', SHOT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
