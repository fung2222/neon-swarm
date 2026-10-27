/**
 * WEAPONS-LEGACY-PURGE-001 screenshots (v0.9.58).
 * Level-up offers show catalog names only (no 鐳射炮 / 火箭炮).
 * Run: node tests/weapons-legacy-purge-shots.mjs
 */
import http from 'http';
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'tests', 'screenshots', 'weapons-legacy-purge');
mkdirSync(SHOT_DIR, { recursive: true });
const CHROME = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/google-chrome');
const VER = '0.9.58';
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
  await new Promise((r) => setTimeout(r, 350));

  const offerMeta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.enemies.length = 0;
    g.invuln = 99;
    const byId = window.__swarm.CARDS_BY_ID || {};
    // Force a catalog-only level-up offer
    const ids = ['ion_beam', 'tracking_bomb', 'acid_gun'];
    const cards = ids.map((id) => byId[id]).filter(Boolean);
    g.pendingCards = cards;
    g.pausedForLevel = true;
    g.pendingFrom = 'level';
    window.__swarm.state = 'level';
    window.__swarm.showLevelCards(cards, { from: 'level' });
    const box = document.getElementById('level-cards');
    const text = (box && box.innerText) || '';
    const titles = [...(box ? box.querySelectorAll('.card-title, .lc-title, .card h3, .card .zh, [data-card-zh]') : [])]
      .map((el) => el.textContent.trim());
    // Fallback: any card button text
    const allCardText = [...(box ? box.querySelectorAll('.card, button.card, .level-card') : [])]
      .map((el) => el.innerText.replace(/\s+/g, ' ').trim());
    return {
      cardCount: cards.length,
      text,
      titles,
      allCardText,
      hasLaser: /鐳射炮/.test(text),
      hasRocket: /火箭炮/.test(text),
      hasIon: /離子光束/.test(text),
      hasTrack: /追蹤爆彈/.test(text),
      hasAcid: /硫酸槍/.test(text),
      hasBareMg: /(^|[^關])機槍([^堡壘]|$)/.test(text) && !/機關雷射炮/.test(text),
    };
  });

  await page.screenshot({ path: join(SHOT_DIR, '01-levelup-catalog-names.png'), type: 'png' });

  // Second offer: mix of buffs + catalog (dmg reworded off 機槍)
  const buffMeta = await page.evaluate(() => {
    const byId = window.__swarm.CARDS_BY_ID || {};
    const cards = ['dmg', 'frag', 'zero_laser'].map((id) => byId[id]).filter(Boolean);
    const g = window.__swarm.game;
    g.pendingCards = cards;
    window.__swarm.showLevelCards(cards, { from: 'level' });
    const box = document.getElementById('level-cards');
    const text = (box && box.innerText) || '';
    return {
      text,
      hasMgInDmg: /機槍/.test(text),
      hasFrag: /破片榴彈/.test(text),
      hasZero: /零度激光/.test(text),
      hasFirepower: /火力強化/.test(text),
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '02-levelup-buffs-no-mg-copy.png'), type: 'png' });

  // Over-screen loadout uses catalog names
  const overMeta = await page.evaluate(() => {
    const g = window.__swarm.game;
    g.weaponSlots = ['gatling', 'ion_beam', 'frag', null, null, null];
    g.ion_beam = 2; g.frag = 1; g.gatling = 1;
    g.pausedForLevel = false;
    g.pendingCards = null;
    // hide level overlay if possible
    const overlay = document.getElementById('level-overlay') || document.getElementById('level');
    if (overlay) overlay.classList.add('hidden');
    const line = window.__swarm.formatLoadoutFromGame
      ? window.__swarm.formatLoadoutFromGame(g, window.__swarm.CARDS_BY_ID, true)
      : '';
    const el = document.getElementById('over-loadout');
    if (el) el.textContent = line;
    // Show over panel briefly for shot
    const over = document.getElementById('over');
    if (over) { over.classList.remove('hidden'); over.style.display = 'flex'; }
    return {
      line,
      hasLegacy: /鐳射炮|火箭炮|(^|[^關])機槍/.test(line),
      hasCatalog: /機關雷射炮/.test(line) && /離子光束/.test(line),
    };
  });
  await page.screenshot({ path: join(SHOT_DIR, '03-over-loadout-catalog.png'), type: 'png' });

  writeFileSync(join(SHOT_DIR, 'meta.json'), JSON.stringify({
    ver: VER, task: 'WEAPONS-LEGACY-PURGE-001', offerMeta, buffMeta, overMeta, errs,
    at: new Date().toISOString(),
  }, null, 2));

  await browser.close();
  server.close();

  if (errs.length) { console.error('pageerrors', errs); process.exit(1); }
  if (!offerMeta.hasIon || !offerMeta.hasTrack || offerMeta.hasLaser || offerMeta.hasRocket) {
    console.error('level-up offer still shows legacy names', offerMeta);
    process.exit(1);
  }
  if (buffMeta.hasMgInDmg) {
    console.error('dmg/buff copy still mentions 機槍', buffMeta);
    process.exit(1);
  }
  if (!overMeta.hasCatalog || overMeta.hasLegacy) {
    console.error('over loadout legacy names', overMeta);
    process.exit(1);
  }
  console.log('weapons-legacy-purge shots OK', SHOT_DIR, { offerMeta, buffMeta, overMeta });
}

main().catch((e) => { console.error(e); process.exit(1); });
